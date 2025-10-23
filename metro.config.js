// metro.config.js
// Add support for bundling .lrc lyric files and audio formats as assets
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .lrc and additional audio formats to asset extensions
config.resolver.assetExts.push('lrc', 'flac', 'wav', 'aac');

// Also ensure sourceExts doesn't accidentally include them
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  ext => !['lrc', 'flac', 'wav', 'aac'].includes(ext)
);

module.exports = config;
