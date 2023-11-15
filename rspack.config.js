const path = require('path');
const rspack = require('@rspack/core');
const NpmDtsPlugin = require('npm-dts-webpack-plugin')

const prodPlugins = [
  new NpmDtsPlugin({
    output: 'dist/health-hid.d.ts',
  }),
];

const devPlugins = [
  new rspack.HtmlRspackPlugin({
    // Only include demo dashboard in dev mode
    template: './src/index.html',
  }),
];

module.exports = (env, exports) => {
  const production = env.production;
  return {
    context: __dirname,
    mode: production ? 'production' : 'development',
    devtool: production ? 'source-map' : false,
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
      ...(production ? prodPlugins : devPlugins),
    ],
  };
};
