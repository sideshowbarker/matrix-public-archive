'use strict';

// This is just a callable from the commandline version of `build-client.js`. So
// that we can run the build from an npm script.

const buildClient = require('./build-client');

buildClient();
