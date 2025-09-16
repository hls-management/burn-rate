#!/bin/bash

# Burn Rate Deployment Script
# This script builds and prepares both CLI and web versions for deployment

set -e  # Exit on any error

echo "🚀 Starting Burn Rate deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Parse command line arguments
BUILD_TYPE="all"
SKIP_TESTS=false
PRODUCTION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --cli-only)
            BUILD_TYPE="cli"
            shift
            ;;
        --web-only)
            BUILD_TYPE="web"
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --production)
            PRODUCTION=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --cli-only      Build only CLI version"
            echo "  --web-only      Build only web version"
            echo "  --skip-tests    Skip running tests"
            echo "  --production    Build for production (optimized)"
            echo "  -h, --help      Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Set environment for production builds
if [ "$PRODUCTION" = true ]; then
    export NODE_ENV=production
    print_status "Building for production environment"
else
    export NODE_ENV=development
    print_status "Building for development environment"
fi

# Clean previous builds
print_status "Cleaning previous builds..."
npm run clean

# Run tests unless skipped
if [ "$SKIP_TESTS" = false ]; then
    print_status "Running tests..."
    npm test
    print_success "Tests passed"
else
    print_warning "Skipping tests"
fi

# Build based on type
case $BUILD_TYPE in
    "cli")
        print_status "Building CLI version only..."
        npm run build:cli
        print_success "CLI build completed"
        ;;
    "web")
        print_status "Building web version only..."
        npm run build:web
        print_success "Web build completed"
        ;;
    "all")
        print_status "Building both CLI and web versions..."
        npm run build
        print_success "All builds completed"
        ;;
esac

# Verify builds
print_status "Verifying builds..."

# Check CLI build
if [ "$BUILD_TYPE" = "cli" ] || [ "$BUILD_TYPE" = "all" ]; then
    if [ -f "dist/cli.js" ]; then
        print_success "CLI build verified: dist/cli.js exists"
    else
        print_error "CLI build failed: dist/cli.js not found"
        exit 1
    fi
fi

# Check web build
if [ "$BUILD_TYPE" = "web" ] || [ "$BUILD_TYPE" = "all" ]; then
    if [ -f "dist/web/index.html" ]; then
        print_success "Web build verified: dist/web/index.html exists"
    else
        print_error "Web build failed: dist/web/index.html not found"
        exit 1
    fi
fi

# Create deployment info
print_status "Creating deployment info..."
cat > dist/deployment-info.json << EOF
{
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "buildType": "$BUILD_TYPE",
  "environment": "$NODE_ENV",
  "version": "$(node -p "require('./package.json').version")",
  "gitCommit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
}
EOF

# Display build summary
print_status "Build Summary:"
echo "  Build Type: $BUILD_TYPE"
echo "  Environment: $NODE_ENV"
echo "  Version: $(node -p "require('./package.json').version")"
echo "  Build Date: $(date)"

if [ "$BUILD_TYPE" = "cli" ] || [ "$BUILD_TYPE" = "all" ]; then
    echo "  CLI Size: $(du -h dist/cli.js | cut -f1)"
fi

if [ "$BUILD_TYPE" = "web" ] || [ "$BUILD_TYPE" = "all" ]; then
    echo "  Web Bundle Size: $(du -sh dist/web | cut -f1)"
fi

print_success "🎉 Deployment build completed successfully!"

# Provide next steps
echo ""
print_status "Next steps:"
if [ "$BUILD_TYPE" = "cli" ] || [ "$BUILD_TYPE" = "all" ]; then
    echo "  CLI: Run 'node dist/cli.js' to start the CLI version"
fi
if [ "$BUILD_TYPE" = "web" ] || [ "$BUILD_TYPE" = "all" ]; then
    echo "  Web: Serve the 'dist/web' directory with any static file server"
    echo "       Or run 'npm run preview:web' for local preview"
fi