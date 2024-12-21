// Advanced Text Processor Worker with NLP-like features
import { TextProcessorConfig } from './utils/textProcessorConfig.js';
import { CommonPatterns, getLanguagePatterns, detectLanguage } from './utils/languagePatterns.js';
import { TextAnalyzer } from './utils/textAnalyzer.js';
import { ChunkManager } from './utils/chunkManager.js';

class TextProcessor {
  async processText(text) {
    try {
      // Initial text preparation
      const preparedText = await this.prepareText(text);
      
      // Split into semantic blocks
      const blocks = await this.splitIntoBlocks(preparedText);
      
      // Process blocks with context awareness
      const processedBlocks = await this.processBlocksWithContext(blocks);
      
      // Generate final chunks with metadata
      const finalChunks = [];
      for (const block of processedBlocks) {
        finalChunks.push(...block.chunks);
      }

      const metadata = ChunkManager.generateMetadata(finalChunks);
      return { chunks: finalChunks, metadata };

    } catch (error) {
      console.error('Text processing error:', error);
      throw error;
    }
  }

  async prepareText(text) {
    // Basic normalization
    let normalized = text
      .replace(getPatterns(text).whitespace, ' ')
      .replace(/[""]/g, '"')
      .replace(/[—–]/g, '-')
      .replace(/\.{3,}/g, '...')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();

    // Handle special cases
    normalized = await this.handleSpecialCases(normalized);

    return normalized;
  }

  async handleSpecialCases(text) {
    const specialContent = TextAnalyzer.detectSpecialContent(text);
    
    // Handle URLs
    if (specialContent.hasUrls) {
      text = text.replace(getPatterns(text).url, (match) => `[URL: ${match.split('/')[2]}]`);
    }

    // Handle email addresses
    if (specialContent.hasEmails) {
      text = text.replace(getPatterns(text).email, '[EMAIL ADDRESS]');
    }

    // Handle numbers
    if (specialContent.hasNumbers) {
      text = text.replace(getPatterns(text).number, (match) => match.replace(/,/g, ' comma '));
    }

    // Handle emphasis markers
    if (specialContent.hasEmphasisMarkers) {
      text = text.replace(getPatterns(text).emphasis, (match, g1, g2, g3, g4) => {
        const content = g1 || g2 || g3 || g4;
        return `[EMPHASIS: ${content}]`;
      });
    }

    return text;
  }

  async splitIntoBlocks(text) {
    const blocks = [];
    let currentBlock = {
      text: '',
      type: 'paragraph',
      context: {},
      semanticLevel: 0
    };

    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        if (currentBlock.text) {
          blocks.push(currentBlock);
          currentBlock = {
            text: '',
            type: 'paragraph',
            context: {},
            semanticLevel: 0
          };
        }
        continue;
      }

      // Detect block type and context
      const blockInfo = TextAnalyzer.analyzeBlockType(trimmedLine);
      
      if (blockInfo.type !== currentBlock.type) {
        if (currentBlock.text) {
          blocks.push(currentBlock);
        }
        currentBlock = {
          text: trimmedLine,
          type: blockInfo.type,
          context: blockInfo.context,
          semanticLevel: blockInfo.semanticLevel
        };
      } else {
        currentBlock.text += ' ' + trimmedLine;
      }
    }

    if (currentBlock.text) {
      blocks.push(currentBlock);
    }

    return blocks;
  }

  async processBlocksWithContext(blocks) {
    const processedBlocks = [];
    let context = {
      previousType: null,
      semanticChain: [],
      emphasisLevel: 0
    };

    for (const block of blocks) {
      const processed = await this.processBlockWithContext(block, context);
      processedBlocks.push(processed);

      // Update context
      context.previousType = block.type;
      context.semanticChain.push(block.type);
      if (context.semanticChain.length > 3) context.semanticChain.shift();
      context.emphasisLevel = block.context.emphasis ? 
        context.emphasisLevel + 1 : Math.max(0, context.emphasisLevel - 1);
    }

    return processedBlocks;
  }

  async processBlockWithContext(block, context) {
    const sentences = await this.splitIntoSmartSentences(block.text);
    const processedSentences = [];

    for (const sentence of sentences) {
      const chunks = ChunkManager.createOptimalChunks(sentence, block.type, context);
      processedSentences.push(...chunks);
    }

    return {
      ...block,
      chunks: processedSentences
    };
  }

  async splitIntoSmartSentences(text) {
    const sentences = [];
    let current = '';
    let buffer = '';
    let inQuote = false;
    let inParentheses = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      buffer += char;

      // Handle quotes and parentheses
      if (getSemanticMarkers(text).quotes.has(char)) inQuote = !inQuote;
      if (char === '(') inParentheses++;
      if (char === ')') inParentheses = Math.max(0, inParentheses - 1);

      if (char === '.' || char === '!' || char === '?') {
        if (TextAnalyzer.isActualSentenceEnd(text, i, { inQuote, inParentheses })) {
          current += buffer;
          sentences.push(current.trim());
          current = '';
          buffer = '';
        }
      } else if (TextAnalyzer.getPauseForPunctuation(char).weight > 0) {
        if (buffer.length > TextProcessorConfig.chunk.min && !inQuote && !inParentheses) {
          current += buffer;
          sentences.push(current.trim());
          current = '';
          buffer = '';
        }
      }
    }

    if (buffer.length > 0) {
      current += buffer;
    }
    if (current.length > 0) {
      sentences.push(current.trim());
    }

    return sentences;
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

// Initialize processor and handle messages
const processor = new TextProcessor();

self.onmessage = async function(e) {
  const { type, id, data } = e.data;
  
  if (type === 'processText') {
    try {
      const result = await processor.processText(data);
      self.postMessage({
        type: 'taskComplete',
        taskId: id,
        result
      });
    } catch (error) {
      self.postMessage({
        type: 'taskError',
        taskId: id,
        error: error.message
      });
    }
  }
};

// Handle unexpected errors
self.onerror = function(error) {
  self.postMessage({
    type: 'workerError',
    error: error.message
  });
};
