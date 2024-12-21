"""English Language Patterns"""

ENGLISH_PATTERNS = {
    'abbreviations': {
        'titles': {
            'mr', 'mrs', 'ms', 'dr', 'prof', 'rev', 'sr', 'jr', 'esq',
            'hon', 'gov', 'pres', 'supt', 'rep', 'sen', 'amb'
        },
        'academic': {
            'ph.d', 'm.d', 'b.a', 'm.a', 'm.sc', 'b.sc', 'd.phil',
            'b.tech', 'm.tech', 'm.phil', 'b.ed', 'm.ed', 'j.d'
        },
        'business': {
            'inc', 'ltd', 'corp', 'co', 'llc', 'llp', 'gmbh', 'sa',
            'ag', 'plc', 'intl', 'assn', 'bros', 'mfg', 'dept'
        },
        'temporal': {
            'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep',
            'oct', 'nov', 'dec', 'mon', 'tue', 'wed', 'thu', 'fri',
            'sat', 'sun', 'a.m', 'p.m', 'b.c', 'a.d', 'cent'
        },
        'geographic': {
            'st', 'ave', 'blvd', 'rd', 'hwy', 'apt', 'ste', 'ft',
            'mt', 'pt', 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
        },
        'units': {
            'kg', 'km', 'cm', 'mm', 'mg', 'hz', 'kb', 'mb', 'gb',
            'tb', 'hr', 'min', 'sec', 'ft', 'in', 'yd', 'ml', 'oz'
        }
    },
    'pause_points': {
        'major': {'.', '!', '?', '...'},
        'minor': {',', ';', ':'},
        'natural': {'-', '–', '—', '(', ')', '[', ']', '{', '}'},
        'phrase': {'and', 'or', 'but', 'nor', 'for', 'yet', 'so'}
    },
    'sentence_boundaries': {
        'terminals': {'.', '!', '?', '...'},
        'openers': {'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
                   'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                   '"', '"', ''', '¿', '¡'},
        'closers': {'.', '!', '?', '"', '"', ''', '…'}
    }
}
