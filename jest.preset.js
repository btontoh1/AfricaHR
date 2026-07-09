const path = require('node:path');
const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  setupFiles: [
    ...(nxPreset.setupFiles ?? []),
    path.join(__dirname, 'tools/test/jest.env-setup.ts'),
  ],
};