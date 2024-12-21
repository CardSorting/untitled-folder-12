// English Language Patterns

export const EnglishPatterns = {
  abbreviations: {
    titles: new Set([
      'mr', 'mrs', 'ms', 'dr', 'prof', 'rev', 'sr', 'jr', 'esq',
      'hon', 'gov', 'pres', 'supt', 'rep', 'sen', 'amb'
    ]),
    academic: new Set([
      'ph.d', 'm.d', 'b.a', 'm.a', 'm.sc', 'b.sc', 'd.phil',
      'b.tech', 'm.tech', 'm.phil', 'b.ed', 'm.ed', 'j.d'
    ]),
    business: new Set([
      'inc', 'ltd', 'corp', 'co', 'llc', 'llp', 'gmbh', 'sa',
      'ag', 'plc', 'intl', 'assn', 'bros', 'mfg', 'dept'
    ]),
    temporal: new Set([
      'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep',
      'oct', 'nov', 'dec', 'mon', 'tue', 'wed', 'thu', 'fri',
      'sat', 'sun', 'a.m', 'p.m', 'b.c', 'a.d', 'cent'
    ]),
    geographic: new Set([
      'st', 'ave', 'blvd', 'rd', 'hwy', 'apt', 'ste', 'ft',
      'mt', 'pt', 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
    ]),
    units: new Set([
      'kg', 'km', 'cm', 'mm', 'mg', 'hz', 'kb', 'mb', 'gb',
      'tb', 'hr', 'min', 'sec', 'ft', 'in', 'yd', 'ml', 'oz'
    ])
  },

  pausePoints: new Map([
    ['.', { weight: 1.0, pause: 800, context: 'end' }],
    ['!', { weight: 1.0, pause: 800, context: 'exclamation' }],
    ['?', { weight: 1.0, pause: 800, context: 'question' }],
    [';', { weight: 0.7, pause: 600, context: 'major_break' }],
    [':', { weight: 0.6, pause: 500, context: 'introduction' }],
    [',', { weight: 0.4, pause: 400, context: 'minor_break' }],
    ['—', { weight: 0.5, pause: 450, context: 'em_dash' }],
    ['–', { weight: 0.4, pause: 400, context: 'en_dash' }],
    ['-', { weight: 0.3, pause: 300, context: 'hyphen' }]
  ]),

  semanticMarkers: {
    emphasis: new Set([
      'important', 'warning', 'note', 'caution', 'remember',
      'key', 'critical', 'essential', 'crucial', 'vital',
      'notice', 'attention', 'alert', 'danger', 'tip'
    ]),
    emotion: {
      positive: new Set([
        'hooray', 'great', 'excellent', 'wonderful', 'fantastic',
        'amazing', 'brilliant', 'outstanding', 'superb', 'perfect'
      ]),
      negative: new Set([
        'unfortunately', 'sadly', 'regrettably', 'alas',
        'disappointingly', 'tragically', 'woefully'
      ]),
      emphasis: new Set([
        'absolutely', 'definitely', 'certainly', 'surely',
        'undoubtedly', 'unquestionably', 'indisputably'
      ]),
      uncertainty: new Set([
        'perhaps', 'maybe', 'possibly', 'presumably',
        'apparently', 'seemingly', 'probably', 'likely'
      ])
    },
    transition: new Set([
      'however', 'therefore', 'furthermore', 'moreover',
      'meanwhile', 'consequently', 'nevertheless', 'otherwise',
      'additionally', 'similarly', 'conversely', 'specifically'
    ])
  },

  patterns: {
    sentence: /[.!?]+[\s\n]+(?=[A-Z])/g,
    clause: /,\s*(?:and|or|but|because|while|although|though|unless|if|when|where|which|who|that|despite|whereas)/gi,
    quotation: /"([^"]*)"|\s'([^']*)'/g,
    parenthetical: /\(([^)]+)\)|\[([^\]]+)\]|{([^}]+)}/g,
    emphasis: /\*\*(.+?)\*\*|__(.+?)__|_(.+?)_|\*(.+?)\*/g,
    list: /^[\s]*(?:[•\-*]|\d+\.|[a-zA-Z]\.)(?:\s+)/,
    heading: /^(?:#{1,6}|\=+|\-+)\s+.*$|^[A-Z][A-Z\s]+[A-Z]$/,
    url: /https?:\/\/\S+|www\.\S+/,
    email: /[\w.-]+@[\w.-]+\.\w+/,
    number: /\d+(?:st|nd|rd|th)?(?:,\d{3})*(?:\.\d+)?/,
    time: /\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?/,
    date: /(?:\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i,
    phone: /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    money: /\$\d+(?:,\d{3})*(?:\.\d{2})?/,
    whitespace: /\s+/
  },

  structure: {
    paragraph: /\n\s*\n/,
    indentation: /^[ \t]+/,
    listItem: /^[\s]*(?:[•\-*]|\d+\.|[a-zA-Z]\.)\s+/,
    blockquote: /^>+\s/,
    codeBlock: /^(?:    |\t)/,
    horizontalRule: /^(?:-{3,}|\*{3,}|_{3,})\s*$/
  }
};
