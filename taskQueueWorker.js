// Task Queue Worker
class TaskQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.currentTask = null;
  }

  async enqueue(task) {
    this.queue.push(task);
    if (!this.processing) {
      await this.processQueue();
    }
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    while (this.queue.length > 0) {
      this.currentTask = this.queue.shift();
      try {
        const result = await this.processTask(this.currentTask);
        self.postMessage({
          type: 'taskComplete',
          taskId: this.currentTask.id,
          result
        });
      } catch (error) {
        self.postMessage({
          type: 'taskError',
          taskId: this.currentTask.id,
          error: error.message
        });
      }
    }
    this.processing = false;
    this.currentTask = null;
  }

  async processTask(task) {
    switch (task.type) {
      case 'processText':
        return this.processTextTask(task.data);
      case 'analyzeAudio':
        return this.analyzeAudioTask(task.data);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  processTextTask(text) {
    // Process text into optimal chunks for speech synthesis
    const chunks = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    let currentChunk = '';
    let currentLength = 0;
    const OPTIMAL_CHUNK_LENGTH = 150; // Optimal length for speech synthesis
    const MAX_CHUNK_LENGTH = 200; // Maximum length to prevent memory issues

    for (const sentence of sentences) {
      const sentenceLength = sentence.trim().length;
      
      // If single sentence is too long, split by commas or natural breaks
      if (sentenceLength > MAX_CHUNK_LENGTH) {
        const subParts = sentence.split(/,|;|\sand\s|\sor\s|\sbut\s/).filter(Boolean);
        for (const part of subParts) {
          if (currentLength + part.length > OPTIMAL_CHUNK_LENGTH) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = part;
            currentLength = part.length;
          } else {
            currentChunk += ' ' + part;
            currentLength += part.length;
          }
        }
      } else if (currentLength + sentenceLength > OPTIMAL_CHUNK_LENGTH) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
        currentLength = sentenceLength;
      } else {
        currentChunk += ' ' + sentence;
        currentLength += sentenceLength;
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim());

    return {
      chunks,
      metadata: {
        totalChunks: chunks.length,
        averageChunkLength: Math.round(chunks.reduce((acc, chunk) => acc + chunk.length, 0) / chunks.length),
        processingComplete: true
      }
    };
  }

  analyzeAudioTask(audioData) {
    // Analyze audio characteristics for better synthesis
    return {
      recommendedRate: 1.0,
      recommendedPitch: 1.0,
      pauseDuration: 250, // ms between chunks
      emphasis: []
    };
  }
}

const taskQueue = new TaskQueue();

// Message handler
self.onmessage = async function(e) {
  const { type, id, data } = e.data;
  
  try {
    await taskQueue.enqueue({ type, id, data });
  } catch (error) {
    self.postMessage({
      type: 'error',
      taskId: id,
      error: error.message
    });
  }
};

// Handle unexpected errors
self.onerror = function(error) {
  self.postMessage({
    type: 'workerError',
    error: error.message
  });
};
