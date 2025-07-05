# YouTubeTrim CLI

A TypeScript CLI tool for YouTube trimming functionality.

## Installation

```bash
npm install
```

## Development

Build the TypeScript code:

```bash
npm run build
```

Run in development mode with watch:

```bash
npm run dev
```

## Usage

Run the CLI tool:

```bash
node dist/index.js [command]
```

### Available Commands

- `hello` - Say hello world
- `--help` - Show help information
- `--version` - Show version information

### Example

```bash
node dist/index.js hello
# Output: Hello, World! Welcome to YouTubeTrim CLI!
```

## Project Structure

- `src/index.ts` - Main CLI entry point
- `dist/` - Compiled JavaScript output
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
