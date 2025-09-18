# Testing Guide for Speech Teleprompter

This document explains how to run tests, understand the testing infrastructure, and contribute to the test suite.

## 🧪 Testing Infrastructure

The project uses **Jest** as the testing framework with the following setup:

- **Test Environment**: jsdom (simulates browser environment)
- **Coverage Reports**: HTML, LCOV, and text formats
- **Mocking**: Comprehensive mocks for browser APIs
- **CI/CD**: Automated testing via GitHub Actions

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
npm install
```

### Running Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests in CI mode
npm run test:ci

# Run tests with coverage report
npm run test:coverage
```

### Using the Test Scripts

We provide convenient shell scripts for common testing tasks:

```bash
# Run all tests with coverage
./scripts/run-tests.sh all

# Run only unit tests
./scripts/run-tests.sh unit

# Run only integration tests
./scripts/run-tests.sh integration

# Run tests in watch mode
./scripts/run-tests.sh watch

# Fix linting and formatting issues
./scripts/run-tests.sh fix

# Clean test artifacts
./scripts/run-tests.sh clean
```

## 📁 Test Structure

```
js/
├── __tests__/                    # Unit tests
│   ├── test-utils.js            # Test utilities and helpers
│   ├── fuzzy-matcher.test.js    # FuzzyMatcher unit tests
│   ├── speech-recognition.test.js # SpeechRecognition unit tests
│   ├── log-manager.test.js      # LogManager unit tests
│   ├── local-storage.test.js    # LocalStorageManager unit tests
│   └── managers/                # Manager integration tests
│       └── display-manager.test.js
├── managers/                     # Manager classes
└── core/                        # Core functionality
```

## 🧩 Test Categories

### Unit Tests
- **Location**: `js/__tests__/*.test.js`
- **Purpose**: Test individual modules in isolation
- **Coverage**: Core algorithms, utilities, and business logic

### Integration Tests
- **Location**: `js/__tests__/managers/*.test.js`
- **Purpose**: Test interactions between modules
- **Coverage**: Manager interactions, state management, DOM operations

## 🛠️ Test Utilities

### Mock Objects

The test suite includes comprehensive mocks for:

- **Web Speech API**: `SpeechRecognition`, `webkitSpeechRecognition`
- **Document Picture-in-Picture API**: `documentPictureInPicture`
- **Browser Storage**: `localStorage`, `sessionStorage`
- **DOM APIs**: `requestAnimationFrame`, `performance`
- **Console Methods**: All console logging functions

### Helper Functions

```javascript
import { 
  createMockElement, 
  createMockSpeechEvent, 
  waitFor, 
  simulateInput 
} from './test-utils.js';

// Create mock DOM elements
const element = createMockElement('div', { id: 'test' });

// Create mock speech recognition events
const event = createMockSpeechEvent('hello world', true, 0.9);

// Wait for conditions
await waitFor(() => condition === true, 1000);

// Simulate user input
simulateInput(inputElement, 'new value');
```

## 📊 Coverage Reports

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML coverage report
open coverage/lcov-report/index.html
```

### Coverage Targets

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## 🔧 Configuration

### Jest Configuration

The Jest configuration is in `package.json`:

```json
{
  "jest": {
    "testEnvironment": "jsdom",
    "transform": {
      "^.+\\.js$": "babel-jest"
    },
    "collectCoverageFrom": [
      "js/**/*.js",
      "!js/**/*.test.js",
      "!js/**/*.spec.js"
    ],
    "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"]
  }
}
```

### ESLint Configuration

```json
{
  "eslintConfig": {
    "env": {
      "browser": true,
      "es2021": true,
      "jest": true
    },
    "extends": ["eslint:recommended", "prettier"],
    "rules": {
      "prettier/prettier": "error",
      "no-unused-vars": "warn"
    }
  }
}
```

## 🚦 Pre-commit Hooks

### Automatic Checks

Before each commit, the following checks run automatically:

1. **Linting**: ESLint checks for code quality
2. **Formatting**: Prettier checks for code formatting
3. **Tests**: All tests must pass
4. **Security**: Check for potential sensitive data
5. **Code Quality**: Check for TODO/FIXME comments

### Manual Pre-commit Check

```bash
# Run pre-commit checks manually
./scripts/pre-commit.sh
```

## 🔄 CI/CD Pipeline

### GitHub Actions

The project uses GitHub Actions for automated testing:

- **Trigger**: Push to main/develop, Pull requests
- **Matrix**: Tests on Node.js 18.x and 20.x
- **Steps**:
  1. Install dependencies
  2. Run linting
  3. Run tests with coverage
  4. Upload coverage reports
  5. Deploy to GitHub Pages (on main branch)

### Workflow Files

- `.github/workflows/test.yml`: Main test workflow
- Automatic deployment to GitHub Pages
- Preview deployments for pull requests

## 📝 Writing Tests

### Test Structure

```javascript
describe('ComponentName', () => {
  let component;
  let mockLogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
    component = new ComponentName(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Method Name', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = component.method(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Best Practices

1. **Test Naming**: Use descriptive test names that explain the scenario
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Mock External Dependencies**: Use mocks for browser APIs and external services
4. **Test Edge Cases**: Include tests for error conditions and edge cases
5. **Keep Tests Fast**: Avoid slow operations in unit tests
6. **One Assertion Per Test**: Focus each test on a single behavior

### Mock Guidelines

```javascript
// Good: Mock external dependencies
const mockLogger = createMockLogger();
const component = new ComponentName(mockLogger);

// Good: Test error conditions
test('should handle errors gracefully', () => {
  localStorage.getItem = jest.fn(() => {
    throw new Error('Storage error');
  });
  
  expect(() => component.loadData()).not.toThrow();
});

// Good: Test edge cases
test('should handle empty input', () => {
  const result = component.process([]);
  expect(result).toEqual([]);
});
```

## 🐛 Debugging Tests

### Running Specific Tests

```bash
# Run tests matching a pattern
npm test -- --testNamePattern="should find exact match"

# Run tests in a specific file
npm test -- fuzzy-matcher.test.js

# Run tests with verbose output
npm test -- --verbose
```

### Debug Mode

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Common Issues

1. **Async Tests**: Use `async/await` or return promises
2. **Timers**: Use `jest.useFakeTimers()` for timer-dependent tests
3. **DOM**: Ensure proper cleanup in `afterEach`
4. **Mocks**: Clear mocks between tests

## 📈 Performance Testing

### Measuring Performance

```javascript
test('should process large datasets efficiently', () => {
  const startTime = performance.now();
  const largeDataset = Array(10000).fill('word');
  
  component.processLargeDataset(largeDataset);
  
  const endTime = performance.now();
  expect(endTime - startTime).toBeLessThan(100); // 100ms limit
});
```

### Memory Testing

```javascript
test('should not leak memory', () => {
  const initialMemory = process.memoryUsage().heapUsed;
  
  // Perform operations that might leak memory
  for (let i = 0; i < 1000; i++) {
    component.createAndDestroy();
  }
  
  const finalMemory = process.memoryUsage().heapUsed;
  expect(finalMemory - initialMemory).toBeLessThan(1024 * 1024); // 1MB limit
});
```

## 🤝 Contributing

### Adding New Tests

1. Create test files in the appropriate directory
2. Follow the existing naming convention (`*.test.js`)
3. Include both positive and negative test cases
4. Update this documentation if adding new test utilities

### Test Requirements

- All new code must have corresponding tests
- Tests must pass in CI environment
- Coverage must not decrease
- Tests must be fast (< 100ms per test)

### Pull Request Process

1. Write tests for new functionality
2. Ensure all tests pass locally
3. Run pre-commit checks
4. Submit pull request
5. CI will run automated tests

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)

## 🆘 Troubleshooting

### Common Problems

**Tests fail in CI but pass locally:**
- Check for environment-specific code
- Ensure all dependencies are in package.json
- Verify file paths are correct

**Coverage reports show 0%:**
- Check Jest configuration
- Verify test files are being discovered
- Ensure source files are included in coverage

**Mock functions not working:**
- Check mock setup in beforeEach
- Verify mock is called with correct arguments
- Ensure mocks are cleared between tests

### Getting Help

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Review existing test examples
3. Ask questions in pull request comments
4. Consult Jest documentation for specific issues
