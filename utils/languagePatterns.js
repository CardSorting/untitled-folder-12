// Language Patterns Module
import { EnglishPatterns } from './languages/english';
import { JapanesePatterns } from './languages/japanese';
import { ChinesePatterns } from './languages/chinese';

// Common patterns across all languages
export const CommonPatterns = {
  whitespace: /\s+/,
  linebreak: /\r?\n/,
  indent: /^(?:    |\t)/,
  
  // Common structural elements
  structure: {
    heading: new Set(['#', '##', '###', '====', '----']),
    section: new Set(['§', '¶', '†', '‡']),
    formatting: new Set(['*', '_', '**', '__', '~~', '`'])
  },
  
  // Common quote markers
  quotes: new Set(['"', '"', '"', "'", "'", "'", '「', '」', '『', '』']),
  
  // Common list markers
  lists: new Set([
    '•', '-', '*', '1.', '2.', '3.', '①', '②', '③',
    'a.', 'b.', 'c.', 'A.', 'B.', 'C.', '(a)', '(b)', '(c)',
    '一', '二', '三', 'Ⅰ', 'Ⅱ', 'Ⅲ'
  ])
};

// Export language-specific patterns
export { EnglishPatterns, JapanesePatterns, ChinesePatterns };

// Language detection patterns
export const LanguageDetection = {
  english: /^[\x00-\x7F\s]+$/,  // ASCII characters only
  japanese: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,  // Hiragana, Katakana, and Kanji
  chinese: /[\u4E00-\u9FFF\u3400-\u4DBF]/  // CJK Unified Ideographs
};

// Helper function to detect language
export function detectLanguage(text) {
  if (LanguageDetection.japanese.test(text)) {
    return 'japanese';
  } else if (LanguageDetection.chinese.test(text)) {
    return 'chinese';
  } else if (LanguageDetection.english.test(text)) {
    return 'english';
  }
  return 'unknown';
}

// Helper function to get language-specific patterns
export function getLanguagePatterns(language) {
  switch (language) {
    case 'english':
      return EnglishPatterns;
    case 'japanese':
      return JapanesePatterns;
    case 'chinese':
      return ChinesePatterns;
    default:
      return EnglishPatterns; // Default to English
  }
}
