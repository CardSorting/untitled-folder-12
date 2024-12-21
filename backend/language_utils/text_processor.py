import re
from typing import List, Dict, Any
from .languages import english, japanese, chinese

class TextProcessor:
    def __init__(self):
        self.language_patterns = {
            'en': english.ENGLISH_PATTERNS,
            'ja': japanese.JAPANESE_PATTERNS,
            'zh': chinese.CHINESE_PATTERNS
        }
        
        # SSML-like markers for natural speech
        self.speech_markers = {
            'breathing': {
                'extra_long_breath': '<break time="2.0s"/>',  # Between major topics
                'long_breath': '<break time="1.2s"/>',        # Between paragraphs
                'medium_breath': '<break time="0.8s"/>',      # Between sentences
                'short_breath': '<break time="0.4s"/>',       # Between clauses
                'micro_breath': '<break time="0.2s"/>',       # Between phrases
                'mini_breath': '<break time="0.1s"/>'         # Between words
            },
            'rate': {
                'extremely_slow': '<prosody rate="40%">',     # For dramatic emphasis
                'very_slow': '<prosody rate="60%">',          # For important points
                'slow': '<prosody rate="80%">',               # For emphasis
                'slightly_slow': '<prosody rate="90%">',      # For clarity
                'normal': '<prosody rate="100%">',            # Default rate
                'slightly_fast': '<prosody rate="115%">',     # For less important info
                'fast': '<prosody rate="130%">',              # For parentheticals
                'very_fast': '<prosody rate="150%">',         # For asides
                'extremely_fast': '<prosody rate="175%">'     # For skimmable content
            },
            'pitch': {
                'extremely_high': '<prosody pitch="+100%">',  # For extreme excitement
                'very_high': '<prosody pitch="+80%">',        # For high emotion
                'high': '<prosody pitch="+40%">',             # For questions/emphasis
                'slightly_high': '<prosody pitch="+20%">',    # For interest
                'normal': '<prosody pitch="0%">',             # Default pitch
                'slightly_low': '<prosody pitch="-20%">',     # For calm
                'low': '<prosody pitch="-40%">',              # For serious content
                'very_low': '<prosody pitch="-80%">',         # For grave content
                'extremely_low': '<prosody pitch="-100%">'    # For ominous content
            },
            'volume': {
                'silent': '<prosody volume="-96db">',         # Nearly silent
                'whisper': '<prosody volume="-48db">',        # Whispered
                'very_soft': '<prosody volume="-24db">',      # Very quiet
                'soft': '<prosody volume="-12db">',           # Quiet
                'slightly_soft': '<prosody volume="-6db">',   # Slightly quiet
                'normal': '<prosody volume="0db">',           # Default volume
                'slightly_loud': '<prosody volume="+6db">',   # Slightly loud
                'loud': '<prosody volume="+12db">',           # Loud
                'very_loud': '<prosody volume="+24db">',      # Very loud
                'shouting': '<prosody volume="+48db">'        # Shouting
            },
            'end': '</prosody>'
        }

    def create_optimal_chunks(self, text: str, language: str = 'en') -> List[str]:
        """Create optimal chunks with natural breathing and prosody."""
        patterns = self.language_patterns.get(language, self.language_patterns['en'])
        
        # First, analyze the overall text structure
        structure = self._analyze_text_structure(text)
        
        # Split into major chunks at breathing points
        chunks = self._split_at_breathing_points(text, patterns, structure)
        
        # Process each chunk with appropriate speech markers
        processed_chunks = []
        for chunk in chunks:
            if isinstance(chunk, str) and chunk.startswith('<break'):
                processed_chunks.append(chunk)
            else:
                # Analyze the emotional context of this chunk
                emotion = self._analyze_emotional_context(chunk, patterns)
                # Process the chunk with appropriate markers
                processed = self._add_speech_markers(chunk.strip(), patterns, emotion)
                if processed.strip():
                    processed_chunks.append(processed)
        
        return processed_chunks

    def _analyze_text_structure(self, text: str) -> Dict[str, Any]:
        """Analyze the overall structure of the text."""
        return {
            'total_length': len(text),
            'sentences': len(re.findall(r'[.!?]+', text)),
            'paragraphs': len(re.findall(r'\n\n+', text)) + 1,
            'has_dialog': bool(re.search(r'[""].*?[""]', text)),
            'has_lists': bool(re.search(r'(?m)^\s*[-*•]|\d+\.|\([a-z]\)', text)),
            'has_code': bool(re.search(r'(?m)^\s*[{[(]|^\s*\w+\s*=', text)),
            'formality_level': self._assess_formality(text)
        }

    def _assess_formality(self, text: str) -> float:
        """Assess the formality level of the text (0.0 to 1.0)."""
        formal_indicators = len(re.findall(
            r'\b(?:therefore|however|moreover|furthermore|nevertheless|accordingly)\b',
            text, re.IGNORECASE
        ))
        informal_indicators = len(re.findall(
            r'\b(?:like|you know|kind of|sort of|basically|pretty much)\b',
            text, re.IGNORECASE
        ))
        
        if formal_indicators + informal_indicators == 0:
            return 0.5
        return formal_indicators / (formal_indicators + informal_indicators)

    def _analyze_emotional_context(self, text: str, patterns: Dict) -> Dict[str, float]:
        """Analyze the emotional context of the text."""
        emotions = {
            'excitement': 0.0,
            'urgency': 0.0,
            'happiness': 0.0,
            'sadness': 0.0,
            'anger': 0.0,
            'fear': 0.0,
            'surprise': 0.0,
            'uncertainty': 0.0
        }
        
        # Check exclamation marks and question marks
        emotions['excitement'] += len(re.findall(r'!+', text)) * 0.2
        emotions['uncertainty'] += len(re.findall(r'\?+', text)) * 0.2
        
        # Check emotional words and patterns
        for pattern in patterns['pitch_patterns']['very_high']:
            emotions['excitement'] += len(re.findall(pattern, text)) * 0.3
        
        for pattern in patterns['pitch_patterns']['very_low']:
            emotions['sadness'] += len(re.findall(pattern, text)) * 0.3
        
        # Normalize values to 0.0-1.0 range
        max_value = max(emotions.values())
        if max_value > 1.0:
            for emotion in emotions:
                emotions[emotion] /= max_value
        
        return emotions

    def _split_at_breathing_points(self, text: str, patterns: Dict, structure: Dict) -> List[str]:
        """Split text at natural breathing points, considering text structure."""
        chunks = [text]
        
        # Adjust breathing patterns based on text structure
        if structure['has_dialog']:
            # Add extra pauses around dialog
            patterns['breathing_patterns']['long_breath'].append(r'[""][^""]+[""]')
        
        if structure['has_lists']:
            # Add pauses between list items
            patterns['breathing_patterns']['medium_breath'].append(
                r'(?m)^\s*[-*•]|\d+\.|\([a-z]\)'
            )
        
        # Split at each breathing point level
        for breath_type in ['long_breath', 'medium_breath', 'short_breath', 'micro_breath']:
            new_chunks = []
            for chunk in chunks:
                if isinstance(chunk, str) and not chunk.startswith('<break'):
                    parts = []
                    for pattern in patterns['breathing_patterns'][breath_type]:
                        if not parts:
                            parts = re.split(f'({pattern})', chunk)
                        else:
                            new_parts = []
                            for part in parts:
                                if not re.match(r'<break|<prosody', part):
                                    split_parts = re.split(f'({pattern})', part)
                                    new_parts.extend(split_parts)
                                else:
                                    new_parts.append(part)
                            parts = new_parts
                    
                    # Add appropriate breaks
                    for part in parts:
                        if part.strip():
                            for pattern in patterns['breathing_patterns'][breath_type]:
                                if re.match(pattern, part):
                                    new_chunks.append(self.speech_markers['breathing'][breath_type])
                                    break
                            else:
                                new_chunks.append(part)
                else:
                    new_chunks.append(chunk)
            chunks = new_chunks
        
        return [c for c in chunks if c.strip() or c.startswith('<break')]

    def _add_speech_markers(self, text: str, patterns: Dict, emotion: Dict[str, float]) -> str:
        """Add speech markers based on patterns and emotional context."""
        marked_text = text
        
        # Adjust rate based on content and emotion
        for rate_type, patterns_list in patterns['rate_patterns'].items():
            rate_multiplier = 1.0
            if emotion['urgency'] > 0.7:
                rate_multiplier = 1.3
            elif emotion['uncertainty'] > 0.7:
                rate_multiplier = 0.8
                
            for pattern in patterns_list:
                marked_text = re.sub(
                    pattern,
                    lambda m: f"{self.speech_markers['rate'][rate_type]}{m.group(0)}{self.speech_markers['end']}",
                    marked_text
                )
        
        # Adjust pitch based on emotion
        for pitch_type, patterns_list in patterns['pitch_patterns'].items():
            pitch_multiplier = 1.0
            if emotion['excitement'] > 0.7:
                pitch_multiplier = 1.3
            elif emotion['sadness'] > 0.7:
                pitch_multiplier = 0.7
                
            for pattern in patterns_list:
                marked_text = re.sub(
                    pattern,
                    lambda m: f"{self.speech_markers['pitch'][pitch_type]}{m.group(0)}{self.speech_markers['end']}",
                    marked_text
                )
        
        # Adjust volume based on emotion and content
        for volume_type, patterns_list in patterns['volume_patterns'].items():
            volume_multiplier = 1.0
            if emotion['anger'] > 0.7:
                volume_multiplier = 1.5
            elif emotion['fear'] > 0.7:
                volume_multiplier = 0.7
                
            for pattern in patterns_list:
                marked_text = re.sub(
                    pattern,
                    lambda m: f"{self.speech_markers['volume'][volume_type]}{m.group(0)}{self.speech_markers['end']}",
                    marked_text
                )
        
        return marked_text

    def get_speech_markers(self) -> Dict[str, Any]:
        """Return the speech markers dictionary."""
        return self.speech_markers
