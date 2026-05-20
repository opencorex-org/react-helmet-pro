# Contributing

Thanks for contributing to `react-helmet-pro`.

## Development setup

```bash
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
```

To run the example app locally:

```bash
pnpm run dev
```

## Contribution expectations

- Keep changes focused and avoid unrelated cleanup in the same pull request.
- Add or update tests for user-facing behavior changes.
- Update `README.md` and examples when the public API changes.
- Prefer backwards-compatible API additions unless a breaking change is explicitly planned.

## Pull requests

Before opening a pull request:

1. Run `pnpm run typecheck`.
2. Run `pnpm test`.
3. Run `pnpm run build`.
4. Summarize the user-facing impact and any migration considerations.

## Release flow

- The package version is sourced from `package.json`.
- Merges to `main` can create a matching Git tag and GitHub Release when the version is new.
- Tag pushes like `v2.2.0` trigger the npm publish workflow.
