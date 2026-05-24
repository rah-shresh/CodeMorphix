export interface PistonLanguageConfig {
  language: string;
  version: string;
  extension: string;
}

export const PISTON_LANGUAGE_MAP: Record<string, PistonLanguageConfig> = {
  javascript: { language: "javascript", version: "1.32.3", extension: "js" },
  typescript: { language: "typescript", version: "5.0.3", extension: "ts" },
  python: { language: "python", version: "3.10.0", extension: "py" },
  java: { language: "java", version: "15.0.2", extension: "java" },
  c: { language: "c", version: "10.2.0", extension: "c" },
  cpp: { language: "c++", version: "10.2.0", extension: "cpp" },
  go: { language: "go", version: "1.16.2", extension: "go" },
  rust: { language: "rust", version: "1.68.2", extension: "rs" },
};

export function getPistonConfig(lang: string): PistonLanguageConfig | null {
  const normalized = lang.toLowerCase().trim();
  if (normalized in PISTON_LANGUAGE_MAP) {
    return PISTON_LANGUAGE_MAP[normalized];
  }
  // Fallbacks for minor variations
  if (normalized === "js") return PISTON_LANGUAGE_MAP.javascript;
  if (normalized === "ts") return PISTON_LANGUAGE_MAP.typescript;
  if (normalized === "py") return PISTON_LANGUAGE_MAP.python;
  if (normalized === "c++") return PISTON_LANGUAGE_MAP.cpp;
  
  return null;
}
