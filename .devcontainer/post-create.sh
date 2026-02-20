#!/bin/bash
set -e

echo "🚀 Setting up Code Heroes development environment..."

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Track whether .env was created during this script run
ENV_CREATED=false

# Copy environment template if .env doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  .env has been created from .env.example with placeholder values."
    echo "⚠️  Please update .env with your Firebase project values, then run:"
    echo "    npm run setup"
    ENV_CREATED=true
fi

# Run setup script to generate environment files if .env already existed
if [ "$ENV_CREATED" = false ]; then
    echo "🔧 Running setup script..."
    npm run setup
else
    echo "⏭️  Skipping 'npm run setup' because .env was just created."
    echo "    After updating .env, run 'npm run setup' to generate environment files."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo "  npx nx serve firebase-app    # Start Firebase emulators"
echo "  npx nx serve app             # Start Angular frontend"
echo ""
