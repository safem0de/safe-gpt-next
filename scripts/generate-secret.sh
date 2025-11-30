#!/bin/bash

# Script to generate NextAuth secret
# Usage: ./scripts/generate-secret.sh

echo "🔐 Generating NextAuth Secret..."
echo ""

# Generate secret
SECRET=$(openssl rand -base64 32)

echo "✅ Generated secret:"
echo "$SECRET"
echo ""
echo "📋 Copy this to your .env.local file:"
echo "NEXTAUTH_SECRET=$SECRET"
echo ""
echo "💡 Tip: You can also use: https://generate-secret.vercel.app/32"
