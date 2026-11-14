import React, { useRef, useState } from 'react';
import { FileText, UploadCloud, X } from 'lucide-react';

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ResumeUploader = ({ file, onSelect, onClear, disabled = false }) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleFiles = (files) => {
    const picked = files?.[0];
    if (picked) onSelect(picked);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  };

  if (file) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50/60 p-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
          <FileText className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{file.name}</p>
          <p className="text-xs font-semibold text-slate-500">
            {formatSize(file.size)} · {file.name.toLowerCase().endsWith('.docx') ? 'Word document' : 'PDF'} ready to analyze
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          aria-label="Remove selected resume"
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload resume PDF or Word document"
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openPicker();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`group cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
        isDragging
          ? 'border-indigo-400 bg-indigo-50 shadow-inner'
          : 'border-slate-200 bg-slate-50/60 hover:border-indigo-300 hover:bg-indigo-50/40'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100 transition-transform duration-300 group-hover:-translate-y-0.5">
        <UploadCloud className="h-7 w-7" />
      </div>
      <p className="text-sm font-bold text-slate-800">
        Drag &amp; drop your resume, or{' '}
        <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-2">
          browse
        </span>
      </p>
      <p className="mt-1 text-xs font-semibold text-slate-400">PDF or Word (.docx) · up to 5 MB</p>
    </div>
  );
};

export default ResumeUploader;
