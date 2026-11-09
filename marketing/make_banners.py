"""Builds 4:5 and 1:1 social banners for each product from the Ultimate 3-in-1 design.

Run from the marketing folder: python make_banners.py
Then render each HTML to PNG with headless Chrome (see render step in the session notes).
"""
import io
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'ultimate-3in1')

PRODUCTS = {
    'protection-combo': {
        'kicker': 'PROTECTION COMBO',
        'h1_4x5': '২০ পিস + <span>৫০ গ্রাম জেল</span>',
        'h1_1x1': '২০ পিস + <span>৫০ গ্রাম জেল</span>',
        'sub_4x5': 'দুই বক্স ডটেড কনডম + পার্সোনাল জেল, এক প্যাকেজে',
        'sub_1x1': 'দুই বক্স ডটেড কনডম<br>+ পার্সোনাল জেল একসাথে',
        'badge_amt': '৳৩০০', 'badge_lbl': 'ছাড়!',
        'now': '৳৯৫০', 'was': '৳১২৫০',
        # Wide flat-lay: show the whole photo in the tall 1:1 frame instead of cropping the gel tube
        'photo_1x1_css': 'object-fit: contain; background: #1c1b1f;',
    },
    'micro-thin-30': {
        'kicker': 'MO MICRO-THIN',
        'h1_4x5': '৩০ পিস <span>মাইক্রো-থিন</span>',
        'h1_1x1': '৩০ পিস <span>মাইক্রো-থিন</span>',
        'sub_4x5': 'আল্ট্রা থিন, আল্ট্রা সেনসিটিভ: তিনটি পূর্ণ বক্স',
        'sub_1x1': 'আল্ট্রা থিন, আল্ট্রা সেনসিটিভ<br>তিনটি পূর্ণ বক্স একসাথে',
        'badge_amt': '৳৪০০', 'badge_lbl': 'ছাড়!',
        'now': '৳৯৫০', 'was': '৳১৩৫০',
    },
    'multi-textured-20': {
        'kicker': 'MO DOTTED PLEASURE',
        'h1_4x5': '২০ পিস <span>ডটেড কম্বো</span>',
        'h1_1x1': '২০ পিস <span>ডটেড কম্বো</span>',
        'sub_4x5': 'মাল্টি-টেক্সচার্ড ডটেড, দুটি পূর্ণ বক্স একসাথে',
        'sub_1x1': 'মাল্টি-টেক্সচার্ড ডটেড<br>দুটি পূর্ণ বক্স একসাথে',
        'badge_amt': '৳২০০', 'badge_lbl': 'ছাড়!',
        'now': '৳৭০০', 'was': '৳৯০০',
    },
}


def read(name):
    with io.open(os.path.join(SRC, name), encoding='utf-8') as f:
        return f.read()


def swap(s, old, new):
    assert old in s, old
    return s.replace(old, new, 1)


def build(slug, p):
    out = os.path.join(HERE, slug)
    os.makedirs(out, exist_ok=True)

    s = read('banner-4x5.html')
    s = swap(s, '<div class="kicker">ULTIMATE 3-IN-1</div>', '<div class="kicker">%s</div>' % p['kicker'])
    s = swap(s, '<h1>৩০ পিস <span>মেগা কম্বো</span></h1>', '<h1>%s</h1>' % p['h1_4x5'])
    s = swap(s, '<div class="sub">আল্ট্রা থিন + ডটেড + রিবড, তিনটি পূর্ণ বক্স</div>', '<div class="sub">%s</div>' % p['sub_4x5'])
    s = swap(s, '<div class="amt">৳৪০০</div><div class="lbl">ছাড়!</div>',
             '<div class="amt">%s</div><div class="lbl">%s</div>' % (p['badge_amt'], p['badge_lbl']))
    s = swap(s, '<span class="now">৳৯৫০</span>', '<span class="now">%s</span>' % p['now'])
    s = swap(s, '<span class="was">৳১৩৫০</span>', '<span class="was">%s</span>' % p['was'] if p['was'] else '')
    if not p['badge_amt'].startswith('৳'):
        s = s.replace('.burst .amt { font-family: \'Plus Jakarta Sans\'; font-size: 92px;', '.burst .amt { font-size: 72px;')
    with io.open(os.path.join(out, 'banner-4x5.html'), 'w', encoding='utf-8') as f:
        f.write(s)

    s = read('banner-1x1.html')
    s = swap(s, '<div class="kicker">ULTIMATE 3-IN-1</div>', '<div class="kicker">%s</div>' % p['kicker'])
    s = swap(s, '<h1>৩০ পিস <span>মেগা কম্বো</span></h1>', '<h1>%s</h1>' % p['h1_1x1'])
    s = swap(s, '<div class="sub">আল্ট্রা থিন + ডটেড + রিবড<br>তিনটি পূর্ণ বক্স একসাথে</div>', '<div class="sub">%s</div>' % p['sub_1x1'])
    s = swap(s, '<span class="amt">৳৪০০</span><span class="lbl">ছাড়!</span>',
             '<span class="amt">%s</span><span class="lbl">%s</span>' % (p['badge_amt'], p['badge_lbl']))
    s = swap(s, '<span class="now">৳৯৫০</span>', '<span class="now">%s</span>' % p['now'])
    s = swap(s, '<span class="was">৳১৩৫০</span>', '<span class="was">%s</span>' % p['was'] if p['was'] else '')
    if p.get('photo_1x1_css'):
        s = s.replace('object-position: 50% 50%;', p['photo_1x1_css'])
    if not p['badge_amt'].startswith('৳'):
        s = s.replace(".save .amt { font-family: 'Plus Jakarta Sans'; font-size: 84px;", '.save .amt { font-size: 66px;')
    with io.open(os.path.join(out, 'banner-1x1.html'), 'w', encoding='utf-8') as f:
        f.write(s)


for slug, p in PRODUCTS.items():
    if slug not in ('protection-combo','multi-textured-20'): continue
    build(slug, p)
    print('built', slug)
