"""Text Processing Utilities"""

from . import detect_language, get_language_patterns, COMMON_PATTERNS
import re

class TextProcessor:
    def __init__(self):
        self.config = {
            'chunk': {
                'optimal': 150,
                'max': 200,
                'min': 50,
                'tolerance': 20,
                'breakpoints': {
                    'preferred': ['。', '．', '！', '？', '.', '!', '?'],
                    'acceptable': [',', '、', '，', ';', '；'],
                    'fallback': [' ', '\n', '\t']
                },
                'languages': {
                    'english': {'max_words': 25, 'min_words': 3},
                    'japanese': {'max_chars': 50, 'min_chars': 10},
                    'chinese': {'max_chars': 50, 'min_chars': 10}
                }
            },
            'pause': {
                'breathing': 250,
                'emphasis': 500,
                'paragraph': 1000,
                'list': 400,
                'punctuation': {
                    'period': 800,
                    'comma': 400,
                    'semicolon': 600,
                    'colon': 500,
                    'dash': 400,
                    'parenthesis': 300,
                    'quote': 300
                }
            }
        }

    def analyze_block_type(self, text):
        """Analyze the type of text block."""
        block_info = {
            'type': 'paragraph',
            'context': {},
            'semantic_level': 0,
            'metadata': {
                'complexity': 0,
                'formality': 0,
                'emotion': None,
                'language': detect_language(text)
            }
        }

        patterns = get_language_patterns(block_info['metadata']['language'])

        # Check for list items
        if any(text.strip().startswith(marker) for marker in COMMON_PATTERNS['lists']):
            block_info['type'] = 'list-item'
            block_info['semantic_level'] = 1
            block_info['metadata']['formality'] = 0.5

        # Check for headings
        if any(text.strip().startswith(marker) for marker in COMMON_PATTERNS['structure']['heading']):
            block_info['type'] = 'heading'
            block_info['semantic_level'] = 2
            block_info['metadata']['formality'] = 0.8

        return block_info

    def create_optimal_chunks(self, text):
        """Create optimal chunks from the text."""
        language = detect_language(text)
        patterns = get_language_patterns(language)
        chunks = []
        
        # Split into sentences first
        sentences = self._split_into_sentences(text, patterns)
        
        current_chunk = []
        current_length = 0
        
        for sentence in sentences:
            sentence_length = len(sentence)
            
            # If adding this sentence would exceed max length and we already have content
            if current_length + sentence_length > self.config['chunk']['max'] and current_chunk:
                chunks.append(' '.join(current_chunk))
                current_chunk = []
                current_length = 0
            
            current_chunk.append(sentence)
            current_length += sentence_length
            
            # If we've reached optimal length, start a new chunk
            if current_length >= self.config['chunk']['optimal']:
                chunks.append(' '.join(current_chunk))
                current_chunk = []
                current_length = 0
        
        # Add any remaining content
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks

    def _split_into_sentences(self, text, patterns):
        """Split text into sentences using language-specific patterns."""
        sentences = []
        current_sentence = []
        words = text.split()
        
        for word in words:
            current_sentence.append(word)
            
            # Check if this word ends with a sentence terminal
            if any(word.endswith(terminal) for terminal in patterns['sentence_boundaries']['terminals']):
                # Check if this is actually an abbreviation
                if not any(word.lower() in abbr_set 
                          for abbr_set in patterns.get('abbreviations', {}).values()):
                    sentences.append(' '.join(current_sentence))
                    current_sentence = []
        
        # Add any remaining content as a sentence
        if current_sentence:
            sentences.append(' '.join(current_sentence))
        
        return sentences
