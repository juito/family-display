const KEY = "fd.pwa.session.v1";

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function saveSession(session) {
  if (!session) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(session));
}

export function apiBase() {
  const session = loadSession();
  if (session && session.base && !location.pathname.startsWith("/app")) return session.base.replace(/\/$/, "");
  return "";
}

function headers(extra = {}, parent) {
  const session = loadSession();
  const out = { Accept: "application/json", ...extra };
  if (session && session.token) out.Authorization = `Bearer ${session.token}`;
  if (parent) out["X-Parent-Token"] = parent;
  return out;
}

export class ApiError extends Error {
  constructor(code, message, error, body) {
    super(message || error || "Request failed");
    this.code = code;
    this.error = error;
    this.body = body;
  }
}

async function send(method, path, { body, parent, raw, headers: extra } = {}) {
  const base = apiBase();
  const opts = { method, headers: headers(extra, parent) };
  if (body instanceof ArrayBuffer || body instanceof Blob || body instanceof Uint8Array) {
    opts.body = body;
  } else if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const response = await fetch(base + path, opts);
  if (raw) return response;
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!response.ok) {
    throw new ApiError(response.status, data.message || data.error, data.error, data);
  }
  return data;
}

export const api = {
  health: () => send("GET", "/health"),
  status: () => send("GET", "/api/status"),
  snapshot: () => send("GET", "/api/state"),
  members: () => send("GET", "/api/members"),
  claim: (payload) => send("POST", "/api/pair/claim", { body: payload }),
  revoke: (id, parent) => send("DELETE", `/api/devices/${encodeURIComponent(id)}`, { parent }),
  verifyPin: (pin) => send("POST", "/api/parent/verify", { body: { pin } }),
  lockParent: () => send("POST", "/api/parent/lock"),
  addChore: (draft) => send("POST", "/api/chores", { body: draft }),
  setChoreDone: (id, done) => send("PATCH", `/api/chores/${encodeURIComponent(id)}`, { body: { done } }),
  deleteChore: (id, parent) => send("DELETE", `/api/chores/${encodeURIComponent(id)}`, { parent }),
  addGrocery: (text) => send("POST", "/api/lists/groceries/items", { body: { text } }),
  setGroceryDone: (id, done) => send("PATCH", `/api/lists/groceries/items/${encodeURIComponent(id)}`, { body: { done } }),
  deleteGrocery: (id) => send("DELETE", `/api/lists/groceries/items/${encodeURIComponent(id)}`),
  clearDoneGroceries: () => send("POST", "/api/lists/groceries/clear-done"),
  redeem: (id, parent) => send("POST", `/api/rewards/${encodeURIComponent(id)}/redeem`, { parent }),
  deleteReward: (id, parent) => send("DELETE", `/api/rewards/${encodeURIComponent(id)}`, { parent }),
  giveStars: (memberId, stars, reason, parent) =>
    send("POST", `/api/members/${encodeURIComponent(memberId)}/stars`, { body: { stars, reason }, parent }),
  events: (from, to) => send("GET", `/api/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&calendar=${encodeURIComponent("EBI & EBI")}`),
  addEvent: (draft) => send("POST", "/api/calendar/events", { body: draft }),
  updateEvent: (id, scope, patch) => send("PATCH", `/api/calendar/events/${encodeURIComponent(id)}?scope=${encodeURIComponent(scope)}`, { body: patch }),
  deleteEvent: (id, scope, parent) => send("DELETE", `/api/calendar/events/${encodeURIComponent(id)}?scope=${encodeURIComponent(scope)}`, { parent }),
  meals: (from, to) => send("GET", `/api/meals?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  setMeal: (date, slot, meal) => send("PUT", `/api/meals/${date}/${slot}`, { body: meal }),
  clearMeal: (date, slot, parent) => send("DELETE", `/api/meals/${date}/${slot}`, { parent }),
  recipes: () => send("GET", "/api/recipes"),
  rateRecipe: (id, rating) => send("PATCH", `/api/recipes/${encodeURIComponent(id)}`, { body: { rating } }),
  deleteRecipe: (id, parent) => send("DELETE", `/api/recipes/${encodeURIComponent(id)}`, { parent }),
  colors: () => send("GET", "/api/calendar/colors"),
  remote: (cmd) => send("POST", `/api/remote/${cmd}`),
  brightness: (percent) => send("POST", "/api/remote/brightness", { body: { percent } }),
  webauthnStatus: () => send("GET", "/api/webauthn/status"),
  webauthnRegisterOptions: () => send("POST", "/api/webauthn/register/options"),
  webauthnRegister: (body) => send("POST", "/api/webauthn/register", { body }),
  webauthnLoginOptions: () => send("POST", "/api/webauthn/login/options"),
  webauthnLogin: (body) => send("POST", "/api/webauthn/login", { body }),
  webauthnClear: () => send("DELETE", "/api/webauthn"),
  async uploadPhoto(data, contentType, recipeId) {
    const path = recipeId ? `/upload?recipe=${encodeURIComponent(recipeId)}` : "/upload";
    const response = await send("POST", path, { body: data, raw: true, headers: { "Content-Type": contentType || "image/jpeg" } });
    const text = await response.text();
    let parsed = {};
    try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = {}; }
    if (!response.ok) throw new ApiError(response.status, parsed.message || parsed.error, parsed.error, parsed);
    return parsed;
  },
  async image(path) {
    const response = await send("GET", path, { raw: true });
    if (!response.ok) throw new ApiError(response.status, "photo missing");
    return response.blob();
  }
};
