# Frontend Test Suite

Lightweight test suite for NotificationUI Alpine.js classes using Vitest.

## Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Running Tests

All tests run in Node.js with jsdom (no browser required).

```bash
# Run all tests
npm test

# Run specific test file
npm test NotificationStore

# Run with UI
npm run test:ui
```

## Test Coverage

Current coverage focuses on:
- Store state management
- Broadcasting event handling
- Notification CRUD operations

