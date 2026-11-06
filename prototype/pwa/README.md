# Family Display home-screen web app

A Progressive Web App that matches the iPhone app: Calendar, Chores (with Rewards),
Food (Meals and Recipes), Groceries, Photos, plus Remote and Settings. It talks to
the same Bearer-token phone API and is meant to be served from the Surface at `/app/`
so there are no CORS issues.

This branch does **not** change anything on the live Surface. Deploy only after Juito
gives the go, and only after a family-call idle check and a backup.

## Try it locally (no Surface)

```
python3 prototype/pwa/dev_server.py
# open http://127.0.0.1:4173/app/?demo=1
```

`?demo=1` uses bundled sample data. `?theme=dark` or `?theme=light` forces a theme.
`?screen=calendar|chores|rewards|meals|recipes|groceries|photos|remote|settings|lock|pair`
jumps to that screen. `?now=15:45` pins the red now line. `?confirm=event` shows the
"Are you sure?" delete dialog.

## Add to the iPhone Home Screen

1. Open the app over **https** (Face ID will not appear on plain `http://192.168.50.223`).
2. Safari → Share → Add to Home Screen.
3. It opens full screen (`standalone`), with safe-area insets for the notch and home indicator.

Pairing: enter the code from the display (Settings → Phone app → Pair a phone) and the
display address. The device token is stored in this browser (Safari / Home Screen).

## Face ID

The lock screen uses WebAuthn platform passkeys (`authenticatorAttachment: "platform"`,
`userVerification: "required"`). On an iPhone that is Face ID.

WebAuthn only works in a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts):
`https:` with a certificate Safari trusts, or `localhost`. Plain LAN `http://192.168.50.223:8080`
is not enough.

Server routes (Bearer required):

- `GET /api/webauthn/status`
- `POST /api/webauthn/register/options`
- `POST /api/webauthn/register`
- `POST /api/webauthn/login/options`
- `POST /api/webauthn/login`
- `DELETE /api/webauthn`

The passkey is stored on the paired device record. The pairing token is separate; Face ID
unlocks the UI on this phone.

## HTTPS options (pick one before Face ID will work)

### 1. Tailscale HTTPS — recommended

The pairing spec already planned Tailscale for when Juito is away
(`surface/TAILSCALE-SETUP.md`). MagicDNS plus **HTTPS Certificates** in the Tailscale
admin console gives a real Let’s Encrypt cert for `https://<machine>.<tailnet>.ts.net`.
Safari trusts it, so Face ID and the service worker both work, at home and away. Nothing
has to be installed on the iPhone besides the Tailscale app.

After Tailscale is on the Surface (that setup is still waiting for Juito’s go):

1. Admin console → DNS → enable MagicDNS and HTTPS Certificates.
2. On the Surface: `sudo tailscale serve --bg 8080`
   (or `tailscale cert` and point a TLS terminator at fd-upload).
3. On the iPhone, with Tailscale connected, open `https://<machine>.<tailnet>.ts.net/app/`
   and Add to Home Screen.

`tailscale serve` proxies HTTPS on the MagicDNS name to the existing port 8080. It does
not replace LAN `http://192.168.50.223:8080`. The Home Screen icon should use the https URL.

Machine names appear in Certificate Transparency when HTTPS Certificates are on; Tailscale
lets you pick a randomized tailnet name if that matters.

### 2. mkcert local CA

Works on home Wi-Fi without Tailscale. Generate a cert for `family-display.lan` (or the
Surface’s LAN name), install the mkcert CA as a profile on the iPhone, then enable
**Full Trust** under Settings → General → About → Certificate Trust Settings. Safari
will then treat that name as https. More fiddly, LAN only, and every new iPhone needs the
profile.

### 3. A real domain with Let’s Encrypt DNS-01

If Juito has a domain, create a name (for example `display.example.com`) with a DNS-01
Let’s Encrypt cert and point it at `192.168.50.223` on the home network (split DNS or a
hosts-style override). Safari trusts it with no profile. Needs a domain and cert renewal
on the Surface. Do not port-forward 8080 to the public internet.

**Pick:** Tailscale HTTPS. It is the least fiddly on an iPhone, uses a certificate Safari
already trusts, and is the same tunnel the native app already planned for away-from-home.

## Serving from the phone API

`familyapi.serve_pwa` serves `prototype/pwa/` (deployed to `/opt/family-display/pwa/`) at
`/app/` from fd-upload. `GET /` still redirects to `/upload` so existing photo-upload
links keep working.

## Smooth scrolling

Native overflow scrolling (`-webkit-overflow-scrolling: touch`), no scroll listeners,
`content-visibility: auto` on rows, GPU `translate3d` for swipe-to-delete (horizontal
only; vertical scrolling is left to the browser), reserved thumbnail sizes, and lazy
photo fetches with the Bearer token (because `<img src>` cannot send it).

## What the native app can do that this PWA cannot

- The **Share → Send to Family Display** share extension.
- System **Local Authentication** Face ID without https (the PWA needs WebAuthn + https).
- Bonjour discovery of the display (the PWA uses the typed address, or same-origin `/app/`).
- The native Photos picker and QR scanner (the PWA uses the file picker and a typed pairing code).
- Keychain sharing with the share extension.
- Some of UIKit’s swipe-action physics and haptics.
- ProMotion 120 Hz scrolling is close in Safari but not identical to UIKit.

The full quick-add forms (routines, up-for-grabs, custom repeat, event edit) are simpler
here than in the native sheet. The important day-to-day flows are covered: browse, check
off, add, swipe-delete with “Are you sure?”, meal pick, recipe open/rate, grocery undo,
remote, parent PIN, Face ID lock.

## Deploy (only after Juito says go)

1. Confirm family-call is idle (no call on the display).
2. Backup on the Surface, for example:
   `cp -a /opt/family-display /opt/family-display/backup-YYYYMMDD-pwa`
3. Copy from this worktree:
   - `prototype/pwa/` → `/opt/family-display/pwa/`
   - `prototype/server/familyapi.py`, `logd.py`, `webauthn_pwa.py` → `/opt/family-display/server/`
4. Restart only the phone server: `systemctl restart fd-upload`
   Do not restart the kiosk or `family-display-logd` for this change.
5. Check `curl -fsS http://127.0.0.1:8080/health` and open `/app/` from a phone on the LAN.
