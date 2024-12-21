// Text Processor Configuration
export const TextProcessorConfig = {
  // Chunk size configuration
  chunk: {
    optimal: 150,
    max: 200,
    min: 50,
    tolerance: 20,
    // Advanced chunking options
    breakpoints: {
      preferred: ['。', '．', '！', '？', '.', '!', '?'], // Primary break points
      acceptable: [',', '、', '，', ';', '；'], // Secondary break points
      fallback: [' ', '\n', '\t'] // Last resort break points
    },
    // Language-specific settings
    languages: {
      english: { maxWords: 25, minWords: 3 },
      japanese: { maxChars: 50, minChars: 10 },
      chinese: { maxChars: 50, minChars: 10 }
    }
  },

  // Pause duration configuration
  pause: {
    breathing: 250,
    emphasis: 500,
    paragraph: 1000,
    list: 400,
    // Detailed pause settings
    punctuation: {
      period: 800,
      comma: 400,
      semicolon: 600,
      colon: 500,
      dash: 300,
      parenthesis: 300,
      quote: 200,
      ellipsis: 450
    },
    // Context-based pauses
    context: {
      dialogue: 600,
      description: 400,
      action: 300,
      transition: 500
    },
    // Emotional pauses
    emotion: {
      excited: 200,
      sad: 600,
      thoughtful: 800,
      neutral: 400
    }
  },

  // Processing settings
  processing: {
    maxIterations: 1000,
    bufferSize: 5000,
    maxBlockSize: 10000,
    // Performance settings
    throttle: {
      chunkDelay: 50,      // ms between chunk processing
      batchSize: 10,       // chunks per batch
      maxQueueSize: 100    // maximum queued chunks
    },
    // Memory management
    memory: {
      maxCacheSize: 1000,  // maximum cached items
      cleanupThreshold: 0.8, // cleanup when 80% full
      ttl: 300000         // cache TTL in ms (5 minutes)
    }
  },

  // Voice and speech settings
  voice: {
    default: {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0
    },
    // Content-type specific settings
    contentTypes: {
      heading: { rate: 0.9, pitch: 1.1, volume: 1.0 },
      emphasis: { rate: 0.95, pitch: 1.05, volume: 1.0 },
      quote: { rate: 1.0, pitch: 0.95, volume: 0.9 },
      parenthetical: { rate: 1.1, pitch: 0.9, volume: 0.8 }
    },
    // Language-specific adjustments
    languages: {
      english: { rate: 1.0, pitch: 1.0 },
      japanese: { rate: 0.9, pitch: 1.0 },
      chinese: { rate: 0.9, pitch: 1.0 }
    }
  },

  // Text analysis settings
  analysis: {
    // Sentence complexity metrics
    complexity: {
      maxLength: 100,      // maximum sentence length
      maxClauses: 5,       // maximum clauses per sentence
      maxNesting: 3        // maximum nested structures
    },
    // Content classification
    classification: {
      minConfidence: 0.7,  // minimum confidence for classification
      categories: ['narrative', 'dialogue', 'description', 'technical']
    },
    // Semantic analysis
    semantic: {
      emphasisThreshold: 0.6,  // threshold for emphasis detection
      emotionThreshold: 0.5,   // threshold for emotion detection
      contextWindow: 3         // sentences for context analysis
    }
  },

  // Error handling and recovery
  errorHandling: {
    maxRetries: 3,
    retryDelay: 1000,
    fallbackOptions: {
      useSimpleChunking: true,
      skipComplexAnalysis: true,
      forceSynchronousProcessing: true
    },
    logging: {
      level: 'warning',    // log level: debug, info, warning, error
      maxEntries: 1000,    // maximum log entries
      persistLogs: false   // whether to persist logs
    }
  },

  // Accessibility settings
  accessibility: {
    screenReader: {
      announceStructure: true,  // announce structural elements
      describeFormatting: true, // describe text formatting
      indicatePunctuation: true // indicate punctuation marks
    },
    alternatives: {
      provideTextAlternatives: true,  // provide text alternatives
      describeMathContent: true,      // describe mathematical content
      handleSpecialCharacters: true   // handle special characters
    }
  }
};
