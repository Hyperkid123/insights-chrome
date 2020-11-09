const webpack = require('webpack');
const WriteFileWebpackPlugin = require('write-file-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

const plugins = [
  new ModuleFederationPlugin({
    name: 'insights-chrome',
    library: { type: 'var', name: 'insights-chrome' },
    filename: 'chrome-remote.js',
    shared: { react: { singleton: true, eager: true }, 'react-dom': { singleton: true, eager: true } },
  }),
  new CleanWebpackPlugin(),
  new WriteFileWebpackPlugin(),
  new webpack.SourceMapDevToolPlugin({
    test: /\.js/i,
    exclude: /node_modules/i,
    filename: `sourcemaps/[name].js.map`,
  }),
];

module.exports = plugins;
