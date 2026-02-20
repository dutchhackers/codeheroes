FROM mcr.microsoft.com/devcontainers/javascript-node:24

# Install OpenJDK 17 (required for Firebase Firestore emulator)
RUN apt-get update && apt-get install -y openjdk-17-jre-headless \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Firebase CLI globally
RUN npm install -g firebase-tools@^15.5.1

# Set JAVA_HOME for Firebase emulators
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
