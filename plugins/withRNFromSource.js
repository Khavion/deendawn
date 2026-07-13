const { withPodfileProperties } = require('expo/config-plugins');

/**
 * op-sqlite (E9) links against React internals that SDK 54's precompiled
 * React-Core XCFramework does not export (undefined facebook::react::Sealable
 * at link time). Building RN from source restores those symbols. The Podfile
 * reads this key from Podfile.properties.json, which prebuild regenerates —
 * hence a plugin, not a hand edit.
 */
module.exports = function withRNFromSource(config) {
  return withPodfileProperties(config, (c) => {
    c.modResults['ios.buildReactNativeFromSource'] = 'true';
    return c;
  });
};
