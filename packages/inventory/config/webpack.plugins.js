/**
 * Writes final css to file
 */
const ExtractCssWebpackPlugin = new (require("mini-css-extract-plugin"))({
  chunkFilename: "[id].css",
  filename: "[name].css",
});

module.exports = {
  buildPlugins: () => ({
    plugins: [ExtractCssWebpackPlugin],
  }),
};
