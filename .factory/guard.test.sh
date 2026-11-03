#!/usr/bin/env bash
# Adversarial fixtures for guard.sh: every case builds a fresh repo, stages one change and
# checks that the guard accepts or refuses it. Run: bash .factory/guard.test.sh
set -uo pipefail

here=$(cd "$(dirname "$0")" && pwd)
guard="$here/guard.sh"
# Keep in sync with PROTECTED_PATHS in .github/workflows/agent-build.yml (checked below).
PROTECTED_PATHS=$(grep -E '^  PROTECTED_PATHS: ' "$here/../.github/workflows/agent-build.yml" | sed -E "s/^  PROTECTED_PATHS: '(.*)'$/\1/")
export PROTECTED_PATHS
[[ -n "$PROTECTED_PATHS" ]] || { echo "could not read PROTECTED_PATHS from the workflow"; exit 1; }

pass=0
failed=0

fixture() {

  dir=$(mktemp -d)
  cd "$dir" || exit 1
  git init -q
  git config user.name test
  git config user.email test@example.com
  mkdir -p apps/api/src libs/lib/src .github/workflows
  cat > package.json <<'EOF'
{ "name": "x", "scripts": { "setup": "node scripts/setup-firebase.js" }, "dependencies": { "a": "1.0.0" } }
EOF
  cat > apps/api/project.json <<'EOF'
{ "name": "api", "tags": ["firebase:dep:firebase-app"],
  "targets": { "build": { "executor": "@nx/esbuild:esbuild", "configurations": { "production": {} } },
               "test": { "executor": "@nx/jest:jest" } } }
EOF
  cat > apps/api/src/a.spec.ts <<'EOF'
describe('a', () => {
  it('one', () => expect(1).toBe(1));
  it('two', () => expect(2).toBe(2));
  test.each([1, 2])('three %s', (n) => expect(n).toBeTruthy());
});
EOF
  echo 'export const a = 1;' > apps/api/src/a.ts
  echo 'export const lib = 1;' > libs/lib/src/index.ts
  echo 'name: ci' > .github/workflows/ci.yml
  git add -A
  git commit -qm init
}

expect() { # $1: ok|refuse, $2: name, $3: change (shell code run in the fixture)
  local want=$1 name=$2 change=$3 got
  fixture
  eval "$change"
  git add -A
  if bash "$guard" > guard.log 2>&1; then got=ok; else got=refuse; fi
  if [[ "$got" == "$want" ]]; then
    pass=$((pass + 1)); echo "ok    $want  $name"
  else
    failed=$((failed + 1)); echo "FAIL  wanted $want, got $got: $name"; sed 's/^/      /' guard.log
  fi
  cd / && rm -rf "$dir"
}

# Allowed changes.
expect ok 'source change with an extra test' \
  "echo 'export const b = 2;' >> apps/api/src/a.ts; sed -i.bak \"s/it('two'/it('two2', () => {}); it('two'/\" apps/api/src/a.spec.ts; rm apps/api/src/a.spec.ts.bak"
expect ok 'new dependency (scripts untouched)' \
  "jq '.dependencies.b = \"2.0.0\"' package.json > p && mv p package.json"
expect ok 'build configuration option (e.g. outputHashing)' \
  "jq '.targets.build.configurations.production.outputHashing = \"all\"' apps/api/project.json > p && mv p apps/api/project.json"
expect ok 'new test file' \
  "printf \"it('new', () => {});\\n\" > libs/lib/src/index.spec.ts"

# Protected paths, symlinks.
expect refuse 'workflow change' "echo 'on: push' >> .github/workflows/ci.yml"
expect refuse 'rename a workflow away' "git mv .github/workflows/ci.yml ci.yml"
expect refuse 'nested .npmrc' "echo 'registry=https://evil' > libs/lib/.npmrc"
expect refuse 'nx.json' "echo '{}' > nx.json"
expect refuse 'jest config' "echo 'module.exports = {}' > apps/api/jest.config.ts"
expect refuse 'new symlink' "ln -s /etc/passwd apps/api/src/link"
expect refuse 'file turned into a symlink' "rm apps/api/src/a.ts; ln -s /etc/passwd apps/api/src/a.ts"

# Test execution contract.
expect refuse 'package.json script turned into a no-op' \
  "jq '.scripts.setup = \"true\"' package.json > p && mv p package.json"
expect refuse 'test target replaced' \
  "jq '.targets.test = {\"executor\": \"nx:run-commands\", \"options\": {\"command\": \"true\"}}' apps/api/project.json > p && mv p apps/api/project.json"
expect refuse 'tag removed (drops the project from firebase-app test)' \
  "jq '.tags = []' apps/api/project.json > p && mv p apps/api/project.json"
expect refuse 'build executor swapped' \
  "jq '.targets.build.executor = \"nx:noop\"' apps/api/project.json > p && mv p apps/api/project.json"
expect refuse 'package.json made invalid' "echo '{ broken' > package.json"
expect refuse 'project.json made invalid' "echo '{ broken' > apps/api/project.json"
expect refuse 'project.json deleted' "git rm -q apps/api/project.json"
expect refuse 'test file deleted' "git rm -q apps/api/src/a.spec.ts"
expect refuse 'it.skip added' "sed -i.bak \"s/it('one'/it.skip('one'/\" apps/api/src/a.spec.ts; rm apps/api/src/a.spec.ts.bak"
expect refuse 'describe.only added' "sed -i.bak \"s/describe('a'/describe.only('a'/\" apps/api/src/a.spec.ts; rm apps/api/src/a.spec.ts.bak"
expect refuse 'xit added' "sed -i.bak \"s/it('two'/xit('two'/\" apps/api/src/a.spec.ts; rm apps/api/src/a.spec.ts.bak"
expect refuse 'test case removed' "sed -i.bak \"/it('two'/d\" apps/api/src/a.spec.ts; rm apps/api/src/a.spec.ts.bak"
expect refuse 'test cases moved out of a deleted file into fewer' \
  "git rm -q apps/api/src/a.spec.ts; printf \"it('one', () => {});\\n\" > apps/api/src/b.spec.ts"

echo
echo "$pass passed, $failed failed"
(( failed == 0 ))
