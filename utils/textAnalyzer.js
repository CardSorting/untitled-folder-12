// Text Analysis Utilities
import { TextProcessorConfig } from './textProcessorConfig.js';
import { CommonPatterns, getLanguagePatterns, detectLanguage } from './languagePatterns';

export class TextAnalyzer {
  static analyzeBlockType(text) {
    const blockInfo = {
      type: 'paragraph',
      context: {},
      semanticLevel: 0,
      metadata: {
        complexity: 0,
        formality: 0,
        emotion: null,
        language: detectLanguage(text)
      }
    };

    const patterns = getPatterns(text);
    const semanticMarkers = getSemanticMarkers(text);

    // Check for list items with enhanced pattern matching
    if (patterns.list.test(text)) {
      blockInfo.type = 'list-item';
      blockInfo.semanticLevel = 1;
      blockInfo.metadata.formality = 0.5;
    }

    // Enhanced heading detection
    if (this.isHeading(text)) {
      blockInfo.type = 'heading';
      blockInfo.semanticLevel = this.getHeadingLevel(text);
      blockInfo.metadata.formality = 0.8;
    }

    // Detect block quotes
    if (patterns.blockquote.test(text)) {
      blockInfo.type = 'quote';
      blockInfo.context.quoted = true;
      blockInfo.metadata.formality = 0.7;
    }

    // Analyze text complexity
    blockInfo.metadata.complexity = this.analyzeComplexity(text);

    // Detect content type and adjust metadata
    const contentType = this.detectContentType(text);
    if (contentType) {
      blockInfo.context.contentType = contentType;
      blockInfo.metadata.formality = this.getFormalityLevel(contentType);
    }

    // Analyze emotional content
    const emotionAnalysis = this.analyzeEmotion(text);
    if (emotionAnalysis.emotion) {
      blockInfo.metadata.emotion = emotionAnalysis.emotion;
      blockInfo.context.emotionalIntensity = emotionAnalysis.intensity;
    }

    return blockInfo;
  }

  static isHeading(text) {
    return (
      CommonPatterns.heading.test(text) ||
      (text.length < TextProcessorConfig.analysis.complexity.maxLength / 2 &&
        /^[A-Z][^.!?]+$/.test(text))
    );
  }

  static getHeadingLevel(text) {
    const match = text.match(/^#{1,6}/);
    if (match) {
      return match[0].length;
    }
    return text.length < 50 ? 2 : 1;
  }

  static analyzeComplexity(text) {
    const config = TextProcessorConfig.analysis.complexity;
    let complexity = 0;

    // Analyze sentence length
    const wordCount = text.split(CommonPatterns.whitespace).length;
    complexity += Math.min(wordCount / config.maxLength, 1) * 0.4;

    // Analyze clause count
    const clauseCount = (text.match(/,|;|and|or|but|because|if|when|while/g) || []).length + 1;
    complexity += Math.min(clauseCount / config.maxClauses, 1) * 0.3;

    // Analyze nesting level
    const nestingLevel = (text.match(/[\(\[\{]/g) || []).length;
    complexity += Math.min(nestingLevel / config.maxNesting, 1) * 0.3;

    return Math.min(complexity, 1);
  }

  static detectContentType(text) {
    const patterns = {
      technical: /\b(?:function|class|method|algorithm|data|system|process)\b/i,
      narrative: /\b(?:then|after|before|when|while|during)\b/i,
      dialogue: /["'](?:[^"']|\\.)*["']|[A-Z][a-z]+:/,
      description: /\b(?:appears?|looks?|seems?|feels?|smells?|sounds?|tastes?)\b/i
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return type;
      }
    }
    return null;
  }

  static getFormalityLevel(contentType) {
    const formalityLevels = {
      technical: 0.9,
      narrative: 0.6,
      dialogue: 0.4,
      description: 0.7
    };
    return formalityLevels[contentType] || 0.5;
  }

  static analyzeEmotion(text) {
    const result = {
      emotion: null,
      intensity: 0
    };

    // Check for emotional markers
    for (const [emotion, words] of Object.entries(semanticMarkers.emotion)) {
      const matches = text.toLowerCase().split(CommonPatterns.whitespace)
        .filter(word => words.has(word));
      
      if (matches.length > 0) {
        result.emotion = emotion;
        result.intensity = Math.min(matches.length / 5, 1);
        break;
      }
    }

    // Analyze punctuation for emotional intensity
    const exclamations = (text.match(/!/g) || []).length;
    const questions = (text.match(/\?/g) || []).length;
    result.intensity = Math.max(
      result.intensity,
      Math.min((exclamations + questions) / 3, 1)
    );

    return result;
  }

  static isActualSentenceEnd(text, position, { inQuote, inParentheses }) {
    if (inQuote || inParentheses > 0) return false;

    // Look back for potential abbreviation
    const prevWord = text.slice(Math.max(0, position - 20), position)
      .split(CommonPatterns.whitespace).pop().toLowerCase();

    // Check all abbreviation categories
    for (const category of Object.values(getAbbreviations(text))) {
      if (category.has(prevWord)) return false;
    }

    // Look ahead for sentence continuation
    const nextChar = text[position + 1] || '';
    const followingChar = text[position + 2] || '';

    // Handle closing punctuation
    if ('"\')]}'.includes(nextChar)) {
      return this.isActualSentenceEnd(text, position + 1, { inQuote, inParentheses });
    }

    // Check for proper sentence boundary
    return (
      nextChar === ' ' &&
      (!followingChar || followingChar === followingChar.toUpperCase()) &&
      !this.isSpecialCase(text, position)
    );
  }

  static isSpecialCase(text, position) {
    const nextWord = text.slice(position + 1, position + 20)
      .split(CommonPatterns.whitespace)[1] || '';
    
    // Check for special cases like "e.g. ", "i.e. ", etc.
    return (
      getAbbreviations(text).misc.has(nextWord.toLowerCase()) ||
      this.isNumberContinuation(text, position)
    );
  }

  static isNumberContinuation(text, position) {
    const nextPart = text.slice(position + 1, position + 10);
    return /^\s*\d+/.test(nextPart);
  }

  static getPauseForPunctuation(char) {
    return getPausePoints(text).get(char) || { weight: 0, pause: 0, context: null };
  }

  static analyzeEmphasis(text) {
    const words = text.toLowerCase().split(CommonPatterns.whitespace);
    const emphasisWords = words.filter(word => semanticMarkers.emphasis.has(word));
    
    const analysis = {
      hasEmphasis: emphasisWords.length > 0,
      emphasisCount: emphasisWords.length,
      emphasisWords,
      emphasisLevel: Math.min(emphasisWords.length / words.length, 1),
      patterns: this.detectEmphasisPatterns(text)
    };

    // Adjust emphasis level based on formatting
    if (analysis.patterns.some(pattern => pattern.type === 'strong')) {
      analysis.emphasisLevel = Math.min(analysis.emphasisLevel + 0.3, 1);
    }

    return analysis;
  }

  static detectEmphasisPatterns(text) {
    const patterns = [];
    let match;

    // Check for markdown-style emphasis
    const emphasisRegex = CommonPatterns.emphasis;
    while ((match = emphasisRegex.exec(text)) !== null) {
      patterns.push({
        type: match[1] || match[2] ? 'strong' : 'emphasis',
        text: match[0],
        position: match.index
      });
    }

    return patterns;
  }

  static detectSpecialContent(text) {
    return {
      hasUrls: CommonPatterns.url.test(text),
      hasEmails: CommonPatterns.email.test(text),
      hasNumbers: CommonPatterns.number.test(text),
      hasEmphasisMarkers: CommonPatterns.emphasis.test(text),
      hasMath: CommonPatterns.math.test(text),
      hasCode: CommonPatterns.code.test(text),
      hasCitations: CommonPatterns.citation.test(text),
      specialCharacters: this.extractSpecialCharacters(text)
    };
  }

  static extractSpecialCharacters(text) {
    const specialChars = text.match(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g) || [];
    return [...new Set(specialChars)];
  }
}

// Helper function to get language-specific patterns
function getPatterns(text) {
  const lang = detectLanguage(text);
  const langPatterns = getLanguagePatterns(lang);
  return {
    ...CommonPatterns,
    ...langPatterns.patterns
  };
}

// Helper function to get semantic markers
function getSemanticMarkers(text) {
  const lang = detectLanguage(text);
  const langPatterns = getLanguagePatterns(lang);
  return langPatterns.semanticMarkers;
}

// Helper function to get pause points
function getPausePoints(text) {
  const lang = detectLanguage(text);
  const langPatterns = getLanguagePatterns(lang);
  return langPatterns.pausePoints;
}

// Helper function to get abbreviations
function getAbbreviations(text) {
  const lang = detectLanguage(text);
  const langPatterns = getLanguagePatterns(lang);
  return langPatterns.abbreviations;
}
