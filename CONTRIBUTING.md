# Contributing

## Tooling

- See Artifacts in [npm Registry](https://www.npmjs.com/package/ableron-express)

## Perform Release

1. Make sure, `package.json` → `version` reflects the version you want to publish
2. Run `publish` workflow in GitHub Actions to release current main branch (using the version set in `package.json`)
3. Manually create [GitHub Release](https://github.com/ableron/ableron-express/releases/new)
   1. Set tag name to the version declared in `package.json`, e.g. `v0.0.1`
   2. Set release title to the version declared in `package.json`, e.g. `0.0.1`
   3. Set release notes
   4. Publish release
4. Set version in `package.json` in `main` branch to next version via new commit
