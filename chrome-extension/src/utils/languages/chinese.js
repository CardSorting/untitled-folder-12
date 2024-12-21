// Chinese Language Patterns

export const ChinesePatterns = {
  abbreviations: {
    titles: new Set([
      '先生', '女士', '小姐', '教授', '博士', '主任',
      '经理', '总裁', '董事长', '主席'
    ]),
    honorifics: new Set([
      '老', '小', '大', '师', '总', '长'
    ]),
    organizations: new Set([
      '有限公司', '股份公司', '集团', '企业',
      '研究所', '学院', '大学', '机构'
    ])
  },

  pausePoints: new Map([
    ['。', { weight: 1.0, pause: 800, context: 'end' }],
    ['！', { weight: 1.0, pause: 800, context: 'exclamation' }],
    ['？', { weight: 1.0, pause: 800, context: 'question' }],
    ['，', { weight: 0.4, pause: 400, context: 'minor_break' }],
    ['、', { weight: 0.4, pause: 400, context: 'minor_break' }],
    ['：', { weight: 0.6, pause: 500, context: 'introduction' }],
    ['；', { weight: 0.7, pause: 600, context: 'major_break' }],
    ['……', { weight: 0.5, pause: 450, context: 'ellipsis' }],
    ['—', { weight: 0.5, pause: 450, context: 'dash' }]
  ]),

  semanticMarkers: {
    emphasis: new Set([
      '重要', '警告', '注意', '提醒', '记住',
      '必须', '危险', '紧急', '要点', '关键'
    ]),
    emotion: {
      positive: new Set([
        '优秀', '出色', '完美', '精彩', '卓越',
        '优异', '杰出', '出众', '优良', '完善'
      ]),
      negative: new Set([
        '遗憾', '可惜', '抱歉', '糟糕', '不幸',
        '悲伤', '难过', '失望', '痛心', '惋惜'
      ]),
      emphasis: new Set([
        '绝对', '一定', '确实', '必然', '肯定',
        '无疑', '当然', '显然', '明显', '毫无疑问'
      ]),
      uncertainty: new Set([
        '可能', '或许', '大概', '也许', '估计',
        '兴许', '没准', '不一定', '不确定'
      ])
    },
    transition: new Set([
      '但是', '然而', '不过', '因此', '所以',
      '而且', '并且', '此外', '另外', '况且',
      '反之', '相反', '尽管', '虽然', '即使'
    ])
  },

  patterns: {
    sentence: /[。！？]+/g,
    measure: /[个個條条份]/g,
    delimiter: /[的得地]/g,
    quotation: /"([^"]*)"|\s'([^']*)'/g,
    parenthetical: /（([^）]*)）|\(([^)]*)\)/g,
    emphasis: /[【】《》〈〉「」『』]/g,
    list: /^[\s]*(?:•|[\d１-９]+、|\([\d１-９]+\))/,
    heading: /^(?:［[^］]*］|【[^】]*】|■|□|◆|◇|▲|△|▼|▽)/,
    date: /(?:\d{4}年\d{1,2}月\d{1,2}日)|(?:\d{4}\/\d{1,2}\/\d{1,2})/,
    time: /\d{1,2}[时點]\d{1,2}[分](?:\d{1,2}[秒])?/,
    phone: /(?:\+\d{1,3}[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/,
    money: /￥\d+(?:,\d{3})*(?:\.\d{2})?|¥\d+(?:,\d{3})*(?:\.\d{2})?|[\d.]+元/,
    whitespace: /[\s　]+/
  },

  structure: {
    paragraph: /\n\s*\n/,
    indentation: /^[\s　]+/,
    listItem: /^[\s]*(?:•|\d+、|[①-⑳]|[㋐-㋾])\s*/,
    blockquote: /^[＞>]+\s*/,
    codeBlock: /^(?:    |\t)/,
    horizontalRule: /^(?:―{3,}|＊{3,}|＿{3,})\s*$/
  },

  // Chinese-specific patterns
  simplified: /[\u4E00-\u9FFF]/,
  traditional: /[\u4E00-\u9FFF]/,
  pinyin: /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/,
  numbers: {
    simplified: /[〇一二三四五六七八九十百千万亿]/,
    traditional: /[零壹贰叁肆伍陆柒捌玖拾佰仟萬億]/
  },
  punctuation: {
    fullWidth: /[，。！？；：""''（）【】《》〈〉「」『』]/,
    halfWidth: /[,.!?;:"'()\[\]<>]/
  }
};
