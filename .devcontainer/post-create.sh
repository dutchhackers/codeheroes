#!/bin/bash
set -e

echo "🚀 Setting up Code Heroes development environment..."

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Copy environment template if .env doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please update .env with your Firebase project values"
fi

# Run setup script to generate environment files
echo "🔧 Running setup script..."
npm run setup

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo "  nx serve firebase-app    # Start Firebase emulators"
echo "  nx serve web             # Start Angular frontend"
echo ""
