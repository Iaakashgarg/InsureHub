const {
  shareAll,
  withModuleFederationPlugin,
} = require('@angular-architects/module-federation/webpack');
const path = require('path');

const mfConfig = withModuleFederationPlugin({
  name: 'mfePremiumPayment',

  exposes: {
    './routes': './src/app/payment/payment.routes.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});

mfConfig.resolve = mfConfig.resolve || {};
mfConfig.resolve.modules = [path.resolve(__dirname, 'node_modules'), 'node_modules'];

module.exports = mfConfig;
