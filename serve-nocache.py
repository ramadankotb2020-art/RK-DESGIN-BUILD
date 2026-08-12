#!/usr/bin/env python3
"""سيرفر بسيط بمنع الكاش خالص — عشان الـ preview دايماً يجيب أحدث نسخة."""
import http.server
import socketserver

PORT = 8000
DIRECTORY = "/home/user/rk-design"


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


class ReuseTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with ReuseTCPServer(("0.0.0.0", PORT), NoCacheHandler) as httpd:
        print(f"Serving (no-cache) on http://0.0.0.0:{PORT}")
        httpd.serve_forever()
