const path = require('path');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    background: './background.js',
    content: './content.js',
    textProcessorWorker: './textProcessorWorker.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  optimization: {
    minimize: false
  }
};
