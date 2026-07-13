// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle the read-only Quran database as an app asset.
config.resolver.assetExts.push('db');

module.exports = config;
