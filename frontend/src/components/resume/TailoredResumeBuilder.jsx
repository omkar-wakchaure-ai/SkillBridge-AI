import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { downloadResumePdf, generateResumeDraft } from '../../services/resumeApi';

const TailoredResumeBuilder = ({ file, analysis }) => {
  const [confirmedSkills, setConfirmedSkills] = useState([]);
  const [draftText, setDraftText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [factsConfirmed, setFactsConfirmed] = useState(false);
  const [error, setError] = useState('');

  const totalSkills = analysis.current_skills.length + analysis.missing_skills.length;
  const estimatedMatch = totalSkills
    ? Math.min(
      100,
      Math.round(
        ((analysis.current_skills.length + confirmedSkills.length) / totalSkills) * 100
      )
    )
    : 0;

  const toggleConfirmedSkill = (skill) => {
    setConfirmedSkills(current =>
      current.includes(skill)
        ? current.filter(item => item !== skill)
        : [...current, skill]
    );
    setDraftText('');
    setFactsConfirmed(false);
    setError('');
  };

  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    setError('');
    setFactsConfirmed(false);
    try {
      const result = await generateResumeDraft(
        file,
        analysis.target_job_title,
        confirmedSkills
      );
      setDraftText(result.draft_text);
    } catch (requestError) {
      setError(requestError.message || 'Could not generate the resume draft.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setError('');
    try {
      const pdf = await downloadResumePdf(analysis.target_job_title, draftText);
      const fileUrl = URL.createObjectURL(pdf);
      const link = document.createElement('a');
      const roleSlug = analysis.target_job_title
        .trim()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '') || 'tailored';
      link.href = fileUrl;
      link.download = `${roleSlug}-resume.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
    } catch (requestError) {
      setError(requestError.message || 'Could not download the PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">Build a tailored resume PDF</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Confirm only gap skills you genuinely have. They’ll be added as skills, not invented experience.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-slate-700">Estimated skill match</span>
          <span className="text-lg font-black text-indigo-700">{estimatedMatch}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-white"
          role="progressbar"
          aria-label="Estimated resume skill match"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={estimatedMatch}
        >
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${estimatedMatch}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Based on skills listed and those you confirm. This is not a guaranteed ATS score or hiring result.
        </p>
      </div>

      {analysis.missing_skills.length > 0 ? (
        <fieldset className="mb-6">
          <legend className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">
            I already have these skills and can demonstrate them
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {analysis.missing_skills.map(skill => (
              <label
                key={skill}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
              >
                <input
                  type="checkbox"
                  checked={confirmedSkills.includes(skill)}
                  disabled={isGenerating}
                  onChange={() => toggleConfirmedSkill(skill)}
                  className="mt-0.5 h-4 w-4 accent-indigo-600"
                />
                <span>{skill}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <p className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          No missing skills were returned. You can still create a role-focused resume draft.
        </p>
      )}

      <button
        type="button"
        onClick={handleGenerateDraft}
        disabled={isGenerating || !file}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating your draft…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate resume draft
          </>
        )}
      </button>

      {draftText && (
        <div className="mt-6 border-t border-slate-100 pt-6">
          <label
            htmlFor="resume-draft"
            className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500"
          >
            Review and edit your resume before downloading
          </label>
          <textarea
            id="resume-draft"
            value={draftText}
            maxLength={20000}
            rows={18}
            onChange={event => {
              setDraftText(event.target.value);
              setFactsConfirmed(false);
            }}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={factsConfirmed}
              onChange={event => setFactsConfirmed(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-indigo-600"
            />
            <span>I reviewed this draft and confirm its details accurately represent my experience.</span>
          </label>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!factsConfirmed || isDownloading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-white px-5 py-3 text-sm font-black text-indigo-700 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing PDF…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      )}

      {draftText && factsConfirmed && (
        <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Your draft is ready to download.
        </p>
      )}
    </section>
  );
};

export default TailoredResumeBuilder;
