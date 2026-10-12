#!/usr/bin/env node
// Precompile the browser JSX to plain JS so the app no longer runs
// Babel-standalone in the browser on every load (that transpile cost ~2.5-5s
// on a phone). Each src/*.jsx becomes build/<name>.js, transformed with the
// SAME classic-runtime React preset Babel-standalone was using — so the output
// executes identically to before, just without the in-browser compile.
//
//   npm install   (once, to get @babel/core + @babel/preset-react)
//   npm run build (regenerate build/*.js after editing any src/*.jsx)
//
// The build/ output is committed so the deploy stays "serve the repo files".
// IMPORTANT: build/*.js is generated — never edit it by hand; edit src/*.jsx
// and re-run the build.
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'build');

// Load order matters (globals defined in earlier files are used by later ones);
// this mirrors the <script> order in index.html.
const FILES = [
  'tweaks-panel', 'charts', 'components', 'screens-auth', 'screens-member',
  'screens-dashboard', 'screens-ipo', 'screens-pool', 'screens-settle',
  'screens-manage', 'screens-settings', 'app',
];

fs.mkdirSync(OUT, { recursive: true });

let total = 0;
for (const name of FILES) {
  const srcPath = path.join(SRC, name + '.jsx');
  const code = fs.readFileSync(srcPath, 'utf8');
  const out = babel.transformSync(code, {
    filename: srcPath,
    presets: [['@babel/preset-react', { runtime: 'classic' }]],
    compact: false,
    comments: false,
    sourceMaps: false,
  }).code;
  const header = '// GENERATED from src/' + name + '.jsx by build.js — do not edit.\n';
  const dest = path.join(OUT, name + '.js');
  fs.writeFileSync(dest, header + out);
  total += Buffer.byteLength(out);
  console.log('  ' + ('src/' + name + '.jsx').padEnd(28) + ' -> build/' + name + '.js');
}
console.log('Built ' + FILES.length + ' files, ' + (total / 1024).toFixed(0) + 'KB total.');
