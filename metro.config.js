// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add polyfill resolvers
config.resolver.extraNodeModules.crypto = require.resolve('expo-crypto');

config.resolver.unstable_enablePackageExports = false;
config.resolver.assetExts = [...config.resolver.assetExts, 'ogg', 'wav', 'mp3', 'flac', 'glb', 'gltf', 'obj', 'mtl'];

module.exports = config;
