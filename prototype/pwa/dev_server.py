#!/usr/bin/env python3
"""Local demo / screenshot server. Does not talk to the live Surface."""

import json
import mimetypes
import os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        try:
            self.log_error("pwa-dev " + (fmt % args))
        except Exception:
            pass

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path in ("/", "/app"):
            self.send_response(302)
            self.send_header("Location", "/app/")
            self.end_headers()
            return
        if path.startswith("/app/"):
            rel = path[len("/app/"):] or "index.html"
            return self._file(rel)
        if path == "/health":
            return self._json(200, {"ok": True, "role": "pwa-dev"})
        self.send_error(404)

    def _file(self, rel):
        safe = os.path.normpath(rel).lstrip("/")
        if safe.startswith(".."):
            self.send_error(403)
            return
        target = os.path.join(HERE, safe)
        if os.path.isdir(target):
            target = os.path.join(target, "index.html")
        if not os.path.isfile(target):
            target = os.path.join(HERE, "index.html")
        ctype = mimetypes.guess_type(target)[0] or "application/octet-stream"
        if target.endswith(".webmanifest"):
            ctype = "application/manifest+json"
        if target.endswith(".js"):
            ctype = "text/javascript; charset=utf-8"
        data = open(target, "rb").read()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def _json(self, code, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(os.environ.get("PWA_PORT", "4173"))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print("PWA demo at http://127.0.0.1:%s/app/?demo=1" % port, flush=True)
    server.serve_forever()
