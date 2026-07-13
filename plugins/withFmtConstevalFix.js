const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '# fmt-consteval-fix';
const PATCH = `    ${MARKER}: Apple Clang 21 (Xcode 26.x) enforces stricter consteval
    # rules that break fmt 11.0.2's FMT_STRING compile-time checks when React
    # Native builds from source (which op-sqlite requires — see
    # plugins/withRNFromSource.js). fmt's own header guard unconditionally
    # redefines FMT_USE_CONSTEVAL, so a preprocessor define cannot override it;
    # compiling the fmt pod as C++17 disables consteval via fmt's version
    # check instead. Remove after RN >= 0.83.9 / fmt 12 (upstream fix).
    installer.pods_project.targets.each do |target|
      next unless target.name == 'fmt'
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      end
    end
`;

module.exports = function withFmtConstevalFix(config) {
  return withDangerousMod(config, [
    'ios',
    (c) => {
      const podfilePath = path.join(c.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');
      if (!podfile.includes(MARKER)) {
        // Must run AFTER react_native_post_install, which resets
        // CLANG_CXX_LANGUAGE_STANDARD to c++20 on every pod target.
        const anchor = /(react_native_post_install\([\s\S]*?\n    \)\n)/;
        if (!anchor.test(podfile)) {
          throw new Error('withFmtConstevalFix: react_native_post_install call not found');
        }
        podfile = podfile.replace(anchor, `$1${PATCH}`);
        fs.writeFileSync(podfilePath, podfile);
      }
      return c;
    },
  ]);
};
