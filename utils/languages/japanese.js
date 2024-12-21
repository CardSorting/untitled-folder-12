// Japanese Language Patterns

export const JapanesePatterns = {
  abbreviations: {
    titles: new Set([
      'さん', '様', '氏', '君', '先生', '教授', '博士',
      '社長', '部長', '課長', '係長', '主任'
    ]),
    honorifics: new Set([
      'お', 'ご', '殿', '様', '先生', '閣下'
    ]),
    organizations: new Set([
      '株式会社', '有限会社', '合同会社', '財団法人',
      '社団法人', '学校法人', '独立行政法人'
    ])
  },

  pausePoints: new Map([
    ['。', { weight: 1.0, pause: 800, context: 'end' }],
    ['．', { weight: 1.0, pause: 800, context: 'end' }],
    ['！', { weight: 1.0, pause: 800, context: 'exclamation' }],
    ['？', { weight: 1.0, pause: 800, context: 'question' }],
    ['、', { weight: 0.4, pause: 400, context: 'minor_break' }],
    ['，', { weight: 0.4, pause: 400, context: 'minor_break' }],
    ['：', { weight: 0.6, pause: 500, context: 'introduction' }],
    ['；', { weight: 0.7, pause: 600, context: 'major_break' }],
    ['…', { weight: 0.5, pause: 450, context: 'ellipsis' }],
    ['―', { weight: 0.5, pause: 450, context: 'dash' }]
  ]),

  semanticMarkers: {
    emphasis: new Set([
      '重要', '警告', '注意', '注目', '確認',
      '必須', '危険', '緊急', 'ポイント', '要点'
    ]),
    emotion: {
      positive: new Set([
        '素晴らしい', '最高', '優れた', '良い', '嬉しい',
        '楽しい', '幸せ', '面白い', '快適', '満足'
      ]),
      negative: new Set([
        '残念', '悲しい', '申し訳ない', '困った', '悪い',
        '不快', '不満', '心配', '怖い', '嫌'
      ]),
      emphasis: new Set([
        '絶対に', '必ず', '確かに', '間違いなく',
        '当然', '明らかに', '確実に', '本当に'
      ]),
      uncertainty: new Set([
        'たぶん', 'おそらく', 'かもしれない', '多分',
        '説かもしれません', '可能性があります'
      ])
    },
    transition: new Set([
      'しかし', 'ところが', 'それでも', 'そのため',
      'したがって', 'また', 'さらに', 'なお',
      'ただし', 'むしろ', 'あるいは', 'すなわち'
    ])
  },

  patterns: {
    sentence: /[。．！？]+/g,
    particle: /[はがのにへとでもや]/g,
    honorific: /(?:さん|君|様|先生|氏)$/,
    quotation: /「([^」]*)」|『([^』]*)』/g,
    parenthetical: /（([^）]*)）|\(([^)]*)\)/g,
    emphasis: /[【】《》〈〉「」『』]/g,
    list: /^[\s]*(?:・|[\d１-９]+、|\([\d１-９]+\))/,
    heading: /^(?:［[^］]*］|【[^】]*】|■|□|◆|◇|▲|△|▼|▽)/,
    date: /(?:\d{4}年\d{1,2}月\d{1,2}日)|(?:令和\d{1,2}年)|(?:平成\d{1,2}年)/,
    time: /\d{1,2}時\d{1,2}分(?:\d{1,2}秒)?/,
    phone: /(?:\+\d{1,3}[-.\\s]?)?\d{2,4}[-.\\s]?\d{2,4}[-.\\s]?\d{4}/,
    money: /¥\d+(?:,\d{3})*(?:\.\d{2})?/,
    whitespace: /[\s　]+/
  },

  structure: {
    paragraph: /\n\s*\n/,
    indentation: /^[\s　]+/,
    listItem: /^[\s]*(?:・|\d+、|[①-⑳]|[㋐-㋾])\s*/,
    blockquote: /^[＞>]+\s*/,
    codeBlock: /^(?:    |\t)/,
    horizontalRule: /^(?:―{3,}|＊{3,}|＿{3,})\s*$/
  },

  // Japanese-specific patterns
  kanji: /[\u4E00-\u9FFF]/,
  hiragana: /[\u3040-\u309F]/,
  katakana: /[\u30A0-\u30FF]/,
  furigana: /[\u3040-\u309F]|\[\u4E00-\u9FFF\][\u3040-\u309F]+/g,
  ruby: /<ruby>[\u4E00-\u9FFF]+<rt>[\u3040-\u309F]+<\/rt><\/ruby>/g
};
