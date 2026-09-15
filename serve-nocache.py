#!/usr/bin/env python3
"""سيرفر بسيط بمنع الكاش خالص — عشان الـ preview دايماً يجيب أحدث نسخة.
يدعم روابط تحميل مباشرة (Content-Disposition) لملف البورتفوليو الأوفلاين:
  /portfolio      → ينزّل rk-portfolio-offline.html مباشرة
  /portfolio.zip  → ينزّل rk-portfolio-offline.zip مباشرة
"""
import http.server
import socketserver
import os
from pathlib import Path
from urllib.parse import unquote, urlparse

PORT = 8000
DIRECTORY = str(Path(__file__).resolve().parent)

# روابط مختصرة → ملفات فعلية (تحميل مباشر)
DIRECT_DOWNLOADS = {
    "/portfolio": "rk-portfolio-offline.html",
    "/portfolio.zip": "rk-portfolio-offline.zip",
    "/portfolio-lite": "rk-portfolio-lite.html",
    "/portfolio-lite.zip": "rk-portfolio-lite.zip",
    "/rk-portfolio-offline.html": "rk-portfolio-offline.html",
    "/rk-portfolio-offline.zip": "rk-portfolio-offline.zip",
    "/rk-portfolio-lite.html": "rk-portfolio-lite.html",
    "/rk-portfolio-lite.zip": "rk-portfolio-lite.zip",
}


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def translate_path(self, path):
        """حوّل الروابط المختصرة لمسارات الملفات الفعلية."""
        clean = unquote(urlparse(path).path)
        if clean in DIRECT_DOWNLOADS:
            return os.path.join(DIRECTORY, DIRECT_DOWNLOADS[clean])
        return super().translate_path(path)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        # فرض التحميل المباشر: المتصفح ينزّل الملف بدل ما يفتحه
        clean = unquote(urlparse(self.path).path)
        if clean in DIRECT_DOWNLOADS:
            filename = DIRECT_DOWNLOADS[clean]
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        super().end_headers()


class ReuseTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with ReuseTCPServer(("0.0.0.0", PORT), NoCacheHandler) as httpd:
        print(f"Serving (no-cache) on http://0.0.0.0:{PORT}")
        print("Direct downloads: /portfolio  |  /portfolio.zip")
        httpd.serve_forever()
