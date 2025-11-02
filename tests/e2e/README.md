# Playwright E2E Testing

This directory contains end-to-end tests for the Routstr Chat application using Playwright.

## Setup

First, install Playwright browsers:

```bash
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run specific test suites
```bash
# Topup flow tests only
npm run test:e2e:onboarding

# Basic features tests only
npm run test:e2e:features
```

### Debug tests
```bash
npm run test:e2e:debug
```

## Test Structure

- `onboarding.spec.ts` - Tests for the topup/lightning payment flow
- `basic-features.spec.ts` - Tests for basic UI features (chat input, model selection, etc.)
- `utils/test-helpers.ts` - Shared helper functions for tests

## Test Coverage

### Topup Flow Tests
- ✅ Topup prompt modal display when balance is zero
- ✅ Quick amount buttons (500, 1000, 5000 sats)
- ✅ Custom amount input field
- ✅ Creating invoice with quick amounts
- ✅ Creating invoice with custom amount
- ✅ Creating invoice with Enter key
- ✅ QR code display after invoice creation
- ✅ Waiting for payment message
- ✅ Modal close functionality
- ✅ Error handling for invalid amounts
- ✅ Responsive layout on mobile

### Basic Features Tests
- ✅ Chat input display and interaction
- ✅ Model selector functionality
- ✅ New chat button
- ✅ Settings button
- ✅ Message sending (Enter key)
- ✅ Message input (Shift+Enter for new line)
- ✅ Greeting message display
- ✅ Placeholder text
- ✅ Responsive layout
- ✅ File attachment button
- ✅ Send button display

## Configuration

Tests are configured in `playwright.config.ts` at the project root. The configuration:
- Runs tests in parallel by default
- Uses Chromium, Firefox, and WebKit browsers
- Automatically starts the dev server before tests
- Generates HTML reports on failure
- Takes screenshots on failure

## CI/CD

For CI environments, tests will:
- Retry failed tests up to 2 times
- Run with a single worker (no parallel execution)
- Use the `PLAYWRIGHT_BASE_URL` environment variable if set

## Notes

- Tests require the app to be running (automatically started by Playwright)
- Tests clear localStorage before each test to ensure clean state
- Topup tests check for modal visibility and may skip if balance is not zero or user is not authenticated
- Some tests may need authentication to fully pass (currently tests handle both authenticated and unauthenticated states)

