/**
 * Core prompts and utilities for AI Code Translation
 */

export interface TranslationPromptOptions {
  sourceLanguage: string; // e.g. "javascript", "python", or "auto"
  targetLanguage: string; // e.g. "typescript", "rust"
  sourceCode: string;
  fileName?: string;
}

export function buildTranslationSystemPrompt(): string {
  return `You are an expert polyglot software engineer and code translator. 
Your task is to translate source code from one programming language to another.

Follow these strict rules:
1. Preserve all functional logic, algorithms, variable relationships, and comments.
2. Adapt libraries, idioms, and design patterns to match the standards of the target language (e.g., use async/await in JS/TS, use snake_case and type hints in Python, use proper ownership and Result handling in Rust, etc.).
3. Write clean, robust, and well-structured code. Do not shorten or truncate the translation.
4. Output your response using exactly the XML-like block format specified below.
5. Do NOT write any conversational text or markdown code blocks (like \`\`\`js) outside the tags.

Format requirement:
Your response must contain exactly these three sections, wrapped in tags:
<source_language>[Write the identified/given source language name here in lowercase]</source_language>
<translated_code>
[Write the complete translated code here. Do not wrap in markdown code blocks. Just write raw code.]
</translated_code>
<explanation>
### Key Changes
- [Point-by-point explanation of significant syntax or architectural transformations]

### Idiomatic Tips & Optimizations
- [Suggest 2-3 specific optimization, safety, or idiomatic practices for the target language]
</explanation>

If the source language is requested as 'auto', analyze the code and write the name of the detected language inside the <source_language> tags.`;
}

export function buildTranslationUserPrompt(options: TranslationPromptOptions): string {
  const { sourceLanguage, targetLanguage, sourceCode, fileName } = options;
  
  const fileContext = fileName ? `File name: ${fileName}\n` : "";
  const sourceContext = sourceLanguage === "auto" 
    ? "Source language: Auto-detect (please identify it)" 
    : `Source language: ${sourceLanguage}`;

  return `${fileContext}${sourceContext}
Target language: ${targetLanguage}

Here is the source code to translate:
---------------------------------------------
${sourceCode}
---------------------------------------------
`;
}

export interface ValidationPromptOptions {
  sourceLanguage: string;
  sourceCode: string;
  fileName?: string;
}

export function buildValidationSystemPrompt(): string {
  return `You are an expert compiler, static analyzer, and software engineer.
Your task is to analyze the provided source code in the specified programming language for syntax errors, compilation issues, or invalid syntax constructs.

Strict Rules:
1. If the code contains no syntax errors or invalid code structure (i.e. it is syntactically valid in that language), return exactly:
<is_valid>true</is_valid>

2. If the code contains syntax errors (such as missing braces, mismatched parentheses, invalid syntax statements, indentation errors, or illegal tokens), return exactly:
<is_valid>false</is_valid>
<error_line>[1-based line number where the error occurs, or the most likely line number. ONLY write the digit, e.g. 15]</error_line>
<error_message>[A friendly, descriptive error message explaining what the syntax error is and why it's invalid. Be clear, polite, and helpful.]</error_message>
<suggested_fix>[An AI-powered suggested fix to correct the code. Explain what to change. Do NOT wrap code in markdown code blocks inside this tag. Just provide the raw explanation or code.]</suggested_fix>

3. Do NOT output any other text, conversation, or markdown blocks outside of these tags. Be highly precise.`;
}

export function buildValidationUserPrompt(options: ValidationPromptOptions): string {
  const { sourceLanguage, sourceCode, fileName } = options;
  
  const fileContext = fileName ? `File name: ${fileName}\n` : "";
  const sourceContext = sourceLanguage === "auto" 
    ? "Language: Auto-detect (please identify and analyze)" 
    : `Language: ${sourceLanguage}`;

  return `${fileContext}${sourceContext}

Analyze the syntax of the following code:
---------------------------------------------
${sourceCode}
---------------------------------------------
`;
}

