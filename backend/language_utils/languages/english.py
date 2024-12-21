"""English language patterns and rules for natural speech synthesis."""

ENGLISH_PATTERNS = {
    # Breathing and pause patterns based on natural speech
    'breathing_patterns': {
        'long_breath': [
            r'\n\n+',                        # Paragraph breaks
            r'(?<=[.!?])\s+(?=[A-Z])',      # Between sentences
            r'[:;]\s+(?=[A-Z])'             # After colons/semicolons starting new thought
        ],
        'medium_breath': [
            r'(?<=[.!?])\s+(?=[a-z])',      # Between dependent clauses
            (r'[,;]\s+(?=(?:but|however|nevertheless|although|though|yet|therefore|thus|hence|consequently|meanwhile|moreover|furthermore))'),  # Before contrasting phrases
            r'--|\u2014'                     # Em dashes
        ],
        'short_breath': [
            r',\s+(?=(?:and|or|nor|for|so))', # Before simple conjunctions
            r'[,\s]+(?=(?:which|who|that|where|when))', # Before relative clauses
            r'\s*[)}\]](?!\s*[.!?])'        # After closing parentheses (unless end of sentence)
        ],
        'micro_breath': [
            r'(?<=\w{6,})\s+(?=\w{6,})',    # Between long words
            r'(?<=\d+)\s+(?=\w)',           # After numbers
            r'\s*[-/]\s*'                    # Around hyphens and slashes
        ]
    },

    # Speech rate variations for natural flow
    'rate_patterns': {
        'very_slow': [
            r'(?<!\.)\.\.\.',               # Ellipsis (not part of domain)
            r'(?<=^|[.!?])\s*["\'].*?["\']',  # Quoted speech at start
            r'\b(?:Ah|Oh|Hmm|Well)\s*[,.]'  # Thoughtful interjections
        ],
        'slow': [
            r'(?<=\w{10,})',                # After very long words
            r'(?<=[:;])\s+\w+',             # After semicolons/colons
            r'\([^)]{15,}\)'                # Long parentheticals
        ],
        'slightly_slow': [
            r'(?<=,)\s+\w+',                # After commas
            r'\b(?:and|or|but)\s+\w+',      # After conjunctions
            r'(?<=\w)\s+(?=\w{8,})'         # Before long words
        ],
        'slightly_fast': [
            r'\([^)]{1,14}\)',              # Short parentheticals
            r'\b(?:of|in|on|at|to|by)\s+',  # Common prepositions
            r'(?<=\b\w{1,4})\s+(?=\w{1,4}\b)' # Between short words
        ],
        'fast': [
            r'\b(?:the|a|an)\s+',           # Articles
            r'(?<=\w{1,3})\s+',             # After very short words
            r'\s*[-/+]\s*'                  # Around operators
        ],
        'very_fast': [
            r'\b(?:um|uh|er|ah)\b',         # Filler words
            r'\([^)]{1,8}\)',               # Very short parentheticals
            r'\s+(?=\w{1,3}\b)'             # Before very short words
        ]
    },

    # Intonation patterns for natural expression
    'intonation_patterns': {
        'rising_high': [
            r'^(?:What|How|Why|When|Where|Who)\b.*\?',  # WH-questions
            (r'^(?:Can|Could|Would|Will|Shall|Should|May|Might|Must)\b.*\?'), # Modal questions
            r'(?<!\.)\?{2,}'                # Multiple question marks
        ],
        'rising_medium': [
            r'^(?:Do|Does|Did|Is|Are|Was|Were|Have|Has|Had)\b.*\?', # Basic questions
            r'(?:[^.!?])\?\s*$',            # Single question mark
            r'(?:right|correct|okay)\?$'     # Confirmation questions
        ],
        'rising_slight': [
            r',\s*(?:or|and)\s+[^.!?]+\?',  # Questions in lists
            r'\([^)]+\?\)',                  # Parenthetical questions
            r'(?:perhaps|maybe)\b[^.!?]+\?'  # Uncertain questions
        ],
        'falling_high': [
            r'!{2,}',                       # Multiple exclamation marks
            r'\b(?:Never|Always|Must)\b.*!', # Strong commands
            r'(?:Stop|Wait|Listen|Look)\b.*!' # Urgent commands
        ],
        'falling_medium': [
            r'[A-Z][^.!?]+[.!]',            # Standard statements
            r'\b(?:Please|Thank you|Sorry)\b.*[.!]', # Polite expressions
            r'(?:Yes|No|OK|Fine)\b.*[.!]'    # Short responses
        ],
        'falling_slight': [
            r',\s*(?:etc|and so on)\.',     # List endings
            r'\([^)]+[.!]\)',               # Parenthetical statements
            r'(?:I think|I guess)\b.*\.'    # Uncertain statements
        ]
    },

    # Pitch patterns for emotional expression
    'pitch_patterns': {
        'very_high': [
            r'(?<!\.)\!{3,}',               # Multiple exclamations
            r'\b(?:Wow|Amazing|Incredible)\b.*!', # Excited expressions
            r'(?:Help|Fire|Stop)\b.*!'      # Urgent calls
        ],
        'high': [
            r'\b(?:Great|Wonderful|Fantastic)\b', # Positive expressions
            r'(?:Look|Listen|Watch)\b.*!',   # Attention-getting
            r'(?<!\.)\!{1,2}'               # One or two exclamations
        ],
        'slightly_high': [
            r'\b(?:Good|Nice|Sure|Right)\b', # Affirmative words
            r'(?:Please|Thank you)\b',       # Polite expressions
            r'\?(?!["\']\])'               # Questions (not in quotes/brackets)
        ],
        'slightly_low': [
            r'\([^)]+\)',                    # Parentheticals
            r'\b(?:However|Although|Though)\b', # Contrasting expressions
            r'(?:maybe|perhaps|probably)\b'  # Uncertainty
        ],
        'low': [
            r'\b(?:Sad|Sorry|Unfortunately)\b', # Negative expressions
            r'(?:^|\. )(?:Um|Uh|Er)\b',     # Hesitations
            r'\[[^\]]+\]'                   # Bracketed content
        ],
        'very_low': [
            r'\b(?:Terrible|Awful|Horrible)\b', # Very negative expressions
            r'(?:^|\. )(?:Sigh|Ahem)\b',    # Thoughtful sounds
            r'_[^_]+_'                      # Underscored text
        ]
    },

    # Volume patterns for emphasis
    'volume_patterns': {
        'very_loud': [
            r'(?<!\.)\!{3,}',               # Multiple exclamations
            r'\b(?:STOP|HELP|WAIT)\b',      # Uppercase urgent words
            r'\*\*[^*]+\*\*'                # Double-starred text
        ],
        'loud': [
            r'\b(?:Important|Warning|Caution)\b', # Attention words
            r'(?<!\.)\!{1,2}',              # One or two exclamations
            r'\*[^*]+\*'                    # Single-starred text
        ],
        'slightly_loud': [
            r'\b(?:Note|Remember|Notice)\b', # Emphasis words
            r'(?:must|should|need to)\b',    # Strong modals
            r'`[^`]+`'                      # Backticked text
        ],
        'slightly_soft': [
            r'\([^)]+\)',                    # Parentheticals
            r'(?:perhaps|maybe|possibly)\b', # Uncertainty
            r'_[^_]+_'                      # Underscored text
        ],
        'soft': [
            r'\b(?:whisper|murmur)\b:?\s*[^.!?]+', # Quiet speech
            r'(?:^|\. )(?:Um|Uh|Er)\b',     # Hesitations
            r'\[[^\]]+\]'                   # Bracketed content
        ],
        'very_soft': [
            r'\b(?:aside|under breath)\b:?\s*[^.!?]+', # Very quiet speech
            r'~[^~]+~',                     # Tilded text
            r'(?<=\() *[^)]+(?=\))'         # Inside parentheses
        ]
    }
}
