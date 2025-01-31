const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: {
      'catapush-react-native': path.resolve(__dirname, '../sdk/lib')
    }
  }
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
