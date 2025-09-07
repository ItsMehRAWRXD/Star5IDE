#!/bin/bash
cd "$(dirname "$0")"

if [ $# -eq 0 ]; then
    echo "Polymorphic Rig Toolkit"
    echo ""
    echo "Usage: ./rig.sh <command> [options]"
    echo ""
    echo "Available commands:"
    echo "  list                  List plugins"
    echo "  polymorphicloader     Run polymorphic loader"
    echo "  hotpatcher           Run hot patcher"
    echo "  interactive          Interactive mode"
    echo ""
    echo "PowerShell tools:"
    echo "  powershell Encrypt-PolymorphicDualLayer.ps1"
    echo "  powershell BinToCs.ps1 -InputFile file.bin -OutputFile output.cs"
    echo ""
    exit 0
fi

if [ -f "rig.exe" ]; then
    ./rig.exe "$@"
elif [ -f "PolymorphicRig.exe" ]; then
    ./PolymorphicRig.exe "$@"
elif command -v dotnet >/dev/null 2>&1; then
    dotnet run --project PolymorphicRig.csproj -- "$@"
else
    echo "No .NET runtime found. Please install .NET SDK to use the CLI."
    echo "PowerShell tools are available in this directory."
fi
