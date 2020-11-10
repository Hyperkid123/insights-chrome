const webpack = require('webpack');
const resolve = require('path').resolve;
const WriteFileWebpackPlugin = require('write-file-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

const plugins = [
  new ModuleFederationPlugin({
    name: 'insightsChrome',
    library: { type: 'var', name: 'insightsChrome' },
    filename: 'chrome-remote.js',
    exposes: {
      './RemoteButton': resolve(__dirname, '../src/js/remotes/remote-button.js'),
      './InventoryTable': resolve(__dirname, '../src/js/remotes/inventory-table.js'),
      './reduxReducers': resolve(__dirname, '../src/js/remotes/redux-reducers.js'),
      './InventoryDetailWrapper': resolve(__dirname, '../src/js/remotes/inventory-detail-wrapper.js'),
      './InventoryDetail': resolve(__dirname, '../src/js/remotes/inventory-detail.js'),
      './InventoryAppInfo': resolve(__dirname, '../src/js/remotes/inventory-app-info.js'),
    },
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
