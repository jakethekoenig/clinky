import fs from 'fs';
import path from 'path';

const MIN_COVERAGE = 47.77;

const summaryPath = path.join('coverage', 'coverage-summary.json');
if (!fs.existsSync(summaryPath)) {
  console.error('Could not find coverage summary file.');
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const coverage = summary.total.lines.pct;

console.log(`Current coverage is ${coverage}%`);

if (coverage < MIN_COVERAGE) {
  console.error(`Coverage is below threshold of ${MIN_COVERAGE}%`);
  process.exit(1);
}

console.log('Coverage is above threshold.');
process.exit(0);
