#!/usr/bin/env node
const build = require('gluegun').build;

/**
 * Create the cli and kick it off
 */
async function run(argv) {
  // create a CLI runtime
  const cli = build()
    .brand('detox')
    .src(__dirname)
    .help() // provides default for help, h, --help, -h
    .version() // provides default for version, v, --version, -v
    .create();

  // and run it
  const context = await cli.run(argv);

  // send it back (for testing, mostly)
  return context;
}

module.exports = { run };