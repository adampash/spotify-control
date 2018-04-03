#!/usr/bin/env node

const arg = process.argv[2];
const lib = require('../lib/index.js');

if (!arg) {
  console.log(`
You must include an argument to spotify-control. The CLI accepts the following arguments:

  ${Reflect.ownKeys(lib).join(`
  `)}

  `);
  return;
}

lib[arg]();
