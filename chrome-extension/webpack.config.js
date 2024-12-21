const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    background: './src/background.ts',
    content: './src/content.ts',
    textProcessorWorker: './src/textProcessorWorker.ts'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '.'),
    clean: false // Disable cleaning to prevent file deletion
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                module: 'ES2020'
              }
            }
          }
        ],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    modules: ['node_modules']
  },
  optimization: {
    minimize: false // Disable minification for better debugging
  },
  experiments: {
    topLevelAwait: true,
  },
};
