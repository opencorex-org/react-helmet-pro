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
    'package/dist/react-router/index.js',
    'package/dist/remix/index.js',
    'package/dist/astro/index.js',
    'package/dist/vite-ssr/index.js',
    'package/dist/server/express.js',
    'package/dist/server/fastify.js',
    'package/dist/server/hono.js',
    'package/dist/server/index.js',
    'package/dist/adapters/index.js',
    'package/dist/cli/index.js',
    'package/dist/cli/bin.js',
    'package/dist/eslint/index.js',
    'package/dist/inspector/index.js',
    'package/dist/testing/index.js',
    'package/dist/testing/vitest.js',
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

  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      "const main = await import('react-helmet-pro'); const rr = await import('react-helmet-pro/react-router'); const remix = await import('react-helmet-pro/remix'); const astro = await import('react-helmet-pro/astro'); const viteSsr = await import('react-helmet-pro/vite-ssr'); const express = await import('react-helmet-pro/express'); const fastify = await import('react-helmet-pro/fastify'); const hono = await import('react-helmet-pro/hono'); const server = await import('react-helmet-pro/server'); const adapters = await import('react-helmet-pro/adapters'); const cli = await import('react-helmet-pro/cli'); const eslint = await import('react-helmet-pro/eslint'); const testing = await import('react-helmet-pro/testing'); const testingVitest = await import('react-helmet-pro/testing/vitest'); if (!main.Helmet || !rr.toReactRouterMeta || !remix.toRemixMeta || !astro.collectAstroHead || !viteSsr.injectHelmetIntoHtml || !express.expressHelmetMiddleware || !fastify.fastifyHelmetPlugin || !hono.honoHelmetMiddleware || !server.extractXRobotsTagHeader || !adapters.toReactRouterMeta || !cli.runAudit || !eslint.default || !testing.registerMatchers || !testing.helmetSnapshotSerializer || !testingVitest.registerMatchers) throw new Error('Adapter, tooling, testing, or vitest testing exports are missing');",
    ],
    { cwd: fixtureDirectory, stdio: 'inherit' },
  );


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
