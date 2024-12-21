const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    background: './src/background.js',
    content: './src/content.js',
    textProcessorWorker: './src/textProcessorWorker.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    extensions: ['.js'],
    modules: [path.resolve(__dirname, 'src'), 'node_modules']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
