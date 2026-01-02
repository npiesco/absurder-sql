const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

// Path to the linked absurder-sql-mobile package
const absurderSqlMobilePath = path.resolve(__dirname, '../../absurder-sql-mobile');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  server: {
    port: 8088,
  },
  watchFolders: [absurderSqlMobilePath],
  resolver: {
    // Block absurder-sql-mobile's node_modules to prevent version conflicts
    blockList: exclusionList([
      new RegExp(`${absurderSqlMobilePath}/node_modules/react-native/.*`),
      new RegExp(`${absurderSqlMobilePath}/node_modules/react/.*`),
      new RegExp(`${absurderSqlMobilePath}/react-native/.*`),
    ]),
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
    ],
    // Ensure Metro can resolve the linked package
    extraNodeModules: {
      'absurder-sql-mobile': absurderSqlMobilePath,
      // Ensure react/react-native come from vault/mobile's node_modules
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
