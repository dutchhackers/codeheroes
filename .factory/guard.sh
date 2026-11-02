#!/usr/bin/env bash
# Deterministic patch guard for the agent factory.
#
# Run from the repository root after `git apply --index <patch>`: it compares the index
# with HEAD and exits non-zero when the patch may not be published. The workflow copies
# this script out of the checkout BEFORE applying the patch, so a patch cannot change the
# guard that judges it.
#
# Checks:
#   1. protected paths ($PROTECTED_PATHS, one ERE shared with build.ts): additions,
#      modifications, deletions, and both sides of a rename
#   2. symlinks: any entry whose new mode is 120000
#   3. the test execution contract, so a green verify still means the tests ran:
#      - root package.json "scripts" unchanged (verify runs `npm run setup`)
#      - in every changed project.json: name, tags, implicitDependencies and the
#        test/lint targets unchanged, build executor unchanged; no project.json deleted
#      - no test file deleted
#      - no new .skip/.only/xit/xdescribe/fit/fdescribe in test files
#      - the number of test cases (it/test calls) in test files does not go down
set -uo pipefail

: "${PROTECTED_PATHS:?PROTECTED_PATHS is not set}"

TEST_FILES=(':(glob)**/*.spec.ts' ':(glob)**/*.test.ts' ':(glob)**/*.spec.js' ':(glob)**/*.test.js')
failures=()
fail() { failures+=("$1"); echo "::error::$1"; }

# Print a canonical JSON projection of stdin. $1: "scripts" or "project". node, not jq: the
# guard also runs inside the sandbox image, which has node but no jq.
project() {
  node -e '
    const sort = (v) => Array.isArray(v) ? v.map(sort)
      : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])])) : v;
    const j = JSON.parse(require("fs").readFileSync(0, "utf8"));
    const t = j.targets ?? {};
    const out = process.argv[1] === "scripts" ? j.scripts ?? null
      : { name: j.name ?? null, tags: j.tags ?? null, implicitDependencies: j.implicitDependencies ?? null,
          test: t.test ?? null, lint: t.lint ?? null, buildExecutor: t.build?.executor ?? null };
    console.log(JSON.stringify(sort(out)));
  ' "$1"
}

# 1. Protected paths. --no-renames: a move reports its deleted source too. -z: no quoting of odd names.
while IFS= read -r -d '' f; do
  fail "protected path: $f"
done < <(git diff --cached --name-only --no-renames -z | grep -zE "$PROTECTED_PATHS")

# 2. Symlinks. Raw format ':<old mode> <new mode> <old sha> <new sha> <status>\t<path>'.
while IFS= read -r line; do
  fail "symlink: ${line#*$'\t'}"
done < <(git diff --cached --raw --no-renames | awk '$2 == "120000"')

# 3a. Root package.json scripts.
if git diff --cached --quiet -- package.json; then :; else
  if [[ "$(git show HEAD:package.json | project scripts)" != "$(git show :package.json | project scripts 2>/dev/null || echo invalid)" ]]; then
    fail "package.json: \"scripts\" changed"
  fi
fi

# 3b. project.json: what decides which tests and builds run.
while IFS=$'\t' read -r status path; do
  case "$status" in
    D) fail "project.json deleted: $path" ;;
    M)
      before=$(git show "HEAD:$path" | project project 2>/dev/null) || before=invalid
      after=$(git show ":$path" | project project 2>/dev/null) || after=invalid
      [[ "$before" == "$after" ]] || fail "project.json test/build contract changed: $path"
      ;;
  esac
done < <(git diff --cached --name-status --no-renames -- ':(glob)**/project.json' 'project.json')

# 3c. Deleted test files.
while IFS= read -r f; do
  fail "test file deleted: $f"
done < <(git diff --cached --diff-filter=D --name-only --no-renames -- "${TEST_FILES[@]}")

# 3d. Focus/skip markers added in test files.
while IFS= read -r line; do
  fail "skip/only marker added: ${line:1}"
done < <(git diff --cached -U0 --no-renames -- "${TEST_FILES[@]}" \
  | grep -E '^\+[^+]' \
  | grep -E '\b(it|test|describe)\.(skip|only|todo)\b|\b(xit|xtest|xdescribe|fit|fdescribe)\s*\(' || true)

# 3e. Test case count must not go down.
TEST_CASE='(^|[^.[:alnum:]_])(it|test)(\.each)?[[:space:]]*[(`]'
count() { # stdin: matches, one per line
  wc -l | tr -d ' '
}
before=$(git grep -h -o -E "$TEST_CASE" HEAD -- "${TEST_FILES[@]}" 2>/dev/null | count)
after=$(git grep --cached -h -o -E "$TEST_CASE" -- "${TEST_FILES[@]}" 2>/dev/null | count)
if (( after < before )); then
  fail "test cases went down: $before → $after"
fi
echo "test cases: $before → $after"

if (( ${#failures[@]} > 0 )); then
  echo "guard: ${#failures[@]} problem(s); the patch is refused"
  exit 1
fi
git diff --cached --stat
echo "guard: ok"
