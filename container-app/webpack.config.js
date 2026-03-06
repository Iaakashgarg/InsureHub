const {
  shareAll,
  withModuleFederationPlugin,
} = require('@angular-architects/module-federation/webpack');
const webpack = require('webpack');
const path = require('path');

// Use environment variables for production remote URLs, fallback to localhost for dev
const POLICY_DASHBOARD_URL = process.env.MFE_POLICY_DASHBOARD_URL || 'http://localhost:4201';
const PREMIUM_PAYMENT_URL = process.env.MFE_PREMIUM_PAYMENT_URL || 'http://localhost:4202';

console.log('[MF Remotes] MFE_POLICY_DASHBOARD_URL =', POLICY_DASHBOARD_URL);
console.log('[MF Remotes] MFE_PREMIUM_PAYMENT_URL  =', PREMIUM_PAYMENT_URL);

const mfConfig = withModuleFederationPlugin({
  remotes: {
    mfePolicyDashboard: `mfePolicyDashboard@${POLICY_DASHBOARD_URL}/remoteEntry.js`,
    mfePremiumPayment: `mfePremiumPayment@${PREMIUM_PAYMENT_URL}/remoteEntry.js`,
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});

// Inject env vars into Angular code at build time via DefinePlugin
mfConfig.plugins = mfConfig.plugins || [];
mfConfig.plugins.push(
  new webpack.DefinePlugin({
    'process.env.MFE_POLICY_DASHBOARD_URL': JSON.stringify(POLICY_DASHBOARD_URL),
    'process.env.MFE_PREMIUM_PAYMENT_URL': JSON.stringify(PREMIUM_PAYMENT_URL),
  }),
);

// Ensure shared-lib imports resolve from this app's node_modules
mfConfig.resolve = mfConfig.resolve || {};
mfConfig.resolve.modules = [path.resolve(__dirname, 'node_modules'), 'node_modules'];

module.exports = mfConfig;
