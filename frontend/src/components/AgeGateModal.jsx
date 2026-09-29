import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';

export default function AgeGateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [underAgeBlocked, setUnderAgeBlocked] = useState(false);
  const { isBn } = useTranslation();

  useEffect(() => {
    try {
      const verified = localStorage.getItem('surokkha_age_verified');
      if (verified !== 'true') {
        setIsOpen(true);
      }
    } catch (e) {
      // LocalStorage access fallback
      setIsOpen(true);
    }
  }, []);

  const handleConfirmAge = () => {
    try {
      localStorage.setItem('surokkha_age_verified', 'true');
    } catch (e) {}
    setIsOpen(false);
  };

  const handleUnderAge = () => {
    setUnderAgeBlocked(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden text-center">
        
        {/* Top Accent Strip */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brand-600 via-rose-600 to-amber-500" />

        {/* 18+ Shield Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col items-center justify-center shadow-inner text-rose-800">
          <span className="text-xl sm:text-2xl font-black font-heading leading-none">18+</span>
          <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">VERIFIED</span>
        </div>

        {!underAgeBlocked ? (
          <>
            <div className="inline-block bg-brand-50 border border-brand-200 px-3 py-1 rounded-full text-brand-800 text-xs font-bold mb-3">
              {isBn ? 'স্বাস্থ্য ও পরিবার পরিকল্পনা বিধিমালা' : 'Reproductive Healthcare Standard'}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 mb-2">
              {isBn ? 'আপনার বয়স কি ১৮ বছর বা তার বেশি?' : 'Age Verification Notice (18+)'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed mb-6">
              {isBn 
                ? 'সুরক্ষা স্টোরে প্রদর্শিত পণ্যসমূহ আন্তর্জাতিক মানসম্পন্ন সার্টিফাইড পরিবার পরিকল্পনা ও স্বাস্থ্য সুরক্ষা সামগ্রী। স্বাস্থ্য ও সুরক্ষা নীতিমালা অনুযায়ী এগুলো শুধুমাত্র ১৮+ প্রাপ্তবয়স্কদের ব্যবহারের জন্য নির্ধারিত।'
                : 'Surokkha.store provides certified barrier contraceptive devices and family planning healthcare supplies. Under regulatory health policies, access is strictly restricted to adults aged 18 and older.'}
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleConfirmAge}
                className="w-full bg-gradient-to-r from-[#F43F5E] via-[#E11D48] to-[#BE123C] hover:from-[#FB7185] hover:to-[#9F1239] text-white font-bold text-sm sm:text-base py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-rose-500/25 transition-all cursor-pointer active:scale-98"
              >
                {isBn ? '✓ হ্যাঁ, আমি ১৮ বছর বা তার বেশি বয়সী' : '✓ Yes, I am 18 years or older'}
              </button>

              <button
                type="button"
                onClick={handleUnderAge}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                {isBn ? 'আমি ১৮ বছরের কম (প্রস্থান করুন)' : 'I am under 18 (Exit)'}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-600 font-medium">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>{isBn ? 'আইএসও ৪০৭৪ সার্টিফাইড কোয়ালিটি ও নিরাপদ স্বাস্থ্য সেবা' : 'ISO 4074 Quality & Regulated Healthcare Standards'}</span>
            </div>
          </>
        ) : (
          <div className="py-4 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
              ℹ️
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {isBn ? 'প্রবেশাধিকার সীমাবদ্ধ' : 'Restricted Access'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              {isBn 
                ? 'আইনগত ও স্বাস্থ্য নীতিমালা অনুযায়ী অপ্রাপ্তবয়স্কদের জন্য এই সাইটের পণ্য ব্রাউজিং সীমাবদ্ধ। স্বাস্থ্য ও সচেতনতামূলক তথ্যের জন্য জাতীয় পরিবার পরিকল্পনা পরামর্শকেন্দ্রের সহায়তা নিন।'
                : 'Access to regulated contraceptive and adult family planning devices is restricted for minors. For reproductive health education, consult recognized public health resources.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setUnderAgeBlocked(false)}
                className="text-xs text-brand-700 underline font-semibold cursor-pointer"
              >
                {isBn ? 'পুনরায় নিশ্চিতকরণ স্ক্রিনে ফিরে যান' : 'Back to verification'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
