"""Offline HTML / local asset audit, including generated project routes."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, unquote
import json
ROOT = Path(__file__).resolve().parent.parent
errors = []
class Audit(HTMLParser):
    def __init__(self, file):
        super().__init__(); self.file=file; self.base='https://audit.test/'+file.relative_to(ROOT).as_posix()
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='base': self.base=urljoin(self.base,a.get('href',''))
        if tag not in ('a','img','script','link','source','video'): return
        ref=a.get('src') if tag in ('img','script','source','video') else a.get('href')
        if not ref or ref.startswith(('#','javascript:','data:','mailto:','tel:')): return
        url=urlsplit(urljoin(self.base,ref))
        if url.netloc!='audit.test': return
        file=ROOT/unquote(url.path.lstrip('/'))
        if file.is_dir(): file=file/'index.html'
        if not file.exists(): errors.append({'page':str(self.file.relative_to(ROOT)), 'target':ref})
files=list(ROOT.glob('*.html'))+list((ROOT/'projects').glob('**/*.html'))
for file in files:
    p=Audit(file);p.feed(file.read_text())
print(json.dumps({'pages':len(files),'broken_links':errors},ensure_ascii=False,indent=2))
raise SystemExit(bool(errors))
