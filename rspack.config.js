const path = require('path');
const rspack = require('@rspack/core');

module.exports = (env, exports) => ({
  context: __dirname,
  mode: !!env.production ? 'production' : 'development',
  devtool: !!env.production ? 'source-map' : false,
  entry: {
    main: './lib/index.ts',
  },
  output: {
    filename: 'health-hid.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'HealthHid',
      type: 'umd',
    },
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './src/index.html',
    }),
  ],
});
