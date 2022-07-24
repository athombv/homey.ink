'use strict';

// Convert .svg to .png@128px
// Requires: macOS & `brew install --cask inkscape`

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const size = 128;
const iconsPath = path.join(__dirname, '..', 'app', 'img', 'devices');
process.chdir(iconsPath);

const icons = fs.readdirSync('.');

for (const icon of icons) {
  if (!icon.endsWith('.svg')) continue;

  const iconId = icon.substring(0, icon.length - '.svg'.length);
  const cmd = `/Applications/Inkscape.app/Contents/MacOS/inkscape --export-type png --export-filename ${iconId}-${size}.png -w ${size} ${iconId}.svg`;
  child_process.execSync(cmd);
  console.log(`✅ ${icon}`);
}