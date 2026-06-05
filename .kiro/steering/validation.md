# Validation Steps

This document describes the validation steps to run after making changes.

## Full Validation

Run these commands from the repo root in order:

```sh
dprint fmt
yarn lint --fix
yarn lint
yarn typecheck
yarn test
```

## Commands

### Format

```sh
dprint fmt
```

Formats all files in the repo. Run this before linting.

### Lint

```sh
yarn lint --fix
yarn lint
```

The first command auto-fixes what it can. The second verifies everything passes.

### Typecheck

```sh
yarn typecheck
```

Runs `tsc` across all packages. This runs topologically, so type errors in early dependencies (e.g. `homelab-services`) may cause cascading errors in downstream packages (`homelab-server`, `homelab-frontend`). Fix errors in the earliest failing package first.

### Test

```sh
yarn test
```

Runs all unit/integration tests across the monorepo. Do NOT run e2e tests (`homelab-e2e-tests`) — those require the backend to be running.

## Targeting a Specific Package

If a check fails, re-run it for the specific package:

```sh
yarn workspace <package-name> <command>
```

Examples:

```sh
yarn workspace homelab-server typecheck
yarn workspace homelab-services-node test
yarn workspace homelab-frontend lint --fix
```

## Targeting a Specific Test

To run a specific test file or test name:

```sh
yarn workspace <package-name> test <args>
```

Examples:

```sh
yarn workspace homelab-server test test/handlers/cert/root.test.ts
yarn workspace homelab-server test --testNamePattern "returns DER"
```

**Important:** Do NOT use `--` to separate args. This version of Yarn passes arguments through directly — using `--` will break the command.
