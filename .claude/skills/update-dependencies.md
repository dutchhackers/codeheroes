# Update Dependencies

Safely update npm dependencies with proper version compatibility checks.

## Usage

```
/update-dependencies [PACKAGE_NAMES...]
```

**Arguments:**
- `PACKAGE_NAMES` (optional): Specific packages to update. Default: all outdated packages

## Pre-Update Checklist

**CRITICAL**: Before updating any dependency, always perform these checks:

### 1. Check Project Framework Versions

```bash
# Get Angular version
grep '"@angular/core"' package.json

# Get Node.js version
cat .nvmrc || node --version
```

### 2. For Angular-Related Packages (@angular/fire, @ngrx/*, etc.)

Angular ecosystem packages follow **strict major version alignment**:

| Project Angular | Required @angular/fire | Required @ngrx/* |
|-----------------|----------------------|------------------|
| 19.x | 19.x | 19.x |
| 20.x | 20.x | 20.x |
| 21.x | 21.x | 21.x |

**Always check peer dependencies BEFORE updating:**

```bash
# Check what Angular version a package requires
npm view @angular/fire@VERSION peerDependencies --json

# Check internal dependencies (e.g., what firebase version it bundles)
npm view @angular/fire@VERSION dependencies --json
```

### 3. For Firebase Packages

Firebase SDK versions must be compatible:

```bash
# Check what firebase version @angular/fire expects
npm view @angular/fire@VERSION dependencies --json | grep firebase

# Ensure no duplicate firebase versions after install
npm list firebase
```

**Red flag**: If `npm list` shows multiple firebase versions (e.g., one at root, one nested), you have version mismatch.

## Update Process

### Step 1: Research Compatible Versions

```bash
# List all available versions
npm view PACKAGE versions --json | tail -20

# Find the right version for your framework
npm view PACKAGE@VERSION peerDependencies
```

### Step 2: Update package.json

Only after confirming compatibility, update the version.

### Step 3: Install and Verify

```bash
npm install

# Check for duplicate/nested packages (BAD)
npm list PACKAGE

# Should show single deduped version (GOOD):
# └── package@x.x.x

# NOT multiple versions (BAD):
# ├─┬ @angular/fire@x.x.x
# │ └── firebase@11.x.x
# └── firebase@12.x.x
```

### Step 4: Build and Test

```bash
# Build all affected apps
nx build app --configuration=production
nx build web-legacy --configuration=production

# Check bundle sizes - significant increases may indicate duplicate packages
```

### Step 5: Browser Test

Always test in browser after dependency updates:
- Authentication flows
- Data fetching
- Real-time subscriptions

## Common Pitfalls

### 1. "Build Passes" ≠ "Correct"

Builds can pass with mismatched peer dependencies. Always verify:
- No duplicate packages in `npm list`
- Bundle size hasn't unexpectedly increased
- Runtime behavior is correct

### 2. Peer Dependency Warnings

**Never ignore peer dependency warnings**. They indicate version mismatches that can cause:
- Duplicate bundles (larger app size)
- Runtime type mismatches
- Subtle bugs

### 3. Using Latest Without Checking

```bash
# DON'T do this blindly
npm install @angular/fire@latest

# DO check compatibility first
npm view @angular/fire versions --json | tail -10
npm view @angular/fire@21.0.0-rc.0 peerDependencies
```

## Examples

### Update @angular/fire and firebase

```bash
# 1. Check project Angular version
grep '"@angular/core"' package.json
# "@angular/core": "21.1.1"

# 2. Find compatible @angular/fire
npm view @angular/fire versions --json | grep "21"
# "21.0.0-rc.0"

# 3. Check its peer dependencies
npm view @angular/fire@21.0.0-rc.0 peerDependencies
# @angular/core: ^21.0.0 ✓

# 4. Check what firebase it supports
npm view @angular/fire@21.0.0-rc.0 dependencies | grep firebase
# firebase: ^12.4.0

# 5. Now safe to update
# Update package.json to:
# "@angular/fire": "^21.0.0-rc.0"
# "firebase": "^12.8.0"

# 6. Install and verify
npm install
npm list firebase
# Should show single deduped version
```

## Related

- After updating, run `/fix-bot-reviews` to address any Copilot feedback
- Test with emulators: `nx serve firebase-app`
