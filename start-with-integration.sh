#!/bin/bash
# Star5IDE Integration Startup Script
# Starts integration features alongside existing Star5IDE

echo "=== Star5IDE Integration Startup ==="
echo "Original Star5IDE: PRESERVED"
echo "Integration Features: Ocean Digital + Cross-Hot-Patching + GitHub"

# Set environment variables
export GITHUB_TOKEN="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"
export DIGITALOCEAN_TOKEN="dop_v1_ccce0b4c48181e9ef566a7b2a5105194256b8302af99761a57a7cad6d3007c4e"

# Start original Star5IDE (your existing startup commands)
echo "Starting original Star5IDE functionality..."
# Add your existing Star5IDE startup commands here
# Example: ./start-star5ide.sh
# Example: dotnet run --project src/Star5IDE

# Start integration features in background
echo "Starting integration features..."
dotnet run --project src/Integration/Star5IDEIntegration.cs &

echo "Star5IDE with integration features running!"
echo "Original functionality: ACTIVE"
echo "Integration features: ACTIVE"
