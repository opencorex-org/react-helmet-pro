import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const version = process.env.VERSION ?? `v${packageJson.version}`;
const previousTag = process.env.PREVIOUS_TAG ?? "";
const outputPath = process.env.RELEASE_NOTES_FILE ?? "RELEASE_NOTES.md";
const repository =
  process.env.REPOSITORY ??
  String(packageJson.repository?.url ?? "")
    .replace(/^git\+/, "")
    .replace(/^https:\/\/github\.com\//, "")
    .replace(/\.git$/, "");

const releaseRange = previousTag ? `${previousTag}..HEAD` : "HEAD";
const logOutput = execSync(
  `git log --no-merges --pretty=format:%s%x09%h ${releaseRange}`,
  { encoding: "utf8" },
).trim();

const ignoredPatterns = [/^chore:\s*bump version\b/i, /^release\b/i];

const sections = [
  { title: "Features", test: /^feat(\(.+\))?:/i },
  { title: "Fixes", test: /^fix(\(.+\))?:/i },
  { title: "Documentation", test: /^docs(\(.+\))?:/i },
  { title: "Refactors", test: /^refactor(\(.+\))?:/i },
  { title: "Tests", test: /^test(\(.+\))?:/i },
  { title: "Chores", test: /^chore(\(.+\))?:/i },
];

const entries = logOutput
  ? logOutput
      .split("\n")
      .map((line) => {
        const [subject, sha] = line.split("\t");

        return {
          sha,
          subject: subject.trim(),
        };
      })
      .filter((entry) => entry.subject && !ignoredPatterns.some((pattern) => pattern.test(entry.subject)))
  : [];

const groupedEntries = new Map(sections.map((section) => [section.title, []]));
const otherEntries = [];

for (const entry of entries) {
  const section = sections.find((currentSection) => currentSection.test.test(entry.subject));

  if (!section) {
    otherEntries.push(entry);
    continue;
  }

  groupedEntries.get(section.title).push(entry);
}

const lines = [`# Release ${version}`, "", "## What's Changed", ""];

let hasVisibleEntries = false;

for (const section of sections) {
  const sectionEntries = groupedEntries.get(section.title);

  if (!sectionEntries?.length) {
    continue;
  }

  hasVisibleEntries = true;
  lines.push(`### ${section.title}`, "");

  for (const entry of sectionEntries) {
    lines.push(`- ${entry.subject} (\`${entry.sha}\`)`);
  }

  lines.push("");
}

if (otherEntries.length) {
  hasVisibleEntries = true;
  lines.push("### Other Changes", "");

  for (const entry of otherEntries) {
    lines.push(`- ${entry.subject} (\`${entry.sha}\`)`);
  }

  lines.push("");
}

if (!hasVisibleEntries) {
  lines.push("- No user-facing changes were detected in this release.", "");
}

if (repository) {
  if (previousTag) {
    lines.push(`**Full Changelog**: https://github.com/${repository}/compare/${previousTag}...${version}`);
  } else {
    lines.push(`**Full Changelog**: https://github.com/${repository}/commits/${version}`);
  }
}

writeFileSync(outputPath, `${lines.join("\n").trim()}\n`);
