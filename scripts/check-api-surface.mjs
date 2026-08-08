import fs from 'node:fs';
import path from 'node:path';

const PKG_FILE = path.resolve('package.json');
const SURFACE_FILE = path.resolve('api-surface.json');

const pkg = JSON.parse(fs.readFileSync(PKG_FILE, 'utf8'));

const extractApiSurface = async () => {
  const surface = {};

  for (const [subpath, mapping] of Object.entries(pkg.exports)) {
    // Avoid loading CLI bin if any or format correctly
    const relativePath = typeof mapping === 'string' ? mapping : mapping.default;
    if (!relativePath) continue;

    const absolutePath = path.resolve(relativePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Build file not found: ${absolutePath}`);
    }

    try {
      const moduleUrl = `file://${absolutePath}`;
      const mod = await import(moduleUrl);
      surface[subpath] = Object.keys(mod)
        .filter((k) => k !== 'default' && k !== 'module.exports' && k !== '__esModule')
        .sort();
    } catch (err) {
      console.warn(`Warning: Could not import export subpath "${subpath}": ${err.message}`);
    }
  }

  return surface;
};

const run = async () => {
  const currentSurface = await extractApiSurface();
  const updateMode = process.argv.includes('--update');

  if (updateMode || !fs.existsSync(SURFACE_FILE)) {
    fs.writeFileSync(SURFACE_FILE, JSON.stringify(currentSurface, null, 2), 'utf8');
    console.log(`Successfully generated/updated API surface signature file: ${SURFACE_FILE}`);
    process.exit(0);
  }

  const expectedSurface = JSON.parse(fs.readFileSync(SURFACE_FILE, 'utf8'));
  let mismatch = false;

  // Compare expected vs current
  const allSubpaths = new Set([...Object.keys(expectedSurface), ...Object.keys(currentSurface)]);

  for (const subpath of allSubpaths) {
    const expected = expectedSurface[subpath] || [];
    const current = currentSurface[subpath] || [];

    const added = current.filter((x) => !expected.includes(x));
    const removed = expected.filter((x) => !current.includes(x));

    if (added.length > 0 || removed.length > 0) {
      mismatch = true;
      console.error(`Mismatch in API exports for subpath "${subpath}":`);
      if (added.length > 0) {
        console.error(`  [+] Added: ${added.join(', ')}`);
      }
      if (removed.length > 0) {
        console.error(`  [-] Removed: ${removed.join(', ')}`);
      }
    }
  }

  if (mismatch) {
    console.error('\nError: Public API surface does not match api-surface.json.');
    console.error('Run "pnpm run api:update" to approve these changes if they are intentional.');
    process.exit(1);
  } else {
    console.log('Public API surface check passed successfully.');
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
