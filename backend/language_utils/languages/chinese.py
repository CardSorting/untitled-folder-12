"""Chinese Language Patterns"""

CHINESE_PATTERNS = {
    'pause_points': {
        'major': {'。', '！', '？', '…'},
        'minor': {'、', '，'},
        'natural': {'「', '」', '『', '』', '（', '）', '［', '］', '｛', '｝'},
        'phrase': {'和', '与', '及', '或', '而', '且', '但是', '不过'}
    },
    'sentence_boundaries': {
        'terminals': {'。', '！', '？', '…'},
        'openers': {'「', '『'},
        'closers': {'」', '』'}
    },
    'honorifics': {
        'general': {'先生', '女士', '小姐', '太太', '老师', '教授'},
        'family': {'老', '小', '大'},
        'professional': {'医生', '教授', '主任', '经理', '总裁'}
    },
    'measure_words': {
        'general': {'个', '只', '条', '张', '片', '块', '本', '台', '把', '件'},
        'time': {'年', '月', '日', '天', '小时', '分钟', '秒'},
        'quantity': {'些', '点', '多', '份'}
    }
}
