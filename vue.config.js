module.exports = {
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
