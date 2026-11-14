import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Loader2, Sparkles, Target } from 'lucide-react';
import ResumeUploader from '../components/resume/ResumeUploader';
import AnalysisLoading from '../components/resume/AnalysisLoading';
import GapAnalysisDashboard from '../components/resume/GapAnalysisDashboard';
import TailoredResumeBuilder from '../components/resume/TailoredResumeBuilder';
import { analyzeResume, validateResumeFile } from '../services/resumeApi';

const SUGGESTED_ROLES = [
  'AI/ML Engineer',
  'Data Scientist',
  'Frontend Developer',
  'Cloud Engineer',
];

const ResumeGapAnalysis = () => {
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [status, setStatus] = useState('idle');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const isLoading = status === 'loading';

  const handleSelectFile = (picked) => {
    const message = validateResumeFile(picked);
    if (message) {
      setFile(null);
      setError(message);
      return;
    }
    setFile(picked);
    setError('');
  };

  const handleClearFile = () => {
    setFile(null);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const fileMessage = validateResumeFile(file);
    if (fileMessage) {
      setError(fileMessage);
      return;
    }

    if (targetRole.trim().length < 2) {
      setError('Enter the job title you are targeting.');
      return;
    }

    setError('');
    setStatus('loading');

    try {
      const result = await analyzeResume(file, targetRole);
      setAnalysis(result);
      setStatus('success');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStatus('idle');
    }
  };

  const handleReset = () => {
    setFile(null);
    setTargetRole('');
    setAnalysis(null);
    setError('');
    setStatus('idle');
  };

  return (
    <div className="mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-4 p-4 font-sans duration-500 md:p-8">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 text-indigo-600 shadow-sm">
          <Target className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Resume Gap Analysis</h1>
          <p className="text-sm font-bold text-slate-500">
            Match your resume to a role and get a learning roadmap
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-400">
              1. Upload your resume
            </label>
            <ResumeUploader
              file={file}
              onSelect={handleSelectFile}
              onClear={handleClearFile}
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="target-role"
              className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-400"
            >
              2. Target job title
            </label>
            <input
              id="target-role"
              type="text"
              value={targetRole}
              onChange={(event) => setTargetRole(event.target.value)}
              placeholder="e.g. Machine Learning Engineer"
              disabled={isLoading}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3.5 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTED_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setTargetRole(role)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    targetRole === role
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-black text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing your resume…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze my gap
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              role="alert"
              aria-live="polite"
              className="mt-5 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {isLoading && <AnalysisLoading key="loading" />}
        </AnimatePresence>

        {status === 'success' && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <GapAnalysisDashboard analysis={analysis} />
            <div className="mt-6">
              <TailoredResumeBuilder file={file} analysis={analysis} />
            </div>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-600"
              >
                Analyze another resume
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ResumeGapAnalysis;
