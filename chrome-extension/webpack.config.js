const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    content: './src/content.ts',
    background: './src/background.ts',
    textProcessorWorker: './src/textProcessorWorker.ts'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-typescript']
            }
          },
          'ts-loader'
        ],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
};
