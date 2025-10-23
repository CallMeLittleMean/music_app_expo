// metro.config.js
// Add support for bundling .lrc lyric files as assets so we can load them at runtime
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .lrc to asset extensions
config.resolver.assetExts.push('lrc');

// Also ensure sourceExts doesn't accidentally include it
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'lrc');

module.exports = config;
