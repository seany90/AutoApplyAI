import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Play, FileText, Settings, Bot, CalendarCheck, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface InstructionalVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstructionalVideoModal({ isOpen, onClose }: InstructionalVideoModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setStep(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isPlaying) return;

    let isCancelled = false;
    const sequence = [
      { step: 1, duration: 3000 }, // Upload
      { step: 2, duration: 3000 }, // Preferences
      { step: 3, duration: 4000 }, // AI Applying
      { step: 4, duration: 3000 }, // Success
    ];

    const runSequence = async () => {
      for (const s of sequence) {
        if (isCancelled) return;
        setStep(s.step);
        await new Promise(resolve => setTimeout(resolve, s.duration));
      }
      if (isCancelled) return;
      setStep(5); // End state
      
      // Wait a bit before showing the final CTA state
      setTimeout(() => {
        if (!isCancelled) setIsPlaying(false);
      }, 2000);
    };

    runSequence();

    return () => {
      isCancelled = true;
    };
  }, [isPlaying]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          <div 
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl aspect-[4/5] sm:aspect-video bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-slate-950/80 to-transparent">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-400" />
                How AutoApply AI Works
              </h3>
              <button 
                onClick={onClose}
                className="p-2 rounded-full bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Content Area */}
            <div className="flex-1 relative flex items-center justify-center bg-slate-950 overflow-hidden">
              <AnimatePresence>
                {!isPlaying && step === 0 && (
                  <motion.button
                    key="play"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsPlaying(true)}
                    className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 z-30"
                  >
                    <Play className="w-8 h-8 ml-1" />
                  </motion.button>
                )}

                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
                  >
                    <motion.div 
                      animate={{ y: [0, -10, 0] }} 
                      transition={{ repeat: Infinity, duration: 2 }}
                      exit={{ opacity: 0 }}
                      className="w-24 h-24 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30"
                    >
                      <FileText className="w-12 h-12 text-indigo-400" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mb-2">1. Upload Your Resume</h2>
                    <p className="text-slate-400 text-lg">We extract your skills, experience, and education instantly.</p>
                    
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.5, ease: "linear" }}
                      className="h-1 bg-indigo-500 mt-8 rounded-full max-w-xs"
                    />
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
                  >
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30">
                      <Settings className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">2. Set Your Preferences</h2>
                    <p className="text-slate-400 text-lg mb-8">Tell us your dream role, salary, and location.</p>
                    
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left w-full max-w-sm space-y-3 shadow-xl">
                      <div className="space-y-1">
                        <div className="h-3 w-20 bg-slate-700 rounded" />
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1 }}
                          className="h-8 bg-slate-800 rounded flex items-center px-3 text-sm text-emerald-400 font-mono"
                        >
                          "Frontend Engineer"
                        </motion.div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-3 w-16 bg-slate-700 rounded" />
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1, delay: 0.5 }}
                          className="h-8 bg-slate-800 rounded flex items-center px-3 text-sm text-emerald-400 font-mono"
                        >
                          "$120,000+"
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
                  >
                    <div className="relative w-32 h-32 mb-8">
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 border-4 border-dashed border-indigo-500/30 rounded-full"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Bot className="w-12 h-12 text-indigo-400" />
                      </div>
                      {[
                        { name: "Google", delay: 0.5, x: -60, y: -40 },
                        { name: "Stripe", delay: 1.5, x: 60, y: -20 },
                        { name: "Netflix", delay: 2.5, x: -40, y: 50 },
                      ].map((company, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                          animate={{ opacity: 1, scale: 1, x: company.x, y: company.y }}
                          transition={{ delay: company.delay, duration: 0.5 }}
                          className="absolute top-1/2 left-1/2 bg-slate-800 border border-slate-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {company.name}
                        </motion.div>
                      ))}
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">3. AI Agents Go to Work</h2>
                    <p className="text-slate-400 text-lg">We find matches and submit tailored applications 24/7.</p>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div 
                    key="step4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-indigo-600/10"
                  >
                    <motion.div 
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/30"
                    >
                      <CalendarCheck className="w-12 h-12 text-white" />
                    </motion.div>
                    <h2 className="text-4xl font-bold text-white mb-4">4. Get Interviews</h2>
                    <p className="text-indigo-200 text-xl max-w-md">Wake up to interview requests in your inbox while you sleep.</p>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div 
                    key="step5"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-slate-900"
                  >
                    <h2 className="text-3xl font-bold text-white mb-6">Ready to land your dream job?</h2>
                    <button 
                      onClick={() => {
                        onClose();
                        navigate("/auth");
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105"
                    >
                      Start Your Free Trial
                    </button>
                    <button 
                      onClick={() => { setStep(0); setIsPlaying(false); }}
                      className="mt-4 text-slate-400 hover:text-white"
                    >
                      Watch Again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-slate-800 w-full relative z-20">
              <motion.div 
                className="h-full bg-indigo-500"
                initial={{ width: "0%" }}
                animate={{ width: isPlaying ? `${(step / 4) * 100}%` : step === 5 ? "100%" : "0%" }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
