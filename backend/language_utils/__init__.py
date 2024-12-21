"""Language Processing Utilities"""

from .languages.english import ENGLISH_PATTERNS
from .languages.japanese import JAPANESE_PATTERNS
from .languages.chinese import CHINESE_PATTERNS
import re
import langdetect

# Common patterns across all languages
COMMON_PATTERNS = {
    'whitespace': r'\s+',
    'punctuation': r'[.,!?;:]',
    'numbers': r'\d+',
    'quotes': r'[""].*?[""]'
}

def detect_language(text: str) -> str:
    """Detect the language of the given text."""
    try:
        return langdetect.detect(text)
    except:
        return 'en'  # Default to English if detection fails

def get_language_patterns(language: str) -> dict:
    """Get language-specific patterns."""
    patterns = {
        'en': ENGLISH_PATTERNS,
        'ja': JAPANESE_PATTERNS,
        'zh': CHINESE_PATTERNS
    }
    return patterns.get(language, ENGLISH_PATTERNS)  # Default to English if language not found
