"""Site-wide SEO / AEO / GEO audit of the built site (dist/). Run after `npm run build`:  python3 scripts/qa/seo-audit.py

Checks: title 20-65 chars, description 70-165, one h1, canonical, Open Graph/Twitter tags, lang, img alt,
button names, valid JSON-LD + BreadcrumbList, heading order, broken internal links, trailing slashes,
duplicate titles/descriptions, sitemap coverage (indexable in, noindex out), FAQPage on every lesson (AEO),
and the brand/entity signals for GEO (Organization alternateName + slogan, TechArticle author + publisher,
visible brand byline on lessons). Exits 1 if anything is found."""
import os, re, json, sys, collections
from html.parser import HTMLParser

DIST = os.path.join(os.getcwd(), 'dist')
SITE = 'https://azure.msdevbuild.com'

class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.title=''; self._t=False; self.meta={}; self.links=[]; self.canon=None; self.h=[]; self._h=None; self.imgs=[]; self.ld=[]; self._ld=False; self._buf=''; self.lang=None; self.robots=None; self.anchors=[]; self._a=None; self.btn_noname=0; self._btn=None
    def handle_starttag(self, tag, a):
        a=dict(a)
        if tag=='html': self.lang=a.get('lang')
        if tag=='title': self._t=True
        if tag=='meta':
            k=a.get('name') or a.get('property')
            if k: self.meta[k]=a.get('content','')
            if a.get('name')=='robots': self.robots=a.get('content')
        if tag=='link' and a.get('rel')=='canonical': self.canon=a.get('href')
        if tag in ('h1','h2','h3','h4'): self._h=[tag,'']
        if tag=='img': self.imgs.append(a)
        if tag=='script' and a.get('type')=='application/ld+json': self._ld=True; self._buf=''
        if tag=='a' and a.get('href') is not None: self._a=[a.get('href'), '', a]
        if tag=='button': self._btn=[a.get('aria-label') or a.get('title') or '', '']
    def handle_endtag(self, tag):
        if tag=='title': self._t=False
        if self._h and tag==self._h[0]: self.h.append((self._h[0], self._h[1].strip())); self._h=None
        if tag=='script' and self._ld: self.ld.append(self._buf); self._ld=False
        if tag=='a' and self._a: self.anchors.append(self._a); self._a=None
        if tag=='button' and self._btn is not None:
            if not (self._btn[0] or self._btn[1].strip()): self.btn_noname+=1
            self._btn=None
    def handle_data(self, d):
        if self._t: self.title+=d
        if self._h: self._h[1]+=d
        if self._ld: self._buf+=d
        if self._a: self._a[1]+=d
        if self._btn is not None: self._btn[1]+=d

pages={}
for root,_,files in os.walk(DIST):
    for f in files:
        if f.endswith('.html'):
            path=os.path.join(root,f); url='/'+os.path.relpath(path,DIST).replace('index.html','').replace('\\','/')
            p=P(); p.feed(open(path,encoding='utf-8').read()); pages[url]=p

issues=collections.defaultdict(list)
titles=collections.defaultdict(list); descs=collections.defaultdict(list)
existing=set(pages)
for f in os.listdir(DIST):
    pass
static=set()
for root,_,files in os.walk(DIST):
    for f in files: static.add('/'+os.path.relpath(os.path.join(root,f),DIST).replace('\\','/'))

for url,p in sorted(pages.items()):
    noindex = p.robots and 'noindex' in p.robots
    t=p.title.strip(); d=p.meta.get('description','')
    if url.startswith('/embed/') and url!='/embed/':
        if not noindex: issues['embed page without noindex'].append(url)
        continue
    if url=='/404.html' or url=='/404/': continue
    titles[t].append(url); descs[d].append(url)
    if not t: issues['missing <title>'].append(url)
    elif len(t)>65: issues['title > 65 chars'].append(f'{url} ({len(t)}): {t}')
    elif len(t)<20: issues['title < 20 chars'].append(f'{url}: {t}')
    if not d: issues['missing meta description'].append(url)
    elif len(d)>165: issues['description > 165 chars'].append(f'{url} ({len(d)})')
    elif len(d)<70: issues['description < 70 chars'].append(f'{url} ({len(d)}): {d}')
    h1=[x for x in p.h if x[0]=='h1']
    if len(h1)!=1: issues['not exactly one <h1>'].append(f'{url} ({len(h1)})')
    if not p.canon: issues['missing canonical'].append(url)
    elif not p.canon.startswith(SITE): issues['canonical not absolute site URL'].append(url)
    for k in ('og:title','og:description','og:image','og:url','twitter:card'):
        if k not in p.meta: issues[f'missing {k}'].append(url)
    if p.lang!='en': issues['html lang not en'].append(url)
    for img in p.imgs:
        if 'alt' not in img: issues['img without alt'].append(f"{url}: {img.get('src')}")
    if p.btn_noname: issues['buttons without accessible name'].append(f'{url} ({p.btn_noname})')
    # JSON-LD
    types=[]
    for raw in p.ld:
        try:
            j=json.loads(raw); g=j.get('@graph',[j])
            for n in g: types.append(n.get('@type'))
        except Exception as e: issues['invalid JSON-LD'].append(f'{url}: {e}')
    p.types=types
    if 'BreadcrumbList' not in types and url!='/': issues['no BreadcrumbList schema'].append(url)
    # heading order (skip levels)
    last=1
    for tag,_ in p.h:
        lv=int(tag[1])
        if lv>last+1: issues['heading level skipped'].append(f'{url}: h{last}→{tag}'); break
        last=lv
    # links
    for href,text,a in p.anchors:
        if href.startswith(('http','mailto:','tel:','#','javascript')) or not href:
            if href.startswith('http') and not href.startswith(SITE) and a.get('target')=='_blank' and 'noopener' not in (a.get('rel') or ''): issues['external _blank without noopener'].append(f'{url}: {href}')
            continue
        path=href.split('#')[0].split('?')[0]
        if not path: continue
        if not path.startswith('/'): continue
        ok = path in existing or path in static or (path.rstrip('/')+'/') in existing
        if not ok: issues['broken internal link'].append(f'{url} → {href}')
        elif not path.endswith('/') and '.' not in path.split('/')[-1]: issues['link without trailing slash (redirect)'].append(f'{url} → {href}')
        if not text.strip() and not a.get('aria-label') and not a.get('title'): issues['link without text'].append(f'{url} → {href}')

for t,u in titles.items():
    if len(u)>1: issues['duplicate title'].append(f'{t} ← {", ".join(u[:4])}{"…" if len(u)>4 else ""}')
for d,u in descs.items():
    if len(u)>1 and d: issues['duplicate description'].append(f'{d[:60]}… ← {", ".join(u[:4])}{"…" if len(u)>4 else ""}')

# sitemap coverage
sm=''.join(open(os.path.join(DIST,f)).read() for f in os.listdir(DIST) if f.startswith('sitemap') and f.endswith('.xml'))
in_sm=set(re.findall(r'<loc>'+re.escape(SITE)+r'([^<]*)</loc>', sm))
for url,p in pages.items():
    noindex = p.robots and 'noindex' in p.robots
    if url.startswith('/embed/') and url!='/embed/': continue
    if url in ('/404/','/404.html'): continue
    if not noindex and url not in in_sm: issues['indexable page missing from sitemap'].append(url)
    if noindex and url in in_sm: issues['noindex page listed in sitemap'].append(url)

# AEO: question-style pages should carry FAQ/answer schema
TUT=os.path.join(os.getcwd(),'src/content/tutorials')
lessons=[f'/{e}/{m}/{f[:-4]}/' for e in os.listdir(TUT) for m in os.listdir(os.path.join(TUT,e)) if os.path.isdir(os.path.join(TUT,e,m)) for f in os.listdir(os.path.join(TUT,e,m)) if f.endswith('.mdx')]
lessons=[u for u in lessons if u in pages]
for u in lessons:
    if 'FAQPage' not in pages[u].types and 'QAPage' not in pages[u].types: issues['lesson without FAQPage schema (AEO)'].append(u)
# GEO: one consistent entity (MSDEVBUILD = Multi-Stack Dev Build, by Suthahar Jegatheesan)
BRAND='Multi-Stack Dev Build'
for u,p in pages.items():
    for raw in p.ld:
        try: g=json.loads(raw).get('@graph',[])
        except Exception: continue
        for n in g:
            if n.get('@type')=='Organization' and (BRAND not in (n.get('alternateName') or []) or BRAND not in (n.get('slogan') or '')):
                issues['Organization schema missing brand alternateName/slogan (GEO)'].append(u)
            if n.get('@type')=='TechArticle' and not (n.get('author') and n.get('publisher')):
                issues['TechArticle without author + publisher (GEO/E-E-A-T)'].append(u)
for u in lessons:
    html=open(os.path.join(DIST,u.strip('/'),'index.html'),encoding='utf-8').read()
    if 'brand-byline' not in html: issues['lesson without brand byline'].append(u)
counts=collections.Counter(t for p in pages.values() for t in getattr(p,'types',[]) )
print(f'pages audited: {len(pages)} | lessons: {len(lessons)} | sitemap URLs: {len(in_sm)}')
print('schema types:', dict(counts.most_common(14)))
for k,v in sorted(issues.items(), key=lambda x:-len(x[1])):
    print(f'\n## {k}: {len(v)}')
    for x in v[:8]: print('  ', x)

print('\nSEO/AEO/GEO: ' + ('clean' if not issues else f'{sum(len(v) for v in issues.values())} issue(s)'))
sys.exit(1 if issues else 0)
