# AI Document RAG Client

This is the Angular client application for the AI Document RAG system.

## Prerequisites

- Node.js 18.0.0 or higher
- Yarn 4.0.0 or higher

## Getting Started

### Install Dependencies

```bash
# Install dependencies using Yarn
yarn install

# Or clean install if you have issues
yarn install:clean
```

### Development

```bash
# Start development server
yarn start
# or
yarn dev
# or
yarn serve

# Build the application
yarn build

# Watch mode for development
yarn watch

# Run tests
yarn test
```

### Code Quality

```bash
# Lint the code
yarn lint

# Fix linting issues
yarn lint:fix

# Format code
yarn format

# Check code formatting
yarn format:check
```

### Maintenance

```bash
# Check for outdated packages
yarn outdated

# Update packages interactively
yarn update

# Audit dependencies for security issues
yarn audit

# Fix security issues automatically
yarn audit:fix

# Clean build artifacts
yarn clean
```

## Yarn Configuration

This project is configured to use Yarn 4 with the following features:

- **Node modules linker**: Uses traditional node_modules structure
- **Global cache**: Enables faster installations
- **TypeScript plugin**: Better TypeScript support
- **Hoisting limits**: Prevents dependency conflicts

## Project Structure

```
src/
├── app/
│   ├── components/          # Angular components
│   ├── services/           # Angular services
│   ├── app.component.ts    # Main app component
│   └── app.module.ts       # Main app module
├── assets/                 # Static assets
└── styles.css             # Global styles
```

## Available Scripts

- `yarn start` - Start development server
- `yarn build` - Build for production
- `yarn test` - Run unit tests
- `yarn lint` - Run linting
- `yarn format` - Format code with Prettier
- `yarn clean` - Clean build artifacts
- `yarn update` - Update dependencies interactively
- `yarn audit` - Check for security vulnerabilities

## Troubleshooting

If you encounter issues:

1. Clear Yarn cache: `yarn cache clean`
2. Remove node_modules: `rm -rf node_modules`
3. Clean install: `yarn install:clean`
4. Check Node.js version: `node --version`
5. Check Yarn version: `yarn --version`
