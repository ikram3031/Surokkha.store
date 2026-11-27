import React, { useEffect, useState } from 'react';
import { forgotPassword, verifyEmail, bn, tk, toEnDigits } from './comboCompat.js';

const IconCheck = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>);
const IconX = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>);
const IconMail = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>);

// Dev preview stand-ins for the auth API: nothing is sent; code 123456 verifies, anything else fails
const previewApi = {
  send: () => new Promise((r) => setTimeout(r, 500)),
  verify: ({ otp }) => new Promise((resolve, reject) => setTimeout(() => (otp === '123456' ? resolve() : reject(new Error('ওটিপি কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।'))), 500)),
};

// Order confirmation modal: order summary, then an optional email-OTP membership step that unlocks the member discount
const OrderSuccessModal = ({ success, onClose, preview = false }) => {
  const [step, setStep] = useState('order'); // order | otp | verified
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  // Every new order starts back on the summary
  useEffect(() => {
    setStep('order');
    setOtp('');
    setErr('');
    setInfo('');
  }, [success?.orderNumber]);

  if (!success) return null;
  const bonus = success.bonus && success.email ? success.bonus : null;
  const api = preview ? previewApi : { send: (email) => forgotPassword(email, 'membership'), verify: (p) => verifyEmail(p) };

  // Emails the 6-digit code and opens the code screen
  const sendCode = async (resend = false) => {
    if (busy) return;
    setBusy(true);
    setErr('');
    setInfo('');
    try {
      await api.send(success.email);
      setStep('otp');
      if (resend) setInfo('আপনার ইমেইলে নতুন ওটিপি কোড পাঠানো হয়েছে।');
    } catch (e) {
      setErr(e?.status === 429 ? 'অনেকবার চেষ্টা করা হয়েছে। কয়েক মিনিট পর আবার চেষ্টা করুন।' : 'ওটিপি পাঠানো যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।');
    } finally {
      setBusy(false);
    }
  };

  // Checks the code; on success the server verifies the account and applies the member discount to the order
  const onVerify = async (e) => {
    e.preventDefault();
    if (busy) return;
    const code = toEnDigits(otp).replace(/\D/g, '');
    if (!/^\d{6}$/.test(code)) {
      setErr('আপনার ইমেইলে পাঠানো ৬ ডিজিটের ওটিপি কোডটি দিন।');
      return;
    }
    setBusy(true);
    setErr('');
    setInfo('');
    try {
      await api.verify({ email: success.email, otp: code });
      setStep('verified');
    } catch (e2) {
      setErr(e2?.status === 429 ? 'অনেকবার চেষ্টা করা হয়েছে। কয়েক মিনিট পর আবার চেষ্টা করুন।' : 'ওটিপি কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে। আবার চেষ্টা করুন।');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal show" role="dialog" aria-modal="true" aria-labelledby="okTitle" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box co-success">
        <button type="button" className="co-close" onClick={onClose} aria-label="বন্ধ করুন"><IconX /></button>
        {step === 'order' ? (
          <>
            <div className="tick"><IconCheck /></div>
            <h3 id="okTitle">ধন্যবাদ! আপনার অর্ডার সম্পন্ন হয়েছে</h3>
            <p>অর্ডার কনফার্ম করতে আমাদের টিম শীঘ্রই <b>{bn(success.phone || '')}</b> নম্বরে যোগাযোগ করবে।</p>
            {success.orderNumber ? <div className="order-id">অর্ডার আইডি: <b>{success.orderNumber}</b></div> : null}

            <div className="co-sum">
              <div><span>অর্ডারের মূল্য</span><b>{tk(success.subtotal)}</b></div>
              <div><span>ডেলিভারি চার্জ</span><b className="co-free">ফ্রি</b></div>
              <div className="co-sum-total"><span>সর্বমোট</span><b>{tk(success.total)}</b></div>
            </div>

            {bonus ? (
              <>
                <p className="co-bonus-note">
                  আপনার ইমেইল ভেরিফাই করে মেম্বারশিপ কনফার্ম করুন এবং এই অর্ডারে অতিরিক্ত <b>{tk(bonus.amount)} ({bn(bonus.percent)}%)</b> ছাড় উপভোগ করুন।
                </p>
                <div className="co-actions single">
                  <button type="button" className="btn btn-primary" onClick={() => sendCode(false)} disabled={busy}>
                    {busy ? 'পাঠানো হচ্ছে…' : 'ভেরিফাই'}
                  </button>
                </div>
              </>
            ) : null}
            {err ? <div className="co-err">{err}</div> : null}
          </>
        ) : null}

        {step === 'otp' ? (
          <form onSubmit={onVerify}>
            <div className="tick co-tick-mail"><IconMail /></div>
            <h3 id="okTitle">ইমেইল ভেরিফাই করুন</h3>
            <p><b>{success.email}</b> ইমেইলে একটি ৬ ডিজিটের ওটিপি কোড পাঠানো হয়েছে। মেম্বারশিপ কনফার্ম করতে কোডটি নিচে দিন।</p>
            <input
              className="co-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="৬ ডিজিটের ওটিপি"
              value={otp}
              onChange={(e) => { setOtp(toEnDigits(e.target.value).replace(/\D/g, '').slice(0, 6)); setErr(''); }}
              autoFocus
            />
            {err ? <div className="co-err">{err}</div> : null}
            {info ? <div className="co-info">{info}</div> : null}
            <div className="co-actions single">
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'যাচাই হচ্ছে…' : 'ভেরিফাই'}</button>
            </div>
            <button type="button" className="co-link" onClick={() => sendCode(true)} disabled={busy}>কোড পাননি? আবার পাঠান</button>
          </form>
        ) : null}

        {step === 'verified' ? (
          <>
            <div className="tick"><IconCheck /></div>
            <h3 id="okTitle">আপনার মেম্বারশিপ রেজিস্ট্রেশন সম্পন্ন হয়েছে!</h3>
            <p>
              আপনার <b>{success.orderNumber}</b> অর্ডারে অতিরিক্ত <b>{tk(bonus?.amount)} ({bn(bonus?.percent)}%)</b> ছাড় যুক্ত করা হবে।
              আমাদের টিম খুব শীঘ্রই আপডেটেড মূল্যসহ আপনার অর্ডারটি কনফার্ম করবে।
            </p>
            <div className="co-actions single">
              <a className="btn btn-primary" href="/account">প্রোফাইল</a>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default OrderSuccessModal;
