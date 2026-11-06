import { api, loadSession } from "./api.js";

const CRED_KEY = "fd.pwa.webauthn.v1";

export function loadCred() {
  try { return JSON.parse(localStorage.getItem(CRED_KEY) || "null"); } catch { return null; }
}

export function saveCred(cred) {
  if (!cred) localStorage.removeItem(CRED_KEY);
  else localStorage.setItem(CRED_KEY, JSON.stringify(cred));
}

export function secureContext() {
  return window.isSecureContext === true;
}

export function webauthnAvailable() {
  return secureContext() && typeof window.PublicKeyCredential === "function";
}

function b64url(bytes) {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

function randomChallenge() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes.buffer;
}

export async function registerPasskey() {
  if (!webauthnAvailable()) throw new Error("Face ID needs a secure (https) connection.");
  const session = loadSession();
  let options;
  try {
    options = await api.webauthnRegisterOptions();
  } catch {
    options = null;
  }
  const publicKey = options && options.publicKey ? revive(options.publicKey) : {
    challenge: randomChallenge(),
    rp: { name: "Family Display", id: location.hostname },
    user: {
      id: new TextEncoder().encode((session && session.deviceId) || "phone"),
      name: (session && session.deviceName) || "Family iPhone",
      displayName: (session && session.displayName) || "Family Display"
    },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "preferred"
    },
    timeout: 60000,
    attestation: "none"
  };
  const cred = await navigator.credentials.create({ publicKey });
  if (!cred) throw new Error("Face ID was cancelled.");
  const payload = serializeAttestation(cred);
  try { await api.webauthnRegister(payload); } catch { /* local unlock still works */ }
  saveCred({ id: cred.id, rawId: b64url(cred.rawId) });
  return cred;
}

export async function unlockWithPasskey() {
  if (!webauthnAvailable()) throw new Error("Face ID needs a secure (https) connection.");
  const stored = loadCred();
  let options;
  try {
    options = await api.webauthnLoginOptions();
  } catch {
    options = null;
  }
  const publicKey = options && options.publicKey ? revive(options.publicKey) : {
    challenge: randomChallenge(),
    rpId: location.hostname,
    timeout: 60000,
    userVerification: "required",
    allowCredentials: stored ? [{ type: "public-key", id: fromB64url(stored.rawId) }] : []
  };
  const assertion = await navigator.credentials.get({ publicKey });
  if (!assertion) throw new Error("Face ID was cancelled.");
  try { await api.webauthnLogin(serializeAssertion(assertion)); } catch { /* platform already verified */ }
  return assertion;
}

function revive(publicKey) {
  const copy = { ...publicKey };
  if (typeof copy.challenge === "string") copy.challenge = fromB64url(copy.challenge);
  if (copy.user && typeof copy.user.id === "string") copy.user = { ...copy.user, id: fromB64url(copy.user.id) };
  if (Array.isArray(copy.allowCredentials)) {
    copy.allowCredentials = copy.allowCredentials.map((c) => ({
      ...c,
      id: typeof c.id === "string" ? fromB64url(c.id) : c.id
    }));
  }
  if (Array.isArray(copy.excludeCredentials)) {
    copy.excludeCredentials = copy.excludeCredentials.map((c) => ({
      ...c,
      id: typeof c.id === "string" ? fromB64url(c.id) : c.id
    }));
  }
  return copy;
}

function serializeAttestation(cred) {
  const res = cred.response;
  return {
    id: cred.id,
    rawId: b64url(cred.rawId),
    type: cred.type,
    response: {
      clientDataJSON: b64url(res.clientDataJSON),
      attestationObject: b64url(res.attestationObject)
    }
  };
}

function serializeAssertion(cred) {
  const res = cred.response;
  return {
    id: cred.id,
    rawId: b64url(cred.rawId),
    type: cred.type,
    response: {
      clientDataJSON: b64url(res.clientDataJSON),
      authenticatorData: b64url(res.authenticatorData),
      signature: b64url(res.signature),
      userHandle: res.userHandle ? b64url(res.userHandle) : null
    }
  };
}
