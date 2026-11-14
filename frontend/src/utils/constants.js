// Global Application Constants

export const APP_NAME = "PathPilot AI";
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? "/api" : "https://skillbridge-api-zn4z.onrender.com/api");

export const CAREER_PATHS = [
  "AI/ML Engineer",
  "Data Scientist",
  "Data Analyst",
  "Software Engineer",
  "Cloud Architect"
];

export const SKILL_CATEGORIES = {
  CORE: "Core Computing",
  DATA: "Data Processing",
  ML: "Machine Learning",
  CLOUD: "Cloud & DevOps"
};

export const THEME_COLORS = {
  primary: "indigo",
  secondary: "orange",
  success: "green",
  error: "red"
};
