"""Language Processing Utilities"""

from .languages.english import ENGLISH_PATTERNS
from .languages.japanese import JAPANESE_PATTERNS
from .languages.chinese import CHINESE_PATTERNS
import re
import langdetect

# Common patterns across all languages
COMMON_PATTERNS = {
    'whitespace': r'\s+',
    'linebreak': r'\r?\n',
    'indent': r'^(?:    |\t)',
    'structure': {
        'heading': {'#', '##', '###', '====', '----'},
        'section': {'§', '¶', '†', '‡'},
        'formatting': {'*', '_', '**', '__', '~~', '`'}
    },
    'quotes': {'"', '"', '"', "'", "'", "'", '「', '」', '『', '』'},
    'lists': {
        '•', '-', '*', '1.', '2.', '3.', '①', '②', '③',
        'a.', 'b.', 'c.', 'A.', 'B.', 'C.', '(a)', '(b)', '(c)',
        '一', '二', '三', 'Ⅰ', 'Ⅱ', 'Ⅲ'
    }
}

def detect_language(text):
    """Detect the language of the given text."""
    try:
        lang = langdetect.detect(text)
        if lang in ['zh-cn', 'zh-tw']:
            return 'chinese'
        elif lang == 'ja':
            return 'japanese'
        else:
            return 'english'  # default to English for unsupported languages
    except:
        return 'english'  # default to English if detection fails

def get_language_patterns(language):
    """Get language-specific patterns."""
    patterns = {
        'english': ENGLISH_PATTERNS,
        'japanese': JAPANESE_PATTERNS,
        'chinese': CHINESE_PATTERNS
    }
    return patterns.get(language, ENGLISH_PATTERNS)  # default to English if language not found
