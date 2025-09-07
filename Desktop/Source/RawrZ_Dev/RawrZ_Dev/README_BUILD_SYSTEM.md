# RawrZ Universal Build System

This directory contains a robust, universal build system that automatically detects available compilers and builds the RawrZ project without requiring specific Visual Studio installations or complex setup.

## Quick Start

### Option 1: PowerShell (Recommended)
```powershell
# Basic build
.\build_universal.ps1

# Clean build (removes previous artifacts)
.\build_universal.ps1 -Clean

# Build with verbose output
.\build_universal.ps1 -Verbose

# Build a specific target
.\build_universal.ps1 -Target "RawrZ_Complete"
```

### Option 2: Batch File
```cmd
# Basic build
build_universal.bat
```

## What It Does

The universal build system automatically:

1. **Detects Available Compilers:**
   - Microsoft Visual C++ (MSVC) - Visual Studio 2022/2019/2017
   - MinGW-w64 (GNU C++ for Windows)
   - GCC (GNU Compiler Collection)

2. **Auto-Configures Build Environment:**
   - Sets appropriate compiler flags
   - Configures include paths
   - Sets up linking options

3. **Builds the Project:**
   - Compiles with C++17 standard
   - Optimizes for performance (-O2)
   - Creates standalone executables

## Supported Compilers

### Microsoft Visual C++ (MSVC)
- **Versions:** 2017, 2019, 2022
- **Editions:** Enterprise, Professional, Community, Build Tools
- **Auto-detection:** Searches common installation paths
- **Features:** Full Windows SDK integration, optimized for Windows

### MinGW-w64
- **Auto-detection:** Checks PATH and common installation directories
- **Common paths:** `C:\mingw64\bin\`, `C:\msys64\mingw64\bin\`
- **Features:** Cross-platform compatibility, static linking

### GCC
- **Auto-detection:** Checks PATH
- **Features:** Standard GNU toolchain, static linking

## Build Targets

The system can build different targets:

- **RawrZ_Simple** (default) - Basic framework with core features
- **RawrZ_Complete** - Full framework with all plugins
- **RawrZ_OpenSSL** - Framework with OpenSSL encryption

## Troubleshooting

### No Compiler Found
If no compiler is detected:

1. **Install Visual Studio Build Tools (Recommended):**
   - Download from Microsoft's website
   - Install C++ build tools workload
   - No full Visual Studio required

2. **Install MinGW-w64:**
   - Download from MSYS2 or official MinGW-w64
   - Add to PATH or install in `C:\mingw64\`

3. **Install GCC:**
   - Use MSYS2 or Cygwin
   - Ensure it's in your PATH

### Build Failures
Common issues and solutions:

1. **C++17 Support Missing:**
   - Update your compiler to a version that supports C++17
   - MSVC 2017+, GCC 7+, Clang 5+

2. **Windows Headers Missing:**
   - Install Windows SDK
   - Ensure compiler can find Windows headers

3. **Permission Issues:**
   - Run as Administrator if needed
   - Check antivirus isn't blocking compilation

## Advanced Usage

### Custom Compiler Paths
If you have a compiler in a non-standard location, you can:

1. Add it to your system PATH
2. Create a symbolic link to a standard location
3. Modify the build scripts to include your path

### Build Options
The PowerShell script supports several parameters:

```powershell
# Clean previous build artifacts
.\build_universal.ps1 -Clean

# Build with verbose output
.\build_universal.ps1 -Verbose

# Build specific target
.\build_universal.ps1 -Target "RawrZ_Complete"

# Combine options
.\build_universal.ps1 -Clean -Verbose -Target "RawrZ_OpenSSL"
```

## File Structure

```
RawrZ_Dev/
├── build_universal.ps1      # PowerShell build script (recommended)
├── build_universal.bat      # Batch file build script
├── build_simple.bat         # Legacy simple build script
├── build_complete.bat       # Legacy complete build script
├── CMakeLists.txt           # CMake configuration (requires CMake)
├── RawrZ_Simple.cpp         # Main source file
├── RawrZ_Complete.cpp       # Complete framework source
└── plugins/                 # Plugin source files
```

## Migration from Old Build System

If you were using the old build scripts:

1. **Replace old calls:**
   - `build_simple.bat` → `build_universal.ps1`
   - `build_complete.bat` → `build_universal.ps1 -Target "RawrZ_Complete"`

2. **Benefits of new system:**
   - No more hardcoded paths
   - Automatic compiler detection
   - Better error handling
   - Cross-compiler compatibility

## Support

The universal build system is designed to work out-of-the-box on most Windows systems. If you encounter issues:

1. Check that you have a C++17 compatible compiler
2. Ensure Windows SDK is installed (for MSVC builds)
3. Try running the PowerShell script with `-Verbose` for detailed output

## Performance

- **MSVC builds:** Fastest compilation, best Windows integration
- **MinGW-w64 builds:** Good performance, portable executables
- **GCC builds:** Standard toolchain, good compatibility

All builds produce optimized executables with the `-O2` flag for best performance.
