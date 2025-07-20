const fs = require('fs');
const path = require('path');

const entry = path.join(__dirname, 'src/app.js');
let output = '// Bundled from src/app.js using Rollup\n';
const lines = fs.readFileSync(entry, 'utf8').split(/\r?\n/);
for (const line of lines) {
  const m = line.match(/import ['\"](.+)['\"];?/);
  if (m) {
    const file = path.join(__dirname, 'src', m[1]);
    output += fs.readFileSync(file, 'utf8') + '\n';
  } else {
    output += line + '\n';
  }
}
fs.writeFileSync(path.join(__dirname, 'js/app.js'), output);
console.log('Bundled to js/app.js');

