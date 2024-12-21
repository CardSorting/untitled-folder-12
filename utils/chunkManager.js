// Chunk Management Utilities
import { TextProcessorConfig } from './textProcessorConfig.js';
import { CommonPatterns, getLanguagePatterns, detectLanguage } from './languagePatterns';

// Helper function to get language-specific patterns
function getPatterns(text) {
  const lang = detectLanguage(text);
  const langPatterns = getLanguagePatterns(lang);
  return {
    ...CommonPatterns,
    ...langPatterns.patterns
  };
}

// Helper function to get pause points
function getPausePoints(text) {
  const lang = detectLanguage(text);
  const langPatterns = getLanguagePatterns(lang);
  return langPatterns.pausePoints;
}

export class ChunkManager {
  static createOptimalChunks(sentence, blockType, context) {
    const config = TextProcessorConfig.chunk;
    const patterns = getPatterns(sentence);
    const pausePoints = getPausePoints(sentence);
    
    // Initialize chunking parameters
    const chunks = [];
    let currentChunk = this.initializeChunk(blockType);
    const words = this.splitIntoWords(sentence, patterns);

    // Process words with advanced chunking strategy
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const nextWord = words[i + 1] || '';
      const potentialText = currentChunk.text ? `${currentChunk.text} ${word}` : word;

      if (this.shouldSplitChunk(potentialText, word, nextWord, blockType, config, patterns, pausePoints)) {
        chunks.push(this.finalizeChunk(currentChunk, context));
        currentChunk = this.initializeChunk(blockType, word);
      } else {
        currentChunk.text = potentialText;
        this.updateChunkMetadata(currentChunk, word, context, detectLanguage(sentence));
      }
    }

    // Handle remaining text
    if (currentChunk.text) {
      chunks.push(this.finalizeChunk(currentChunk, context));
    }

    // Post-process chunks for optimal delivery
    return this.postProcessChunks(chunks, context);
  }

  static initializeChunk(blockType, initialText = '') {
    return {
      text: initialText,
      pause: 0,
      emphasis: false,
      type: blockType,
      metadata: {
        language: null,
        complexity: 0,
        emotion: null,
        formality: 0
      }
    };
  }

  static splitIntoWords(text, patterns) {
    return text.split(patterns.whitespace);
  }

  static shouldSplitChunk(potentialText, currentWord, nextWord, blockType, config, patterns, pausePoints) {
    const length = potentialText.length;
    const wordCount = potentialText.split(patterns.whitespace).length;

    // Check basic length constraints
    if (length >= config.max) return true;
    if (length < config.min) return false;

    // Check language-specific constraints
    if (wordCount > config.maxWords) return true;
    if (wordCount < config.minWords) return false;

    // Check for natural break points
    if (length >= config.optimal) {
      // Check preferred break points
      const lastChar = potentialText[potentialText.length - 1];
      if (config.breakpoints.preferred.includes(lastChar)) return true;

      // Check acceptable break points if approaching max length
      if (length >= config.optimal * 1.2) {
        if (config.breakpoints.acceptable.includes(lastChar)) return true;
      }

      // Prevent overflow with next word
      if (length + nextWord.length + 1 > config.max) return true;
    }

    // Check semantic boundaries
    if (this.isSemanticBoundary(currentWord, nextWord, patterns, pausePoints)) return true;

    return false;
  }

  static isSemanticBoundary(currentWord, nextWord, patterns, pausePoints) {
    // Check for transition words that indicate logical breaks
    const transitionWords = new Set([
      'however', 'therefore', 'furthermore', 'moreover',
      'meanwhile', 'consequently', 'nevertheless', 'otherwise'
    ]);

    return (
      transitionWords.has(nextWord.toLowerCase()) ||
      this.isPunctuationBoundary(currentWord, pausePoints) ||
      this.isStructuralBoundary(currentWord, nextWord, patterns)
    );
  }

  static isPunctuationBoundary(word, pausePoints) {
    const lastChar = word[word.length - 1];
    return pausePoints.has(lastChar) && pausePoints.get(lastChar).weight >= 0.6;
  }

  static isStructuralBoundary(currentWord, nextWord, patterns) {
    return (
      /[:;]$/.test(currentWord) ||
      /^[A-Z][a-z]/.test(nextWord) ||
      /["""]/.test(currentWord) ||
      /^[•\-*]/.test(nextWord)
    );
  }

  static updateChunkMetadata(chunk, word, context, language) {
    // Update language-specific metadata
    chunk.metadata.language = language;

    // Update pause based on punctuation
    const lastChar = word[word.length - 1];
    if (pausePoints.has(lastChar)) {
      const pauseInfo = pausePoints.get(lastChar);
      chunk.pause = Math.max(chunk.pause, pauseInfo.pause);
      
      // Adjust pause based on context
      if (context.emphasisLevel > 0) {
        chunk.pause *= 1.2;
      }
    }

    // Update emphasis and emotion
    const emphasis = TextAnalyzer.analyzeEmphasis(word);
    if (emphasis.hasEmphasis) {
      chunk.emphasis = true;
      chunk.metadata.complexity += 0.1;
    }

    // Update complexity based on word characteristics
    if (/^[A-Z][a-z]{12,}/.test(word)) {
      chunk.metadata.complexity += 0.05; // Long capitalized words
    }
    if (/[-–—]/.test(word)) {
      chunk.metadata.complexity += 0.03; // Hyphenated words
    }

    // Adjust formality based on word characteristics
    if (/^[A-Z]{2,}$/.test(word)) {
      chunk.metadata.formality += 0.1; // Acronyms
    }
  }

  static finalizeChunk(chunk, context) {
    const config = TextProcessorConfig;

    // Ensure minimum pause
    if (!chunk.pause) {
      chunk.pause = config.pause.breathing;
    }

    // Apply context-based adjustments
    if (context.contentType) {
      const contentSettings = config.voice.contentTypes[context.contentType];
      if (contentSettings) {
        chunk.pause = Math.min(chunk.pause * contentSettings.rate, config.pause.emphasis);
      }
    }

    // Apply emotional adjustments
    if (context.emotion) {
      const emotionPause = config.pause.emotion[context.emotion] || config.pause.emotion.neutral;
      chunk.pause = Math.min(chunk.pause * 1.2, emotionPause);
    }

    // Format text based on metadata
    chunk.text = this.formatChunkText(chunk);

    return {
      text: chunk.text.trim(),
      pause: Math.round(chunk.pause),
      type: chunk.type,
      emphasis: chunk.emphasis,
      metadata: chunk.metadata
    };
  }

  static formatChunkText(chunk) {
    let text = chunk.text;

    // Add emphasis markers if needed
    if (chunk.emphasis) {
      text = `[EMPHASIS] ${text}`;
    }

    // Add emotional markers if present
    if (chunk.metadata.emotion) {
      text = `[${chunk.metadata.emotion.toUpperCase()}] ${text}`;
    }

    // Add complexity markers for very complex text
    if (chunk.metadata.complexity > 0.8) {
      text = `[COMPLEX] ${text}`;
    }

    return text;
  }

  static postProcessChunks(chunks, context) {
    // Balance chunk sizes
    chunks = this.balanceChunks(chunks);

    // Optimize pauses between chunks
    chunks = this.optimizePauses(chunks, context);

    // Generate metadata for the chunk set
    const metadata = this.generateMetadata(chunks);

    return { chunks, metadata };
  }

  static balanceChunks(chunks) {
    const config = TextProcessorConfig.chunk;
    const balanced = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Check if chunk is too short and can be merged
      if (i < chunks.length - 1 && 
          chunk.text.length < config.min &&
          (chunk.text.length + chunks[i + 1].text.length) <= config.optimal) {
        // Merge with next chunk
        chunks[i + 1].text = `${chunk.text} ${chunks[i + 1].text}`;
        chunks[i + 1].pause = Math.max(chunk.pause, chunks[i + 1].pause);
        chunks[i + 1].emphasis = chunk.emphasis || chunks[i + 1].emphasis;
      } else {
        balanced.push(chunk);
      }
    }

    return balanced;
  }

  static optimizePauses(chunks, context) {
    const config = TextProcessorConfig.pause;
    let prevPause = 0;

    return chunks.map((chunk, index) => {
      // Avoid too long pauses between chunks
      if (prevPause > 0 && chunk.pause > prevPause * 1.5) {
        chunk.pause = Math.round(prevPause * 1.2);
      }

      // Add longer pauses before emphasis or new sections
      if (chunk.emphasis || (index > 0 && chunk.type !== chunks[index - 1].type)) {
        chunk.pause = Math.max(chunk.pause, config.emphasis);
      }

      prevPause = chunk.pause;
      return chunk;
    });
  }

  static generateMetadata(chunks) {
    const metadata = {
      totalChunks: chunks.length,
      averageChunkLength: 0,
      emphasisCount: 0,
      pauseDistribution: {
        short: 0,  // < 300ms
        medium: 0, // 300-600ms
        long: 0    // > 600ms
      },
      blockTypes: {},
      complexity: {
        average: 0,
        max: 0
      },
      languages: new Set()
    };

    let totalLength = 0;
    let totalComplexity = 0;

    for (const chunk of chunks) {
      // Basic metrics
      totalLength += chunk.text.length;
      if (chunk.emphasis) metadata.emphasisCount++;
      
      // Pause distribution
      if (chunk.pause < 300) metadata.pauseDistribution.short++;
      else if (chunk.pause < 600) metadata.pauseDistribution.medium++;
      else metadata.pauseDistribution.long++;
      
      // Block types
      metadata.blockTypes[chunk.type] = (metadata.blockTypes[chunk.type] || 0) + 1;

      // Complexity
      if (chunk.metadata.complexity) {
        totalComplexity += chunk.metadata.complexity;
        metadata.complexity.max = Math.max(metadata.complexity.max, chunk.metadata.complexity);
      }

      // Languages
      if (chunk.metadata.language) {
        metadata.languages.add(chunk.metadata.language);
      }
    }

    // Calculate averages
    metadata.averageChunkLength = Math.round(totalLength / chunks.length);
    metadata.complexity.average = totalComplexity / chunks.length;

    // Convert languages Set to Array for JSON serialization
    metadata.languages = Array.from(metadata.languages);

    metadata.processingComplete = true;
    return metadata;
  }
}
