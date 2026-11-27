import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import './comboHomeHero.css';
import boxImg from '../views/combo-offer/box.webp';

const OFFER = { regularPrice: 1540, offerPrice: 1370 };
const bn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
const tk = (n) => '৳' + bn(Number(n).toLocaleString('en-IN'));

const IconCart = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>);
const IconCheck = ({ w = 2.4 }) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>);
const IconTruck = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>);
const IconShield = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>);
const IconBox = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/></svg>);

// Home hero banner: the dark All In One hero from the combo-offer page, linking to that page to order
// Opens the All In One product page inside the shop instead of the landing page
const PRODUCT_SLUG = 'all-in-one-special';

export default function ComboHomeHero() {
  const navigateTo = useStore((st) => st.navigateTo);
  const openProduct = (e) => {
    if (!navigateTo) return;
    e.preventDefault();
    navigateTo('product', PRODUCT_SLUG);
  };
  useEffect(() => {
    if (document.getElementById('so-fonts')) return;
    const link = document.createElement('link');
    link.id = 'so-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,800;1,700&display=swap';
    document.head.appendChild(link);
  }, []);
  return (
    <div className="ch-hero w-full">
    <header className="hero">
      <div className="container">
        <div className="hero-grid">
          <div>
            <span className="eyebrow"><b>COMBO</b> চার ব্র্যান্ড, এক বক্সে</span>
            <div className="brandline">Surokkha Shop</div>
            <h2 className="hero-title">All In <em>One</em></h2>
            <p className="hero-sub"><strong>MO, Skore, Durex আর Amore</strong>, চারটি বিশ্বস্ত ব্র্যান্ড এক বক্সে। ৬ ধরন, মোট ৩৬ পিস, বারবার অর্ডারের ঝামেলা নেই।</p>

            <div className="mix">
              <span className="chip"><i style={{ background: 'linear-gradient(135deg,#f1f5f9 33%,#f4a7c4 33% 66%,#38bdf8 66%)' }} />MO</span>
              <span className="op">+</span>
              <span className="chip"><i style={{ background: '#dc2626' }} />Skore</span>
              <span className="op">+</span>
              <span className="chip"><i style={{ background: '#1d4ed8' }} />Durex</span>
              <span className="op">+</span>
              <span className="chip"><i style={{ background: '#18181b' }} />Amore</span>
              <span className="op">=</span>
              <span className="total">৩৬ <small>পিস</small></span>
            </div>

            <div className="price-row">
              <div className="price-now"><sup>৳</sup>{bn(OFFER.offerPrice.toLocaleString('en-IN'))}</div>
              <div className="price-tags"><span className="price-old">{tk(OFFER.regularPrice)}</span></div>
              <div className="price-tags">
                <span className="ptag ptag-free"><IconCheck />ফ্রি ডেলিভারি</span>
              </div>
            </div>

            <div className="ctas">
              <a href={`/product/${PRODUCT_SLUG}`} onClick={openProduct} className="btn btn-primary"><IconCart />এখনই অর্ডার করুন</a>
              <a href={`/product/${PRODUCT_SLUG}`} onClick={openProduct} className="btn btn-ghost">বক্সে কী আছে দেখুন</a>
            </div>

            <div className="trust">
              <span><IconBox />বেস্ট প্যাকেজিং</span>
              <span><IconTruck />ক্যাশ অন ডেলিভারি</span>
              <span><IconShield />১০০% অরিজিনাল</span>
            </div>
          </div>

          <div className="visual co-visual" aria-hidden="true">
            <div className="glow" /><div className="ring" />
            <div className="co-box" style={{ backgroundImage: `url('${boxImg}')` }} />
            <div className="co-orbit">
              <div className="co-orb" style={{ '--a': '0deg' }}><div className="co-pk"><div className="skh-img skh-i-blue" style={{ '--t': '-12deg', '--d': '0s' }} /></div></div>
              <div className="co-orb" style={{ '--a': '120deg' }}><div className="co-pk"><div className="skh-img skh-i-pink" style={{ '--t': '10deg', '--d': '-1s' }} /></div></div>
              <div className="co-orb" style={{ '--a': '240deg' }}><div className="co-pk"><div className="skh-img skh-i-white" style={{ '--t': '-6deg', '--d': '-2s' }} /></div></div>
            </div>
            <div className="seal"><div><b>৩৬ পিস</b>কম্বো</div></div>
            <div className="ftag">
              <div className="ic"><IconBox /></div>
              <div><b>প্রিমিয়াম প্যাকেজিং</b><small>ডেলিভারিতে কোনো ড্যামেজ হবে না</small></div>
            </div>
          </div>
        </div>
      </div>
    </header>
    </div>
  );
}
