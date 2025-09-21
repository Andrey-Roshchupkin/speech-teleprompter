#!/bin/bash

# Test runner script for Speech Teleprompter
# Provides easy commands to run different types of tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
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

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  all          Run all tests with coverage"
    echo "  unit         Run unit tests only"
    echo "  integration  Run integration tests only"
    echo "  watch        Run tests in watch mode"
    echo "  coverage     Run tests with coverage report"
    echo "  ci           Run tests in CI mode (no watch)"
    echo "  lint         Run linting only"
    echo "  format       Check code formatting"
    echo "  fix          Fix linting and formatting issues"
    echo "  clean        Clean test artifacts"
    echo "  help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 all       # Run all tests with coverage"
    echo "  $0 watch     # Run tests in watch mode"
    echo "  $0 fix       # Fix linting and formatting"
}

# Function to run unit tests
run_unit_tests() {
    print_info "Running unit tests..."
    npm run test -- --testPathPattern="__tests__" --testPathIgnorePatterns="managers"
}

# Function to run integration tests
run_integration_tests() {
    print_info "Running integration tests..."
    npm run test -- --testPathPattern="managers"
}

# Function to run all tests
run_all_tests() {
    print_info "Running all tests with coverage..."
    npm run test:coverage
}

# Function to run tests in watch mode
run_watch_tests() {
    print_info "Running tests in watch mode..."
    npm run test:watch
}

# Function to run tests in CI mode
run_ci_tests() {
    print_info "Running tests in CI mode..."
    npm run test:ci
}

# Function to run linting
run_lint() {
    print_info "Running ESLint..."
    npm run lint
}

# Function to check formatting
run_format_check() {
    print_info "Checking code formatting..."
    npm run format:check
}

# Function to fix issues
run_fix() {
    print_info "Fixing linting and formatting issues..."
    npm run lint:fix
    npm run format
    print_status "Fixed linting and formatting issues"
}

# Function to clean test artifacts
run_clean() {
    print_info "Cleaning test artifacts..."
    rm -rf coverage/
    rm -rf .nyc_output/
    rm -rf test-results.xml
    print_status "Cleaned test artifacts"
}

# Function to check dependencies
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Installing dependencies..."
        npm install
    fi
}

# Main script logic
main() {
    local command=${1:-"help"}
    
    case $command in
        "all")
            check_dependencies
            run_all_tests
            ;;
        "unit")
            check_dependencies
            run_unit_tests
            ;;
        "integration")
            check_dependencies
            run_integration_tests
            ;;
        "watch")
            check_dependencies
            run_watch_tests
            ;;
        "coverage")
            check_dependencies
            run_all_tests
            ;;
        "ci")
            check_dependencies
            run_ci_tests
            ;;
        "lint")
            check_dependencies
            run_lint
            ;;
        "format")
            check_dependencies
            run_format_check
            ;;
        "fix")
            check_dependencies
            run_fix
            ;;
        "clean")
            run_clean
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
