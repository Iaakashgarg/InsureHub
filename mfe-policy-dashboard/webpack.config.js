const {
  shareAll,
  withModuleFederationPlugin,
} = require('@angular-architects/module-federation/webpack');
const path = require('path');

const mfConfig = withModuleFederationPlugin({
  name: 'mfePolicyDashboard',

  exposes: {
    './routes': './src/app/policy/policy.routes.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});

mfConfig.resolve = mfConfig.resolve || {};
mfConfig.resolve.modules = [path.resolve(__dirname, 'node_modules'), 'node_modules'];

module.exports = mfConfig;
