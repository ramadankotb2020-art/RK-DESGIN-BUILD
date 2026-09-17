#!/usr/bin/env python3
"""سيرفر المعاينة — يفتح الموقع الجديد (/stanzza/) مباشرة عند كتابة /"""
import http.server
import socketserver
from pathlib import Path
from urllib.parse import quote

PORT = 8010
DIRECTORY = str(Path(__file__).resolve().parent)


class NewSiteHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        kwargs["directory"] = DIRECTORY
        super().__init__(*args, **kwargs)

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self.send_response(302)
            self.send_header("Location", "/stanzza/")
            self.end_headers()
            return
        super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


class ReuseTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with ReuseTCPServer(("0.0.0.0", PORT), NewSiteHandler) as httpd:
        print(f"Serving new site on http://0.0.0.0:{PORT} (redirects / -> /stanzza/)")
        httpd.serve_forever()
