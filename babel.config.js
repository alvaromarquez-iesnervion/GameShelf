module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'babel-plugin-transform-typescript-metadata',
      ['@babel/plugin-proposal-decorators', { 'legacy': true }],
<<<<<<< HEAD
=======
     
>>>>>>> d31ce646312d38eef3c9c27fdb08e33ad660dfbd
    ],
  };
};
