const path = require('path');
const rspack = require('@rspack/core');

module.exports = {
  context: __dirname,
  mode: 'development',
  devtool: false,
  entry: {
    main: './lib/index.ts',
  },
  output: {
    filename: 'web-hid.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'WebHid',
      type: 'umd',
    },
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './src/index.html',
    }),
  ],
};
