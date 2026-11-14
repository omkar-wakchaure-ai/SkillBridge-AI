import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileSearch, Sparkles } from 'lucide-react';

const MESSAGES = [
  'Reading your resume…',
  'Extracting skills and experience…',
  'Benchmarking against the target role…',
  'Designing your step-by-step roadmap…',
];

const AnalysisLoading = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % MESSAGES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="rounded-3xl border border-indigo-100 bg-white p-8 shadow-sm md:p-10"
    >
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-center">
        <div className="relative flex h-40 w-32 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <FileSearch className="h-12 w-12 text-slate-300" />
          {[0, 1, 2, 3].map((line) => (
            <motion.span
              key={line}
              className="absolute left-5 right-5 h-1.5 rounded-full bg-slate-200"
              style={{ top: `${64 + line * 14}px` }}
              animate={{ opacity: [0.35, 0.9, 0.35] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: line * 0.2 }}
            />
          ))}
          <motion.div
            className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-indigo-400/30 to-transparent"
            animate={{ y: ['-100%', '340%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="max-w-sm text-center md:text-left">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-indigo-600">
            <Sparkles className="h-3.5 w-3.5" />
            Gemini is analyzing
          </div>
          <h3 className="text-xl font-black text-slate-900">Building your gap report</h3>
          <motion.p
            key={MESSAGES[index]}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm font-semibold text-slate-500"
          >
            {MESSAGES[index]}
          </motion.p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-indigo-500"
              animate={{ width: ['10%', '92%', '10%'] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalysisLoading;
