# CallPad Web SDK

A Turborepo monorepo containing the CallPad Web SDK and related packages.

## Project Structure

This monorepo includes the following packages:

### Packages

- `packages/sdk` - CallPad SDK (`vg-x07df`) - Production-ready headless SDK for CallPad audio/video calls
- `examples/demo` - Demo application showcasing CallPad SDK features

### Tools & Configuration

- **Turborepo** for build orchestration and monorepo management
- **pnpm** as the package manager
- **TypeScript** for type checking
- **Biome** for code linting and formatting
- **Changesets** for version management and publishing

## Getting Started

### Prerequisites

- Node.js ≥18
- pnpm ≥9.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run type checking
pnpm check-types

# Run linting
pnpm lint
```

### Development

```bash
# Start development mode
pnpm dev

# Start development for SDK only
pnpm dev --filter=vg-x07df

# Start demo application
pnpm dev --filter=callpad-demo
```

### Building

```bash
# Build all packages
pnpm build

# Build SDK only
pnpm build --filter=vg-x07df

# Build with type checking
pnpm build && pnpm check-types
```

## Publishing Packages

This project uses [Changesets](https://github.com/changesets/changesets) for version management and publishing. The main publishable package is the CallPad SDK (`vg-x07df`).

### Prerequisites for Publishing

1. **NPM Authentication**: Ensure you have npm access and authentication configured
   ```bash
   npm login
   # or set NPM_TOKEN in your .env file
   ```

2. **Environment Setup**: Create a `.env` file in the root with your npm token:
   ```bash
   NPM_TOKEN=your_npm_token_here
   ```

### Publishing Workflow

#### 1. Create a Changeset

When you make changes that should be included in the next release, create a changeset:

```bash
# Create a new changeset (interactive)
pnpm changeset
```

This will:
- Prompt you to select which packages to include
- Ask for the type of change (major, minor, patch)
- Request a summary of the changes

#### 2. Version Packages

When you're ready to release, update package versions based on changesets:

```bash
# Process changesets and bump versions
pnpm version
```

This will:
- Update package.json versions according to changesets
- Update CHANGELOG.md files
- Remove processed changeset files

#### 3. Publish to npm

Publish the updated packages:

```bash
# Build, type-check, and publish to npm
pnpm publish

# Or test the publishing process first
pnpm publish:dry
```

This command:
- Builds only the SDK package (`--filter=vg-x07df`)
- Runs type checking to ensure code quality
- Publishes to npm registry with proper authentication

### Changeset Types

- **Patch** (`1.0.0 → 1.0.1`): Bug fixes, small updates
- **Minor** (`1.0.0 → 1.1.0`): New features, backward-compatible changes
- **Major** (`1.0.0 → 2.0.0`): Breaking changes

### Example Publishing Flow

```bash
# 1. Make your changes to the SDK
# 2. Create a changeset
pnpm changeset
# Select packages: vg-x07df
# Change type: patch/minor/major
# Summary: "Add new useCallQuality hook"

# 3. Commit your changes
git add .
git commit -m "feat: add useCallQuality hook"

# 4. When ready to release, process changesets
pnpm version

# 5. Publish to npm
pnpm publish

# 6. Push the version changes
git push && git push --tags
```

### CI/CD Publishing

The Azure pipeline (`.azure-pipelines/publish.yml`) automatically publishes when:
- Changes are pushed to the `main` branch
- The `NPM_TOKEN` environment variable is configured in Azure DevOps

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
