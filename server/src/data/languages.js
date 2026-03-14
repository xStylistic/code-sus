export const SUPPORTED_LANGUAGES = ["javascript", "python", "java", "cpp", "c"];

export const LANGUAGE_LABELS = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C"
};

export function normalizeLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language) ? language : "javascript";
}
