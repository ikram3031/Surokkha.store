import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const CHALLENGE_IMAGES = [
  { id: 1, image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=180&q=80', isPerfume: true },
  { id: 2, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=180&q=80', isPerfume: false },
  { id: 3, image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=180&q=80', isPerfume: true },
  { id: 4, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=180&q=80', isPerfume: false },
  { id: 5, image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=180&q=80', isPerfume: true },
  { id: 6, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=180&q=80', isPerfume: false },
  { id: 7, image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=180&q=80', isPerfume: true },
  { id: 8, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=180&q=80', isPerfume: false },
  { id: 9, image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=180&q=80', isPerfume: true },
];

export const ReCaptcha = ({ onVerify, verified }) => {
  const [checking, setChecking] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [challengeError, setChallengeError] = useState(null);

  const handleCheckboxClick = () => {
    if (verified || checking) return;

    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setShowChallenge(true);
    }, 700);
  };

  const handleImageClick = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setChallengeError(null);
  };

  const handleVerify = () => {
    const correctIds = CHALLENGE_IMAGES.filter((item) => item.isPerfume).map((item) => item.id);
    const incorrectIds = CHALLENGE_IMAGES.filter((item) => !item.isPerfume).map((item) => item.id);

    const hasSelectedAllCorrect = correctIds.every((id) => selectedIds.includes(id));
    const hasSelectedAnyIncorrect = selectedIds.some((id) => incorrectIds.includes(id));

    if (hasSelectedAllCorrect && !hasSelectedAnyIncorrect) {
      onVerify(true);
      setShowChallenge(false);
      setChallengeError(null);
    } else {
      setChallengeError('Verification failed. Select all perfume bottles.');
      setSelectedIds([]);
    }
  };

  const handleRefresh = () => {
    setSelectedIds([]);
    setChallengeError(null);
  };

  return (
    <div className="relative w-full">
      {/* reCAPTCHA Widget Box */}
      <div className="flex items-center justify-between p-2.5 px-3 bg-slate-950/60 border border-slate-800 rounded-xl select-none">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCheckboxClick}
            disabled={verified || checking}
            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition cursor-pointer shrink-0 outline-none ${
              verified
                ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-xs'
                : checking
                ? 'border-slate-700 bg-slate-900'
                : 'border-slate-700 bg-slate-900 hover:border-slate-400'
            }`}
          >
            {verified ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Check className="h-3.5 w-3.5 stroke-[4]" />
              </motion.div>
            ) : checking ? (
              <div className="h-3.5 w-3.5 border-2 border-slate-600 border-t-slate-200 rounded-full animate-spin" />
            ) : null}
          </button>
          
          <span className="text-[11px] font-semibold text-slate-300 font-sans">
            {"I'm not a robot"}
          </span>
        </div>

        {/* reCAPTCHA Logo Mark */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-4 h-4 text-slate-500"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
          <span className="text-[7px] font-bold text-slate-500 leading-none mt-0.5">reCAPTCHA</span>
        </div>
      </div>

      {/* Challenge Modal Overlay */}
      <AnimatePresence>
        {showChallenge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xs"
            >
              <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden p-0 rounded-2xl">
                {/* Header */}
                <CardHeader className="bg-slate-950 p-4 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0 border-slate-700 text-slate-300">
                      Security Challenge
                    </Badge>
                  </div>
                  <CardTitle className="text-xs font-bold mt-1.5 text-white leading-snug">
                    Select all images with a <span className="text-amber-400 underline">perfume bottle</span>.
                  </CardTitle>
                </CardHeader>

                {/* Content */}
                <CardContent className="p-3 bg-slate-900">
                  {challengeError && (
                    <Alert variant="destructive" className="mb-2.5 py-1.5 px-2.5 bg-rose-950/60 border-rose-900 text-rose-300">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                      <AlertDescription className="text-[11px]">{challengeError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-3 gap-1.5">
                    {CHALLENGE_IMAGES.map((item) => {
                      const isSelected = selectedIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleImageClick(item.id)}
                          className={`aspect-square relative rounded-lg overflow-hidden border transition outline-none cursor-pointer group bg-slate-950 ${
                            isSelected
                              ? 'border-slate-100 scale-[0.96] shadow-sm'
                              : 'border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <img
                            src={item.image}
                            alt="Verification challenge"
                            className={`w-full h-full object-cover transition-all duration-200 ${
                              isSelected ? 'brightness-75 opacity-90' : 'group-hover:scale-105'
                            }`}
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                              <div className="bg-white text-slate-950 p-0.5 rounded-full shadow-md">
                                <Check className="h-3 w-3 stroke-[4]" />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>

                {/* Footer Controls */}
                <CardFooter className="p-2.5 px-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={handleRefresh}
                      className="text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Refresh Challenge"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="text-slate-400 hover:text-white text-[11px]"
                      onClick={() => {
                        setShowChallenge(false);
                        setSelectedIds([]);
                        setChallengeError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      className="bg-slate-100 hover:bg-white text-slate-950 text-[11px] font-semibold"
                      onClick={handleVerify}
                    >
                      Verify
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
