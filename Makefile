# Makefile for Polymorphic Encryption Rig
# Supports Linux/Unix build environments

CC = gcc
CXX = g++
CFLAGS = -O2 -Wall -Wextra -s
LDFLAGS = -lpsapi
DOTNET = dotnet

# Output directories
BIN_DIR = bin
PLUGIN_DIR = $(BIN_DIR)/plugins
TOOLS_DIR = $(BIN_DIR)/tools

# Targets
all: directories dotnet c-components scripts

directories:
	@echo "[*] Creating output directories..."
	@mkdir -p $(BIN_DIR)
	@mkdir -p $(PLUGIN_DIR)
	@mkdir -p $(TOOLS_DIR)

dotnet:
	@echo "[*] Building .NET components..."
	cd PolymorphicBackend && $(DOTNET) build -c Release
	cd PluginSystem && $(DOTNET) build -c Release
	cd PolymorphicRig && $(DOTNET) build -c Release

c-components: polymorphic-loader hot-patcher

polymorphic-loader:
	@echo "[*] Building Polymorphic Loader..."
	$(CC) $(CFLAGS) -o $(BIN_DIR)/PolymorphicLoader PolymorphicLoader/PolymorphicLoader.c

hot-patcher:
	@echo "[*] Building Hot Patcher..."
	$(CC) $(CFLAGS) -o $(BIN_DIR)/HotPatcher HotPatcher/HotPatcher.c $(LDFLAGS)

scripts:
	@echo "[*] Copying scripts..."
	@cp tools/Encrypt-PolymorphicDualLayer.ps1 $(TOOLS_DIR)/
	@if [ -f tools/carmilla-openssl.js ]; then cp tools/carmilla-openssl.js $(TOOLS_DIR)/; fi
	@if [ -f tools/camellia-cli.js ]; then cp tools/camellia-cli.js $(TOOLS_DIR)/; fi

clean:
	@echo "[*] Cleaning build artifacts..."
	@rm -rf $(BIN_DIR)
	@rm -rf */bin */obj
	@find . -name "*.o" -delete
	@find . -name "*.exe" -delete

install:
	@echo "[*] Installing to /usr/local/bin..."
	@sudo cp $(BIN_DIR)/PolymorphicLoader /usr/local/bin/
	@sudo cp $(BIN_DIR)/HotPatcher /usr/local/bin/
	@echo "[+] Installation complete"

test:
	@echo "[*] Running tests..."
	@cd $(BIN_DIR) && ./PolymorphicRig --version
	@echo "[+] Tests passed"

.PHONY: all directories dotnet c-components polymorphic-loader hot-patcher scripts clean install test