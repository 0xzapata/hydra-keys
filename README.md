# 🐉 hydra-keys

> Secure, extensible CLI tool for managing API keys across multiple providers.

## Overview

`hydra-keys` automates internal API key provisioning with secure storage and an extensible plugin system. Built with oclif and TypeScript.

## Features

- 🔐 **Secure Storage**: Service keys stored in OS keychain via `@postman/node-keytar`
- 🔌 **Extensible Plugins**: Easy-to-create provider plugins
- 📊 **Human-Readable Output**: Clean tables with optional JSON output
- ⚙️ **Interactive Setup**: Guided configuration prompts
- 🚀 **Built-in Providers**: OpenRouter, Convex (with more to come)

## Quick Start

```bash
# Install
npm install -g hydra-keys

# Initialize
hydra-keys init

# Add a provider (interactive)
hydra-keys provider add openrouter

# Create a key
hydra-keys key create openrouter --name "Production Key" --limit 500

# List keys
hydra-keys key list openrouter
```

## Installation

```bash
# Global installation
npm install -g hydra-keys

# Or use npx
npx hydra-keys [command]
```

## Commands

### Provider Management

```bash
hydra-keys provider list          # List all available providers
hydra-keys provider status        # Show configured providers
hydra-keys provider add <name>   # Configure a provider
hydra-keys provider remove <name> # Remove a provider
```

### Key Management

```bash
hydra-keys key list <provider>                # List keys
hydra-keys key create <provider>              # Create a key
  --name <name>                              # Key name (required)
  --limit <amount>                           # Spending/usage limit
  --reset <daily|weekly|monthly>             # Limit reset period
  --expires <date>                          # Expiration date (ISO 8601)
  --output <file>                           # Save to file
hydra-keys key delete <provider> <key-id>     # Delete a key
hydra-keys key export <provider>               # Export to JSON
```

### Configuration

```bash
hydra-keys config show         # Show all config
hydra-keys config get <key>   # Get config value
hydra-keys config set <key> <value>  # Set config value
```

### Plugin Management

```bash
hydra-keys plugin list              # List installed plugins
hydra-keys plugin install <package> # Install npm plugin
hydra-keys plugin uninstall <package> # Uninstall plugin
```

## Built-in Providers

### OpenRouter

Full support for:
- ✅ Creating API keys with limits
- ✅ Setting expiration dates
- ✅ Listing and deleting keys

Requirements: Provisioning API Key

### Convex

Full support for:
- ✅ Creating deploy keys
- ✅ Listing deployments
- ✅ Project management

Requirements: Team Access Token

## Security

- Service keys are **never written to disk**
- All sensitive data stored in OS keychain
- Created keys shown **only once** (save them!)
- Key IDs truncated in lists

## Creating a Provider Plugin

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed guide.

## Development

```bash
# Clone repository
git clone https://github.com/yourusername/hydra-keys.git
cd hydra-keys

# Install dependencies
npm install

# Build
npm run build

# Link for local testing
npm link

# Run tests
npm test
```

## Roadmap

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed roadmap.

## License

MIT License - see LICENSE file for details

## Contributing

Contributions welcome! Please read [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for plugin development guide.
