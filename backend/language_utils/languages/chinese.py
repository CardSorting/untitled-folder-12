"""Chinese language patterns and rules for natural speech synthesis."""

CHINESE_PATTERNS = {
    # Breathing and pause patterns based on natural speech
    'breathing_patterns': {
        'long_breath': [
            r'[。！？]\s*(?=\n)',           # End of sentences with line break
            r'\n\n+',                       # Multiple line breaks
            r'(?<=。)(?=")',                # Before quote blocks
        ],
        'medium_breath': [
            r'[。！？](?!\s*\n)',           # End of sentences (not at line break)
            r'(?<=")(?![\s。！？])',         # After quote blocks (not at sentence end)
            r'[：；]\s*'                     # After colons/semicolons
        ],
        'short_breath': [
            r'[、，]',                       # Chinese commas
            r'(?<=")(?=说)',                # Between quotes and speech verb
            r'(?<=\w)(?=")'                 # Before quotes
        ],
        'micro_breath': [
            r'(?<=\w{2,})(?=\w{2,})',      # Between words
            r'(?<=[\)）】］｝])',            # After closing brackets
            r'(?=[\(（【［｛])'              # Before opening brackets
        ]
    },

    # Speech rate variations for natural flow
    'rate_patterns': {
        'very_slow': [
            r'(?<!。)…+',                   # Ellipsis
            r'".*?"',                       # Quoted speech
            r'\b(?:呃|嗯|那个)\b'           # Thoughtful interjections
        ],
        'slow': [
            r'(?<=。)\s*(?=\w)',            # After sentence endings
            r'(?<=[、，])\s*(?=\w)',         # After commas
            r'[\(（【［｛].*?[\)）】］｝]'    # Parenthetical content
        ],
        'slightly_slow': [
            r'(?<=的)\s*(?=\w)',            # After 的 particle
            r'(?<=地)\s*(?=\w)',            # After 地 particle
            r'(?<=得)\s*(?=\w)'             # After 得 particle
        ],
        'slightly_fast': [
            r'(?<=和)\s*(?=\w)',            # After 和 conjunction
            r'(?<=在)\s*(?=\w)',            # After 在 preposition
            r'(?<=对)\s*(?=\w)'             # After 对 preposition
        ],
        'fast': [
            r'(?<=的)\s*(?=\w)',            # After 的 particle
            r'(?<=了)\s*(?=\w)',            # After 了 particle
            r'(?<=\w{1})(?=\w{1})'         # Between single characters
        ],
        'very_fast': [
            r'\b(?:就是|这个|那个)\b',       # Filler words
            r'[\(（【［｛][^\)）】］｝]{1,4}[\)）】］｝]', # Short parentheticals
            r'(?<=\w{1})\s+(?=\w{1})'      # Between very short words
        ]
    },

    # Intonation patterns for natural expression
    'intonation_patterns': {
        'rising_high': [
            r'[？!]',                       # Question/exclamation marks
            r'(?<=吗)[？!]',                # Question particle
            r'[？！]{2,}'                    # Multiple punctuation
        ],
        'rising_medium': [
            r'(?<=吗)。',                   # Questions with 吗
            r'(?<=呢)。',                   # Questions with 呢
            r'(?<=吧)。'                    # Suggestions
        ],
        'rising_slight': [
            r'(?<=啊)。',                   # Mild emphasis
            r'(?<=呀)。',                   # Soft emphasis
            r'(?<=嘛)。'                    # Obvious statements
        ],
        'falling_high': [
            r'[！]{2,}',                    # Multiple exclamations
            r'\b(?:不行|错|停)\b.*[！]',     # Strong negatives/commands
            r'\b(?:危险|快跑)\b.*[！]'       # Urgent warnings
        ],
        'falling_medium': [
            r'(?<=了)。',                   # Completed actions
            r'(?<=的)。',                   # Descriptive statements
            r'(?<=吧)。'                    # Mild commands
        ],
        'falling_slight': [
            r'(?<=啊)。',                   # Mild emphasis
            r'(?<=呢)。',                   # Gentle statements
            r'(?<=嘛)。'                    # Obvious conclusions
        ]
    },

    # Pitch patterns for emotional expression
    'pitch_patterns': {
        'very_high': [
            r'[！]{3,}',                    # Multiple exclamations
            r'\b(?:太棒了|厉害|完美)\b.*[！]', # Excited expressions
            r'\b(?:救命|危险)\b.*[！]'       # Urgent calls
        ],
        'high': [
            r'\b(?:高兴|wonderful|棒)\b',    # Positive expressions
            r'(?<=吧)[！]',                 # Excited suggestions
            r'[！]{1,2}'                    # One or two exclamations
        ],
        'slightly_high': [
            r'\b(?:好|对|行)\b',            # Affirmative words
            r'(?<=吗)(?=？)',               # Questions
            r'(?<=呢)(?=？)'                # Gentle questions
        ],
        'slightly_low': [
            r'[\(（【［｛].*?[\)）】］｝]',    # Parentheticals
            r'\b(?:但是|然而|不过)\b',       # Contrasting expressions
            r'\b(?:可能|大概|或许)\b'        # Uncertainty
        ],
        'low': [
            r'\b(?:伤心|遗憾|抱歉)\b',       # Negative expressions
            r'(?<=。)(?:那个|这个)\b',       # Hesitations
            r'\b(?:唉|哎)\b'                # Sighs
        ],
        'very_low': [
            r'\b(?:糟糕|terrible|完蛋)\b',   # Very negative expressions
            r'(?<=。)(?:唉|哎呀)\b',        # Heavy sighs
            r'_[^_]+_'                      # Underscored text
        ]
    },

    # Volume patterns for emphasis
    'volume_patterns': {
        'very_loud': [
            r'[！]{3,}',                    # Multiple exclamations
            r'\b(?:危险|紧急|警报)\b',       # Warning words
            r'\*\*[^*]+\*\*'               # Double-starred text
        ],
        'loud': [
            r'\b(?:重要|警告|注意)\b',       # Attention words
            r'[！]{1,2}',                   # One or two exclamations
            r'\*[^*]+\*'                    # Single-starred text
        ],
        'slightly_loud': [
            r'\b(?:注意|记住|当心)\b',       # Emphasis words
            r'\b(?:必须|一定|肯定)\b',       # Strong modals
            r'`[^`]+`'                      # Backticked text
        ],
        'slightly_soft': [
            r'[\(（【［｛].*?[\)）】］｝]',    # Parentheticals
            r'\b(?:可能|也许|大概)\b',       # Uncertainty
            r'_[^_]+_'                      # Underscored text
        ],
        'soft': [
            r'\b(?:轻声|小声)\b',            # Quiet speech
            r'(?<=。)(?:那个|这个)\b',       # Hesitations
            r'\[[^\]]+\]'                   # Bracketed content
        ],
        'very_soft': [
            r'\b(?:悄悄|私语)\b',            # Very quiet speech
            r'~[^~]+~',                     # Tilded text
            r'(?<=[\(（]).*?(?=[\)）])'     # Inside parentheses
        ]
    }
}
