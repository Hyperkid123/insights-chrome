const TerserJSPlugin = require("terser-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const { resolve } = require("path");
const { externals } = require("./webpack.constants.js");
const { buildPlugins } = require("./webpack.plugins.js");

module.exports = (env) => ({
  devtool: "source-map",
  optimization: {
    minimize: process.env.NODE_ENV === "production",
    minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})],
  },
  entry: {
    index: "./src/index.js",
    actions: "./src/redux/actions.js",
  },
  output: {
    filename: "[name].js",
    path: resolve(__dirname, "../"),
    library: "CloudServicesComponents[name]",
    libraryTarget: "umd",
    umdNamedDefine: true,
  },
  module: {
    rules: [
      {
        test: /src\/.*\.js$/,
        exclude: /node_modules/i,
        use: [
          {
            loader: "babel-loader",
          },
        ],
      },
      {
        test: /\.s?[ac]ss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.(woff(2)?|ttf|jpg|png|eot|gif|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
            },
          },
        ],
      },
    ],
  },
  externals,
  ...buildPlugins(env),
});
