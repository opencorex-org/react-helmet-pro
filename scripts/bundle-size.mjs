import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const BUDGETS = {
  'dist/index.js': { raw: 10 * 1024, gzip: 4 * 1024 },
  'dist/react-router/index.js': { raw: 5 * 1024, gzip: 2 * 1024 },
  'dist/remix/index.js': { raw: 5 * 1024, gzip: 2 * 1024 },
  'dist/astro/index.js': { raw: 5 * 1024, gzip: 2 * 1024 },
  'dist/vite-ssr/index.js': { raw: 5 * 1024, gzip: 2 * 1024 },
  'dist/server/index.js': { raw: 5 * 1024, gzip: 2 * 1024 },
  'dist/adapters/index.js': { raw: 5 * 1024, gzip: 2 * 1024 },
  'dist/cli/index.js': { raw: 15 * 1024, gzip: 5 * 1024 },
  'dist/eslint/index.js': { raw: 15 * 1024, gzip: 5 * 1024 },
  'dist/inspector/index.js': { raw: 25 * 1024, gzip: 8 * 1024 },
  'dist/testing/index.js': { raw: 10 * 1024, gzip: 4 * 1024 },
  'dist/testing/vitest.js': { raw: 5 * 1024, gzip: 2 * 1024 },
};

let failed = false;
console.log('------------------------------------------------------------');
console.log('Checking Bundle Budgets:');
console.log('------------------------------------------------------------');
console.log(
  `${'File'.padEnd(30)} | ${'Size'.padStart(8)} | ${'Gzip'.padStart(8)} | ${'Budget (Gzip)'.padStart(13)}`
);
console.log('------------------------------------------------------------');

for (const [file, budget] of Object.entries(BUDGETS)) {
  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: file not found: ${file}`);
    continue;
  }

  const content = fs.readFileSync(filePath);
  const rawSize = content.length;
  const gzipSize = zlib.gzipSync(content).length;

  const rawSizeStr = `${(rawSize / 1024).toFixed(2)} KB`;
  const gzipSizeStr = `${(gzipSize / 1024).toFixed(2)} KB`;
  const budgetStr = `${(budget.gzip / 1024).toFixed(2)} KB`;

  const status = gzipSize > budget.gzip ? '❌ EXCEEDED' : '✅ OK';

  if (gzipSize > budget.gzip) {
    failed = true;
  }

  console.log(
    `${file.padEnd(30)} | ${rawSizeStr.padStart(8)} | ${gzipSizeStr.padStart(8)} | ${budgetStr.padStart(13)} | ${status}`
  );
}

console.log('------------------------------------------------------------');

if (failed) {
  console.error('Error: Bundle budget check failed!');
  process.exit(1);
} else {
  console.log('All bundle budget checks passed successfully.');
}
