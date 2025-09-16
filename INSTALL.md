# Burn Rate - Installation Guide

Welcome to Burn Rate, a fast-paced turn-based strategy game! This guide will help you install and set up the game on your system.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Verification Procedures](#verification-procedures)
- [Platform-Specific Instructions](#platform-specific-instructions)
- [Available Commands](#available-commands)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run build` | Build the project |
| `npm run system-check` | Verify installation |
| `npm start` | Start the game |
| `npm test` | Run tests |

---

## Prerequisites

Before installing Burn Rate, ensure your system meets the following requirements:

### Required Software

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (usually comes with Node.js)

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Memory**: 512 MB RAM minimum
- **Storage**: 100 MB free disk space
- **Terminal**: Command line interface access

### Checking Prerequisites

Verify your system has the required software installed:

```bash
# Check Node.js version
node --version

# Check npm version  
npm --version
```

**Expected output:**
- Node.js: `v18.0.0` or higher
- npm: `8.0.0` or higher

If you don't have Node.js installed, download it from [nodejs.org](https://nodejs.org/).

## Installation Steps

### Method 1: Clone from Repository (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd burn-rate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Verify installation**
   ```bash
   npm run system-check
   ```

### Method 2: Download and Install

1. **Download the source code**
   - Download the ZIP file from the repository
   - Extract to your desired location
   - Navigate to the extracted folder

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Verify installation**
   ```bash
   npm run system-check
   ```

## Verification Procedures

### System Health Check

Run the built-in system check to verify everything is working correctly:

```bash
npm run system-check
```

**Expected output:**
```
============================================================
SYSTEM HEALTH CHECK RESULTS
============================================================
✅ Game Engine Creation
✅ Initial Game State Validation
✅ Turn Processing
✅ CLI Interface Creation
✅ Full Game Initialization

============================================================
✅ System is healthy and ready to run Burn Rate
```

### Test Suite Verification

Run the test suite to ensure all components are functioning:

```bash
npm test
```

The tests should pass with minimal failures (some AI behavior tests may occasionally fail due to randomness).

### Quick Start Test

Start the game to verify it launches correctly:

```bash
npm start
```

You should see:
```
Initializing Burn Rate...

✅ Game initialized successfully!
🤖 AI Archetype: Selected

Welcome to Burn Rate!
[Game interface will appear]
```

Type `quit` to exit the game.

## Platform-Specific Instructions

### Windows

1. **Install Node.js**
   - Download from [nodejs.org](https://nodejs.org/)
   - Run the installer with administrator privileges
   - Restart your command prompt after installation

2. **Use Command Prompt or PowerShell**
   ```cmd
   # Navigate to game directory
   cd path\to\burn-rate
   
   # Install and build
   npm install
   npm run build
   ```

### macOS

1. **Install Node.js**
   - Download from [nodejs.org](https://nodejs.org/), or
   - Use Homebrew: `brew install node`

2. **Use Terminal**
   ```bash
   # Navigate to game directory
   cd /path/to/burn-rate
   
   # Install and build
   npm install
   npm run build
   ```

### Linux (Ubuntu/Debian)

1. **Install Node.js**
   ```bash
   # Using NodeSource repository (recommended)
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Or using package manager
   sudo apt update
   sudo apt install nodejs npm
   ```

2. **Build the game**
   ```bash
   cd /path/to/burn-rate
   npm install
   npm run build
   ```

## Available Commands

After installation, you can use these npm scripts:

| Command | Description |
|---------|-------------|
| `npm start` | Start the game with default settings |
| `npm run start:debug` | Start with debug information enabled |
| `npm run system-check` | Run system health diagnostics |
| `npm test` | Run the test suite |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run clean` | Remove compiled files |
| `npm run rebuild` | Clean and rebuild the project |

## Troubleshooting

### Common Issues

#### "node: command not found"
**Problem**: Node.js is not installed or not in PATH.
**Solution**: 
- Install Node.js from [nodejs.org](https://nodejs.org/)
- Restart your terminal after installation
- On Windows, restart Command Prompt as administrator

#### "npm install" fails with permission errors
**Problem**: Insufficient permissions to install packages.
**Solution**:
- **Windows**: Run Command Prompt as administrator
- **macOS/Linux**: Use `sudo npm install` (not recommended) or fix npm permissions:
  ```bash
  mkdir ~/.npm-global
  npm config set prefix '~/.npm-global'
  echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
  source ~/.bashrc
  ```

#### Build fails with TypeScript errors
**Problem**: TypeScript compilation errors.
**Solution**:
- Ensure you have the latest version: `npm install -g typescript`
- Clean and rebuild: `npm run clean && npm run build`
- Check Node.js version compatibility

#### "Cannot find module" errors
**Problem**: Dependencies not properly installed.
**Solution**:
- Delete `node_modules` and `package-lock.json`
- Reinstall: `npm install`
- Rebuild: `npm run build`

#### Game crashes on startup
**Problem**: System compatibility or missing dependencies.
**Solution**:
- Run system check: `npm run system-check`
- Check error messages for specific issues
- Try debug mode: `npm run start:debug`

#### Tests fail during verification
**Problem**: Some tests may fail due to timing or randomness.
**Solution**:
- Minor test failures (1-2) are acceptable for AI behavior tests
- If many tests fail, check system compatibility
- Ensure all dependencies are installed correctly

### Getting Help

If you encounter issues not covered here:

1. **Check system requirements** - Ensure Node.js version compatibility
2. **Run diagnostics** - Use `npm run system-check` for detailed information
3. **Review error messages** - Look for specific error details
4. **Try debug mode** - Use `npm run start:debug` for more information

### Performance Tips

- **Faster builds**: Use `npm run dev` for development with watch mode
- **Clean installs**: Periodically run `npm run clean && npm install` to refresh dependencies
- **System resources**: Close other applications if experiencing performance issues

## Next Steps

Once installation is complete:

1. **[Read the gameplay guide](GAMEPLAY.md)** - Learn how to play Burn Rate
2. **[Learn game mechanics](MECHANICS.md)** - Understand detailed game systems
3. **Start playing** - Run `npm start` to begin your first game
4. **Try different modes** - Experiment with command-line options

### Related Documentation

- **[Gameplay Guide](GAMEPLAY.md)** - Commands, strategy, and how to play
- **[Game Mechanics](MECHANICS.md)** - Detailed system explanations
- **Installation Guide** - You are here

---

**Ready to play?** Run `npm start` and enjoy Burn Rate!