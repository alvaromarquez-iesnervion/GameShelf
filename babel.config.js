// DO NOT add @babel/plugin-transform-class-properties — it crashes Hermes with read-only enums.
// See AGENTS.md § Critical Rules for details.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'babel-plugin-transform-typescript-metadata',
      ['@babel/plugin-proposal-decorators', { 'legacy': true }],
    ],
  };
};
