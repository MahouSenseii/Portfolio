const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  performance: {
    assetFilter: filename => !filename.endsWith('.mp3'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      inject: false,
    }),
    new CopyPlugin({
      patterns: [
        { from: 'img', to: 'img' },
        { from: 'css', to: 'css' },
        { from: 'data', to: 'data' },
        { from: 'documents', to: 'documents' },
        { from: 'fonts', to: 'fonts' },
        { from: 'music', to: 'music' },
        { from: 'pages', to: 'pages' },
        { from: 'nav.html', to: 'nav.html' },
        { from: 'footer.html', to: 'footer.html' },
        { from: 'icon.svg', to: 'icon.svg' },
        { from: 'favicon.ico', to: 'favicon.ico' },
        { from: 'robots.txt', to: 'robots.txt' },
        { from: 'icon.png', to: 'icon.png' },
        { from: '404.html', to: '404.html' },
        { from: 'manifest.json', to: 'manifest.json' },
      ],
    }),
  ],
});
