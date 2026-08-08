# Maintainer Runbooks & Semver Policy

This document outlines the versioning, compatibility support, release workflows, and incident response procedures for **React Helmet Pro**.

---

## 1. Environment & Support Matrix

We support the following environments and frameworks. Any changes to this matrix must be aligned with the SemVer policy.

| Target | Supported Versions | Verification Mechanism |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` (LTS: 18, 20, 22, 24) | CI matrix execution |
| **React** | `^18.0.0` \|\| `^19.0.0` | Test suite render configurations |
| **TypeScript** | `>= 5.0.0` | `pnpm run typecheck` |
| **Browsers** | Modern ESM/Evergreen (Chrome, Safari, Firefox, Edge) | JSDOM test environments |
| **Package Managers** | npm, pnpm, yarn | Packed installer checks in CI |
| **Frameworks** | Next.js, Remix, Astro, React Router | Subpath adapter verifications |

---

## 2. Deprecation & SemVer Policy

React Helmet Pro strictly adheres to [Semantic Versioning 2.0.0](https://semver.org/).

### Semantic Versioning Rules
- **Major (`X.0.0`)**: Backwards-incompatible API changes, raising minimum environment requirements (e.g., dropping Node 18 or React 18 support), or removal of deprecated components.
- **Minor (`0.Y.0`)**: Backwards-compatible features, new adapters, or new validation/security rule sets.
- **Patch (`0.0.Z`)**: Bug fixes, performance optimizations, documentation edits, or internal helper modifications.

### Deprecation Process
1. **Notice**: Mark deprecated functions or components using `@deprecated` JSDoc annotations and print a runtime console warning (limited to once per mount/session in development mode).
2. **Grace Period**: Deprecated features must remain fully functional for at least one full minor cycle (e.g. if deprecated in `2.4.0`, they cannot be removed until `3.0.0`).
3. **Removal**: Deprecated APIs are removed only at major version boundaries.

---

## 3. Incident Runbooks

### Runbook A: Recovering from a Faulty npm Release
Because published npm packages are immutable, you cannot overwrite a version. If a bug is published:

1. **Assess Severity**:
   - If it's a security vulnerability (e.g. XSS leak), proceed immediately to **Runbook C**.
   - If it's a major functional bug (regression), proceed below.
2. **Deprecate the Release**:
   - Run the deprecation command to warn consumers during installation:
     ```sh
     npm deprecate react-helmet-pro@X.Y.Z "This version contains a severe regression. Please upgrade to X.Y.A."
     ```
3. **Fix and Re-release**:
   - Revert the regression or commit the fix on `main`.
   - Bump version using changesets/semver normal workflow.
   - Tag the new commit and trigger the automated release pipeline.
4. **Update Release Notes**:
   - Edit the GitHub Release description for the broken version to clearly note the regression and link to the replacement version.

### Runbook B: npm OIDC Trusted Publishing Failure
If the automated OIDC publisher fails during CI:

1. **Inspect CI Logs**:
   - Check if the tag verification step failed (e.g. if tag commit does not match `main` HEAD).
   - Ensure the tag is in the format `vX.Y.Z` and matches `package.json`.
2. **Use Token Fallback**:
   - If OIDC is down or misconfigured, a maintainer with publish rights can download the verified workflow artifact (`react-helmet-pro-X.Y.Z.tgz`).
   - From a secure local workspace, run:
     ```sh
     npm publish react-helmet-pro-X.Y.Z.tgz --access public --provenance
     ```
3. **Audit OIDC Setup**:
   - Verify that the GitHub organization (`opencorex-org`), repository (`react-helmet-pro`), workflow file (`publish.yml`), and environment (`npm`) exactly match the OIDC configurations in the npm repository settings.

### Runbook C: Handling Security Vulnerabilities
If a security vulnerability is reported:

1. **Draft Security Advisory**:
   - Open a GitHub Security Advisory in the repository to draft the fix privately.
2. **Develop Fix**:
   - Write regression test cases in `tests/SecurityRegressions.test.tsx` showing the vulnerability.
   - Commit the fix to the private security branch and verify tests pass.
3. **Publish & Coordinate**:
   - Merge the private advisory fix branch into `main`.
   - Publish a new patch release containing the fix.
   - Request a CVE (Common Vulnerability and Exposures) identifier through GitHub.
   - Disclose the advisory publicly once patch version is available in the npm registry.
