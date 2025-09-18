#!/bin/bash

# Pre-commit hook for Speech Teleprompter
# Runs linting, formatting checks, and tests before allowing commits

set -e

echo "🔍 Running pre-commit checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
fi

# Run linting
echo "🔍 Running ESLint..."
if npm run lint; then
    print_status "Linting passed"
else
    print_error "Linting failed. Please fix the issues above."
    exit 1
fi

# Check formatting
echo "🎨 Checking code formatting..."
if npm run format:check; then
    print_status "Code formatting is correct"
else
    print_error "Code formatting issues found. Run 'npm run format' to fix them."
    exit 1
fi

# Run tests
echo "🧪 Running tests..."
if npm run test:ci; then
    print_status "All tests passed"
else
    print_error "Tests failed. Please fix the failing tests."
    exit 1
fi

# Check for TODO/FIXME comments in production code
echo "📝 Checking for TODO/FIXME comments..."
TODO_COUNT=$(grep -r "TODO\|FIXME" js/ --exclude-dir=__tests__ --exclude-dir=node_modules | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
    print_warning "Found $TODO_COUNT TODO/FIXME comments in production code:"
    grep -r "TODO\|FIXME" js/ --exclude-dir=__tests__ --exclude-dir=node_modules
    echo ""
    read -p "Do you want to continue with the commit? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Commit cancelled due to TODO/FIXME comments."
        exit 1
    fi
fi

# Check for console.log statements in production code
echo "🔍 Checking for console.log statements..."
CONSOLE_COUNT=$(grep -r "console\.log\|console\.debug" js/ --exclude-dir=__tests__ --exclude-dir=node_modules | wc -l)
if [ "$CONSOLE_COUNT" -gt 0 ]; then
    print_warning "Found $CONSOLE_COUNT console.log/debug statements in production code:"
    grep -r "console\.log\|console\.debug" js/ --exclude-dir=__tests__ --exclude-dir=node_modules
    echo ""
    read -p "Do you want to continue with the commit? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Commit cancelled due to console statements."
        exit 1
    fi
fi

# Check file sizes
echo "📏 Checking file sizes..."
LARGE_FILES=$(find js/ -name "*.js" -size +100k | wc -l)
if [ "$LARGE_FILES" -gt 0 ]; then
    print_warning "Found large files (>100KB):"
    find js/ -name "*.js" -size +100k
    echo ""
fi

# Check for sensitive data
echo "🔒 Checking for potential sensitive data..."
SENSITIVE_PATTERNS=("password" "secret" "key" "token" "api_key")
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if grep -r -i "$pattern" js/ --exclude-dir=__tests__ --exclude-dir=node_modules | grep -v "//.*$pattern" | grep -v "test.*$pattern"; then
        print_warning "Potential sensitive data found with pattern: $pattern"
    fi
done

# Final success message
print_status "All pre-commit checks passed! 🎉"
echo ""
echo "🚀 Ready to commit!"
echo ""
echo "💡 Tips:"
echo "   - Run 'npm run test:watch' for continuous testing during development"
echo "   - Run 'npm run lint:fix' to automatically fix linting issues"
echo "   - Run 'npm run format' to format your code"
echo ""

exit 0
