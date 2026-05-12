const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  configureWebpack: {
    plugins: [
      new NodePolyfillPlugin(),
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
  },
  chainWebpack: (config) => {
    config.optimization.minimizer('terser').tap((args) => {
      // eslint-disable-next-line no-param-reassign
      args[0].terserOptions.mangle.reserved = [
        'Buffer',
        'BigInteger',
        'Point',
        'ECPubKey',
        'ECKey',
        'sha512_asm',
        'asm',
        'ECPair',
        'HDNode',
        'BigNumber',
      ];
      return args;
    });
  },
};
