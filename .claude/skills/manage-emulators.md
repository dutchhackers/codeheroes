# Skill: Manage Firebase Emulators

## Description
Start, stop, and manage Firebase emulators for local development.

## When to Use
- User asks to start/restart emulators
- Emulators crashed or ports are in use
- Need to verify emulators are running

## Commands

### Start Emulators
```bash
nx serve firebase-app
```
Run in background with `run_in_background: true` for long-running sessions.

### Stop/Restart Emulators
```bash
# Kill processes on emulator ports
lsof -ti:8080,8085,5001,4000 | xargs kill -9

# Wait 2 seconds, then restart
sleep 2 && nx serve firebase-app
```

### Check Emulator Status
```bash
# Check if emulator hub is running
curl -s http://127.0.0.1:4400/emulators

# Check specific ports
lsof -i:4000 -i:8080 -i:5001
```

## Emulator Ports

| Service | Port |
|---------|------|
| Emulator UI | 4000 |
| Emulator Hub | 4400 |
| Functions | 5001 |
| Firestore | 8080 |
| Pub/Sub | 8085 |
| Auth | 9099 |
| Storage | 9199 |
| Eventarc | 9299 |

## Important Notes

1. **Code changes may require restart** - Watch mode doesn't always pick up changes in progression-engine or handlers
2. **Background tasks** - When running in background, check output file with `tail`
3. **Port conflicts** - Always kill existing processes before restarting
4. **Startup time** - Emulators take ~20-30 seconds to fully initialize
5. **Data persistence** - Emulator data is imported from `.emulators/` directory on startup

## Verification

After emulators start, verify with:
```bash
curl -s http://127.0.0.1:4000 | head -1  # Should return HTML
curl -s http://127.0.0.1:4400/emulators  # Should return JSON
```

Or check the output for:
```
All emulators ready! It is now safe to connect your app.
```
