const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
        background: './src/background.js',
        content: './src/content.js',
        textProcessorWorker: './src/textProcessorWorker.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true
    },
    optimization: {
        minimize: false // Avoid eval usage in production mode
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
                                    chrome: '88'
                                },
                                modules: false // Preserve ES modules
                            }]
                        ]
                    }
                }
            }
        ]
    }
};
