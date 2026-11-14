import { apiClient } from './apiClient';

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const SUPPORTED_RESUME_EXTENSIONS = ['.pdf', '.docx'];

export const validateResumeFile = (file) => {
  if (!file) return 'Please choose a PDF or Word (.docx) resume to upload.';

  const fileName = file.name.toLowerCase();
  const isSupported = SUPPORTED_RESUME_EXTENSIONS.some((extension) =>
    fileName.endsWith(extension)
  );

  if (!isSupported) return 'Only PDF and Word (.docx) resumes are supported.';
  if (file.size === 0) return 'That file is empty. Please pick another PDF.';
  if (file.size > MAX_RESUME_BYTES) return 'Resume is too large. Maximum size is 5 MB.';

  return '';
};

export const analyzeResume = async (file, targetJobTitle) => {
  const fileError = validateResumeFile(file);
  if (fileError) throw new Error(fileError);

  const role = (targetJobTitle || '').trim();
  if (role.length < 2) {
    throw new Error('Enter the job title you are targeting (at least 2 characters).');
  }

  const formData = new FormData();
  formData.append('resume', file);
  formData.append('target_job_title', role);

  try {
    return await apiClient('/resume/analyze', {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    if (error.status === 401) {
      throw new Error('Your session expired. Please sign in again.');
    }
    if (error.status === 413) {
      throw new Error('Resume is too large. Maximum size is 5 MB.');
    }
    if (error.status >= 500) {
      throw new Error('The analysis service is unavailable. Please try again.');
    }
    if (error.status) throw error;

    throw new Error(
      'Could not reach the server. Make sure the backend is running on port 8000.'
    );
  }
};
