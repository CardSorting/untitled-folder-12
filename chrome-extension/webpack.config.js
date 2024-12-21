const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        background: './src/background.js',
        content: './src/content.js',
        textProcessorWorker: './src/textProcessorWorker.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    experiments: {
        topLevelAwait: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                targets: {
                                    chrome: '88' // Minimum Chrome version that supports Manifest V3
                                }
                            }]
                        ]
                    }
                }
            }
        ]
    }
};
