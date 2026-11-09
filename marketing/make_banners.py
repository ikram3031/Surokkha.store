"""4:5 and 1:1 social banners, in two brand versions (Surokkha / Surokkha Store).

Run from the marketing folder: python make_banners.py
Output: <product>/<brand>/banner-4x5.png and banner-1x1.png (rendered with headless Chrome).
Copy rule (Meta ads): no explicit product-type words (condom, lubricant, gel...) anywhere on the banner.
"""
import io, os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'ultimate-3in1')
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

BRANDS = {
    'surokkha': {
        'logo': 'surokkha.png', 'domain': 'surokkha.shop', 'logo_h': (64, 56),
        'css': '',  # original maroon / rose / gold look
    },
    'surokkha-store': {
        'logo': 'surokkha-store.png', 'domain': 'surokkhastore.shop', 'logo_h': (92, 80),
        # Midnight navy + coral + cream, to tell the two shops apart at a glance
        'css': """
  body { background: radial-gradient(120% 85% at 50% 0%, #1d2f4f 0%, #0f1a2e 48%, #070b14 100%) !important; }
  .kicker { color: #fdba74 !important; }
  h1 span { color: #ff7a6b !important; }
  .sub, .foot { color: #f3e9dc !important; }
  .photo { border-color: rgba(255,122,107,.40) !important; }
  .burst, .save { background: linear-gradient(135deg, #fff1e0, #fdba74) !important; color: #0f1a2e !important; }
  .price .now { color: #e2483b !important; }
  .cta { background: linear-gradient(90deg, #ff6b5b, #d63a2c) !important; }
  .foot b { color: #fdba74 !important; }
  .bar { background: #f8f1e7 !important; }
  .bar .info b { color: #d63a2c !important; }
  .pill { border-color: rgba(253,186,116,.45) !important; }
""",
    },
}

PRODUCTS = {
    'protection-combo': {
        'kicker': 'PROTECTION COMBO',
        'h1_4x5': '২০ পিস + <span>৫০ গ্রাম</span>',
        'h1_1x1': '২০ পিস + <span>৫০ গ্রাম</span>',
        'sub_4x5': 'দুটি পূর্ণ বক্স + পার্সোনাল কেয়ার, এক প্যাকেজে',
        'sub_1x1': 'দুটি পূর্ণ বক্স<br>+ পার্সোনাল কেয়ার একসাথে',
        'badge_amt': '৳৩০০', 'badge_lbl': 'ছাড়!',
        'now': '৳৯৫০', 'was': '৳১২৫০',
    },
    'ribbed-20': {
        'kicker': 'MO ULTRA RIBBED',
        'h1_4x5': '২০ পিস <span>রিবড কম্বো</span>',
        'h1_1x1': '২০ পিস <span>রিবড কম্বো</span>',
        'sub_4x5': 'ন্যাচারাল রিবড, দুটি পূর্ণ বক্স একসাথে',
        'sub_1x1': 'ন্যাচারাল রিবড<br>দুটি পূর্ণ বক্স একসাথে',
        'badge_amt': '৳২০০', 'badge_lbl': 'ছাড়!',
        'now': '৳৭০০', 'was': '৳৯০০',
    },
}

# 1:1 photo frame is square (product photos are square), vertically centred beside the copy
SQUARE_1X1 = 'right: 50px; top: 190px; width: 470px; height: 470px; object-fit: cover;'


def read(name):
    with io.open(os.path.join(SRC, name), encoding='utf-8') as f:
        return f.read()


def swap(s, old, new):
    assert old in s, old
    return s.replace(old, new, 1)


def common(s, b, size):
    s = swap(s, 'src="logo.png"', 'src="../../logos/%s"' % b['logo'])
    s = swap(s, 'src="product.webp"', 'src="../product.webp"')
    s = s.replace('<b>surokkha.shop</b>', '<b>%s</b>' % b['domain'])
    s = swap(s, '</style>', '  .logo { height: %dpx !important; }\n%s</style>' % (b['logo_h'][0 if size == '4x5' else 1], b['css']))
    return s


def render(html_path, w, h):
    png = html_path[:-5] + '.png'
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=8000',
                    '--window-size=%d,%d' % (w, h), '--screenshot=' + png, 'file:///' + html_path.replace(os.sep, '/')],
                   capture_output=True)


def build(slug, p, bname, b):
    out = os.path.join(HERE, slug, bname)
    os.makedirs(out, exist_ok=True)

    s = read('banner-4x5.html')
    s = swap(s, '<div class="kicker">ULTIMATE 3-IN-1</div>', '<div class="kicker">%s</div>' % p['kicker'])
    s = swap(s, '<h1>৩০ পিস <span>মেগা কম্বো</span></h1>', '<h1>%s</h1>' % p['h1_4x5'])
    s = swap(s, '<div class="sub">আল্ট্রা থিন + ডটেড + রিবড, তিনটি পূর্ণ বক্স</div>', '<div class="sub">%s</div>' % p['sub_4x5'])
    s = swap(s, '<div class="amt">৳৪০০</div><div class="lbl">ছাড়!</div>',
             '<div class="amt">%s</div><div class="lbl">%s</div>' % (p['badge_amt'], p['badge_lbl']))
    s = swap(s, '<span class="now">৳৯৫০</span>', '<span class="now">%s</span>' % p['now'])
    s = swap(s, '<span class="was">৳১৩৫০</span>', '<span class="was">%s</span>' % p['was'])
    s = common(s, b, '4x5')
    hp = os.path.join(out, 'banner-4x5.html')
    io.open(hp, 'w', encoding='utf-8').write(s)
    render(hp, 1080, 1350)

    s = read('banner-1x1.html')
    s = swap(s, '<div class="kicker">ULTIMATE 3-IN-1</div>', '<div class="kicker">%s</div>' % p['kicker'])
    s = swap(s, '<h1>৩০ পিস <span>মেগা কম্বো</span></h1>', '<h1>%s</h1>' % p['h1_1x1'])
    s = swap(s, '<div class="sub">আল্ট্রা থিন + ডটেড + রিবড<br>তিনটি পূর্ণ বক্স একসাথে</div>', '<div class="sub">%s</div>' % p['sub_1x1'])
    s = swap(s, '<span class="amt">৳৪০০</span><span class="lbl">ছাড়!</span>',
             '<span class="amt">%s</span><span class="lbl">%s</span>' % (p['badge_amt'], p['badge_lbl']))
    s = swap(s, '<span class="now">৳৯৫০</span>', '<span class="now">%s</span>' % p['now'])
    s = swap(s, '<span class="was">৳১৩৫০</span>', '<span class="was">%s</span>' % p['was'])
    s = swap(s, 'right: 50px; top: 150px; width: 470px; height: 690px; object-fit: cover;', SQUARE_1X1)
    s = common(s, b, '1x1')
    hp = os.path.join(out, 'banner-1x1.html')
    io.open(hp, 'w', encoding='utf-8').write(s)
    render(hp, 1080, 1080)


for slug, p in PRODUCTS.items():
    for bname, b in BRANDS.items():
        build(slug, p, bname, b)
        print('built', slug, bname)
