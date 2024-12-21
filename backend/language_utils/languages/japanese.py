"""Japanese language patterns and rules for natural speech synthesis."""

JAPANESE_PATTERNS = {
    # Breathing and pause patterns based on natural speech
    'breathing_patterns': {
        'long_breath': [
            r'[。！？]\s*(?=\n)',           # End of sentences with line break
            r'\n\n+',                       # Multiple line breaks
            r'(?<=。)(?=「)',               # Before quote blocks
        ],
        'medium_breath': [
            r'[。！？](?!\s*\n)',           # End of sentences (not at line break)
            r'(?<=」)(?![\s。！？])',        # After quote blocks (not at sentence end)
            r'[：；]\s*'                     # After colons/semicolons
        ],
        'short_breath': [
            r'、',                          # Japanese commas
            r'(?<=」)(?=と)',               # Between quotes and quotative particle
            r'(?<=\w)(?=「)'                # Before quotes
        ],
        'micro_breath': [
            r'(?<=\w{4,})(?=\w{4,})',      # Between long words
            r'(?<=[\)）】］｝])',            # After closing brackets
            r'(?=[\(（【［｛])'              # Before opening brackets
        ]
    },

    # Speech rate variations for natural flow
    'rate_patterns': {
        'very_slow': [
            r'(?<!。)…+',                   # Ellipsis
            r'「.*?」',                      # Quoted speech
            r'\b(?:あの|えーと|うーん)\b'    # Thoughtful interjections
        ],
        'slow': [
            r'(?<=。)\s*(?=\w)',            # After sentence endings
            r'(?<=、)\s*(?=\w)',            # After commas
            r'[\(（【［｛].*?[\)）】］｝]'    # Parenthetical content
        ],
        'slightly_slow': [
            r'(?<=も)\s*(?=\w)',            # After も particle
            r'(?<=は)\s*(?=\w)',            # After は particle
            r'(?<=が)\s*(?=\w)'             # After が particle
        ],
        'slightly_fast': [
            r'(?<=の)\s*(?=\w)',            # After の particle
            r'(?<=に)\s*(?=\w)',            # After に particle
            r'(?<=を)\s*(?=\w)'             # After を particle
        ],
        'fast': [
            r'(?<=と)\s*(?=\w)',            # After と particle
            r'(?<=で)\s*(?=\w)',            # After で particle
            r'(?<=\w{1,2})(?=\w{1,2})'     # Between short words
        ],
        'very_fast': [
            r'\b(?:えっと|あの|その)\b',     # Filler words
            r'[\(（【［｛][^\)）】］｝]{1,5}[\)）】］｝]', # Short parentheticals
            r'(?<=\w{1,2})\s+(?=\w{1,2})'  # Between very short words
        ]
    },

    # Intonation patterns for natural expression
    'intonation_patterns': {
        'rising_high': [
            r'(?<=か)[？!]',                # Question markers
            r'(?<=の)[？!]',                # Informal questions
            r'[？！]{2,}'                    # Multiple punctuation
        ],
        'rising_medium': [
            r'(?<=か)。',                   # Polite questions
            r'(?<=の)。',                   # Informal questions
            r'(?<=かな)。'                  # Wondering questions
        ],
        'rising_slight': [
            r'(?<=かも)。',                 # Uncertain statements
            r'(?<=よね)。',                 # Seeking agreement
            r'(?<=ね)。'                    # Soft confirmation
        ],
        'falling_high': [
            r'[！]{2,}',                    # Multiple exclamations
            r'\b(?:だめ|違う|止まれ)\b.*[！]', # Strong negatives/commands
            r'\b(?:危ない|逃げろ)\b.*[！]'    # Urgent warnings
        ],
        'falling_medium': [
            r'(?<=です)。',                 # Polite statements
            r'(?<=ます)。',                 # Polite statements
            r'(?<=だ)。'                    # Plain statements
        ],
        'falling_slight': [
            r'(?<=よ)。',                   # Soft emphasis
            r'(?<=わ)。',                   # Feminine ending
            r'(?<=な)。'                    # Masculine ending
        ]
    },

    # Pitch patterns for emotional expression
    'pitch_patterns': {
        'very_high': [
            r'[！]{3,}',                    # Multiple exclamations
            r'\b(?:すごい|やばい|最高)\b.*[！]', # Excited expressions
            r'\b(?:助けて|危ない)\b.*[！]'    # Urgent calls
        ],
        'high': [
            r'\b(?:嬉しい|素晴らしい)\b',    # Positive expressions
            r'(?<=ね)[！]',                 # Excited confirmations
            r'[！]{1,2}'                    # One or two exclamations
        ],
        'slightly_high': [
            r'\b(?:いい|良い|大丈夫)\b',     # Affirmative words
            r'(?<=です)(?=か)',             # Polite questions
            r'(?<=ます)(?=か)'              # Polite questions
        ],
        'slightly_low': [
            r'[\(（【［｛].*?[\)）】］｝]',    # Parentheticals
            r'\b(?:でも|しかし|けれども)\b',  # Contrasting expressions
            r'\b(?:たぶん|多分|おそらく)\b'   # Uncertainty
        ],
        'low': [
            r'\b(?:悲しい|残念|申し訳)\b',    # Negative expressions
            r'(?<=。)(?:えーと|あの)\b',     # Hesitations
            r'\b(?:うーん|んー)\b'           # Thoughtful sounds
        ],
        'very_low': [
            r'\b(?:ひどい|最悪|だめ)\b',     # Very negative expressions
            r'(?<=。)(?:はぁ|ため息)\b',     # Sighs
            r'_[^_]+_'                      # Underscored text
        ]
    },

    # Volume patterns for emphasis
    'volume_patterns': {
        'very_loud': [
            r'[！]{3,}',                    # Multiple exclamations
            r'\b(?:危険|非常|緊急)\b',       # Warning words
            r'\*\*[^*]+\*\*'               # Double-starred text
        ],
        'loud': [
            r'\b(?:重要|警告|注意)\b',       # Attention words
            r'[！]{1,2}',                   # One or two exclamations
            r'\*[^*]+\*'                    # Single-starred text
        ],
        'slightly_loud': [
            r'\b(?:注目|覚えて|気をつけて)\b', # Emphasis words
            r'\b(?:必ず|絶対|確実に)\b',     # Strong modals
            r'`[^`]+`'                      # Backticked text
        ],
        'slightly_soft': [
            r'[\(（【［｛].*?[\)）】］｝]',    # Parentheticals
            r'\b(?:たぶん|もしかして)\b',     # Uncertainty
            r'_[^_]+_'                      # Underscored text
        ],
        'soft': [
            r'\b(?:ささやき|つぶやき)\b',     # Quiet speech
            r'(?<=。)(?:えーと|あの)\b',     # Hesitations
            r'\[[^\]]+\]'                   # Bracketed content
        ],
        'very_soft': [
            r'\b(?:独り言|内緒話)\b',        # Very quiet speech
            r'~[^~]+~',                     # Tilded text
            r'(?<=[\(（]).*?(?=[\)）])'     # Inside parentheses
        ]
    }
}
