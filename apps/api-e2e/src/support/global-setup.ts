import * as fs from 'node:fs';
import * as path from 'node:path';
import { waitForPortOpen } from '@nx/node/utils';
import axios from 'axios';
import { apiBaseUrl } from './base-url';
import { bootstrapFixtures, fixturesPath } from './fixtures';

/* eslint-disable */
var __TEARDOWN_MESSAGE__: string;

module.exports = async function() {
  console.log('\nSetting up...\n');

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await waitForPortOpen(port, { host });

  // Bootstrap the one shared fixture tenant + role users every spec file
  // reads via readFixtures(), rather than each file creating its own (which
  // would multiply login calls against the 5/min throttle for no benefit).
  axios.defaults.baseURL = apiBaseUrl();
  const fixtures = await bootstrapFixtures();
  fs.mkdirSync(path.dirname(fixturesPath()), { recursive: true });
  fs.writeFileSync(fixturesPath(), JSON.stringify(fixtures, null, 2));

  // Hint: Use `globalThis` to pass variables to global teardown.
  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};

