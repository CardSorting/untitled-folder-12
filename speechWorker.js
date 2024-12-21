// Worker for text processing and chunking
self.onmessage = function(e) {
  const { text, action } = e.data;
  
  if (action === 'process') {
    // Process text into manageable chunks
    const chunks = processText(text);
    self.postMessage({ action: 'chunks', chunks });
  }
};

function processText(text) {
  // Remove excessive whitespace and normalize
  text = text.replace(/\s+/g, ' ').trim();
  
  // Split into sentences (basic implementation)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Group sentences into chunks (max 200 chars per chunk)
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > 200) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  
  return chunks;
}
