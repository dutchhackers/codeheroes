FROM mcr.microsoft.com/devcontainers/javascript-node:24

# Install default JRE (required for Firebase Firestore emulator)
RUN apt-get update && apt-get install -y default-jre-headless \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Firebase CLI globally
RUN npm install -g firebase-tools@^15.5.1
