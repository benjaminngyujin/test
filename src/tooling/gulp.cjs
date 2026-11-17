'use strict';
const build = require('@microsoft/sp-build-web');
build.task('sass', build.sass);
const getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  const result = getTasks.call(build.rig);
  result.set('serve', result.get('serve-deprecated'));
  return result;
};
// Radix ESM imports React 17's extensionless JSX runtime.
build.configureWebpack.mergeConfig({
  additionalConfiguration: configuration => {
    configuration.resolve = configuration.resolve || {};
    configuration.resolve.alias = {
      ...configuration.resolve.alias,
      'react/jsx-runtime$': require.resolve('react/jsx-runtime')
    };
    return configuration;
  }
});
build.initialize(require('gulp'));
