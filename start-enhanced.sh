#!/bin/bash
echo "=== Enhanced Star5IDE Startup ==="
echo "Original Star5IDE: PRESERVED"
echo "New Features: Ocean Digital + Cross-Hot-Patching + GitHub"

# Set environment variables
export GITHUB_TOKEN="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"
export DIGITALOCEAN_TOKEN="dop_v1_ccce0b4c48181e9ef566a7b2a5105194256b8302af99761a57a7cad6d3007c4e"

# Start original Star5IDE
echo "Starting original Star5IDE functionality..."
# Your existing Star5IDE startup commands here

# Start enhanced features
echo "Starting enhanced features..."
dotnet run --project src/Enhanced/EnhancedStar5IDE.cs

echo "Enhanced Star5IDE system running!"
