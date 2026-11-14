import { apiClient, AUTH_EXPIRED_EVENT } from './apiClient';
import { API_BASE_URL } from '../utils/constants';

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

export const generateResumeDraft = async (file, targetJobTitle, confirmedSkills) => {
  const fileError = validateResumeFile(file);
  if (fileError) throw new Error(fileError);

  const formData = new FormData();
  formData.append('resume', file);
  formData.append('target_job_title', targetJobTitle);
  confirmedSkills.forEach(skill => formData.append('confirmed_skills', skill));

  return apiClient('/resume/draft', {
    method: 'POST',
    body: formData,
  });
};

export const downloadResumePdf = async (targetJobTitle, draftText) => {
  const token = localStorage.getItem('pathpilot_token');
  const formData = new FormData();
  formData.append('target_job_title', targetJobTitle);
  formData.append('draft_text', draftText);
  formData.append('facts_confirmed', 'true');

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/resume/pdf`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  } catch {
    throw new Error('Could not reach the server. Make sure the backend is running.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new Error(errorData.detail || `Could not create PDF (${response.status}).`);
  }

  if (!response.headers.get('content-type')?.includes('application/pdf')) {
    throw new Error('The server returned an invalid PDF response.');
  }

  return response.blob();
};
