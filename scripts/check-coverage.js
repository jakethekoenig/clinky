import fs from 'fs';
import path from 'path';

const MIN_COVERAGE = 47.77;

const lcovPath = path.join('coverage', 'lcov.info');
if (!fs.existsSync(lcovPath)) {
  console.error('Could not find lcov.info file.');
  process.exit(1);
}

const lcovContent = fs.readFileSync(lcovPath, 'utf8');
let linesFound = 0;
let linesHit = 0;

lcovContent.split('\n').forEach(line => {
  if (line.startsWith('LF:')) {
    linesFound += parseInt(line.split(':')[1]);
  }
  if (line.startsWith('LH:')) {
    linesHit += parseInt(line.split(':')[1]);
  }
});

if (linesFound === 0) {
  console.error('No lines found in coverage report.');
  process.exit(1);
}

const coverage = (linesHit / linesFound) * 100;

console.log(`Current coverage is ${coverage.toFixed(2)}%`);

if (coverage < MIN_COVERAGE) {
  console.error(`Coverage is below threshold of ${MIN_COVERAGE}%`);
  process.exit(1);
}

console.log('Coverage is above threshold.');
process.exit(0);
