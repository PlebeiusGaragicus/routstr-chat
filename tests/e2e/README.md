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

### Run specific test file

```bash
# Run the main E2E flow tests
npm run test:e2e tests/e2e/e2e-flow.spec.ts
```

### Debug tests

```bash
npm run test:e2e:debug
```

## Test Structure

- `e2e-flow.spec.ts` - Comprehensive end-to-end tests covering topup flow, modal interactions, and token/wallet features
- `utils/test-helpers.ts` - Shared helper functions for tests

## Test Coverage

### Topup Modal Tests

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

### Modal Tabs Tests

- ✅ Tab display (Lightning, Token, Wallet)
- ✅ Switching between tabs
- ✅ Token tab content display
- ✅ Wallet tab content display

### Token Tab Tests

- ✅ Token input field display
- ✅ Paste button functionality
- ✅ Pasting token into textarea
- ✅ Receive button enable/disable state
- ✅ Pasting token from clipboard via paste button
- ✅ Receiving token functionality

### Wallet Tab Tests

- ✅ Wallet tab content display
- ✅ Connect wallet button display

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
- Tests initialize the mint in localStorage before running to ensure proper setup
- Topup modal tests check for modal visibility and may skip if balance is not zero or user is not authenticated
- Tests handle both authenticated and unauthenticated states gracefully
- Some tests verify UI feedback states (loading, success, error) rather than requiring actual API success
- Token tests use a real Cashu token for testing token receipt functionality
