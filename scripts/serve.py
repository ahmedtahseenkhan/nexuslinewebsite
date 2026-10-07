#!/usr/bin/env python3
"""Local preview server that mimics Cloudflare Workers static assets.

    python3 scripts/serve.py            # http://localhost:8000
    python3 scripts/serve.py 8080

Behaves like production so you can test before pushing:
  * clean URLs  — /platform serves platform.html; /platform.html redirects to /platform
  * _redirects  — static "from to status" rules
  * _headers    — "/*" and exact-path rules (security headers, caching)
  * 404.html    — served with status 404 for anything that does not exist

Standard library only; no install needed.
"""
import http.server
import os
import sys
from urllib.parse import urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def parse_redirects():
    rules = {}
    path = os.path.join(ROOT, "_redirects")
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            parts = line.split("#", 1)[0].split()
            if len(parts) >= 2:
                rules[parts[0]] = (parts[1], int(parts[2]) if len(parts) > 2 else 302)
    return rules


def parse_headers():
    rules, current = [], None
    path = os.path.join(ROOT, "_headers")
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            if not line.strip() or line.lstrip().startswith("#"):
                continue
            if not line[0].isspace():
                current = (line.strip(), [])
                rules.append(current)
            elif current and ":" in line:
                name, value = line.strip().split(":", 1)
                current[1].append((name.strip(), value.strip()))
    return rules


def matches(pattern, path):
    if pattern.endswith("*"):
        return path.startswith(pattern[:-1])
    return path == pattern


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        path = urlsplit(self.path).path
        for pattern, headers in parse_headers():
            if matches(pattern, path):
                for name, value in headers:
                    self.send_header(name, value)
        super().end_headers()

    def redirect(self, location, status):
        self.send_response(status)
        self.send_header("Location", location)
        self.end_headers()

    def do_GET(self):
        url = urlsplit(self.path)
        path, query = url.path, ("?" + url.query if url.query else "")
        rule = parse_redirects().get(path)
        if rule:
            return self.redirect(rule[0] + query, rule[1])
        if path.endswith(".html"):  # Cloudflare's auto-trailing-slash drops .html
            clean = "/" if path == "/index.html" else path[:-5]
            return self.redirect(clean + query, 307)
        fs = os.path.join(ROOT, path.lstrip("/"))
        if path != "/" and not os.path.splitext(path)[1] and os.path.isfile(fs + ".html"):
            self.path = path + ".html" + query
        elif not os.path.exists(fs) or os.path.basename(path).startswith("."):
            return self.not_found()
        return super().do_GET()

    def not_found(self):
        body = open(os.path.join(ROOT, "404.html"), "rb").read()
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"Serving {ROOT} on http://localhost:{port}")
    http.server.ThreadingHTTPServer(("", port), Handler).serve_forever()
