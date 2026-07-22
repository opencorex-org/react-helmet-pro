import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = mkdtempSync(join(tmpdir(), 'react-helmet-pro-pack-'));
const fixtureDirectory = mkdtempSync(join(tmpdir(), 'react-helmet-pro-install-'));

const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options,
  }).trim();

try {
  const packOutput = run('pnpm', [
    'pack',
    '--pack-destination',
    outputDirectory,
    '--json',
  ]);
  const packResult = JSON.parse(packOutput);
  const tarballName = Array.isArray(packResult)
    ? packResult[0]?.filename
    : packResult.filename;

  if (!tarballName) {
    throw new Error('pnpm pack did not report a tarball filename');
  }

  const tarballPath = resolve(outputDirectory, basename(tarballName));
  const entries = run('tar', ['-tzf', tarballPath]).split('\n');
  const requiredEntries = [
    'package/package.json',
    'package/README.md',
    'package/dist/index.js',
    'package/dist/index.d.ts',
  ];

  for (const entry of requiredEntries) {
    if (!entries.includes(entry)) {
      throw new Error(`Packed artifact is missing ${entry}`);
    }
  }

  const forbiddenEntry = entries.find((entry) =>
    /(^|\/)(?:\.env(?:\.|$)|\.npmrc$|[^/]+\.(?:key|pem)$)/i.test(entry) ||
    /^package\/(?:\.git(?:hub)?|tests?|examples?)(?:\/|$)/.test(entry),
  );
  if (forbiddenEntry) {
    throw new Error(`Packed artifact contains forbidden path ${forbiddenEntry}`);
  }

  writeFileSync(
    join(fixtureDirectory, 'package.json'),
    JSON.stringify({ name: 'package-install-fixture', private: true }),
  );
  execFileSync(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarballPath],
    { cwd: fixtureDirectory, stdio: 'inherit' },
  );

  const installedRoot = join(
    fixtureDirectory,
    'node_modules',
    'react-helmet-pro',
  );
  const manifest = JSON.parse(
    readFileSync(join(installedRoot, 'package.json'), 'utf8'),
  );

  for (const field of ['main', 'types']) {
    if (typeof manifest[field] !== 'string' || !existsSync(join(installedRoot, manifest[field]))) {
      throw new Error(`Installed package has an invalid ${field} entry point`);
    }
  }

  const artifactDirectory = join(projectRoot, '.artifacts');
  const repositoryTarball = join(artifactDirectory, basename(tarballPath));
  mkdirSync(artifactDirectory, { recursive: true });
  copyFileSync(tarballPath, repositoryTarball);
  writeFileSync(
    join(projectRoot, '.package-tarball'),
    `.artifacts/${basename(repositoryTarball)}\n`,
  );

  console.log(`Verified ${entries.length} packed entries and clean installation.`);
} finally {
  rmSync(outputDirectory, { recursive: true, force: true });
  rmSync(fixtureDirectory, { recursive: true, force: true });
}
