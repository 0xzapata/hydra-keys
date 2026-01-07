# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-07

### Added

#### CLI Framework

- Oclif-based CLI with TypeScript support
- Interactive prompts via inquirer
- Colorized output with chalk
- Command structure with topics: `provider`, `key`, `config`, `storage`, `plugin`

#### Provider System

- Extensible plugin architecture for provider integrations
- Lazy initialization for fast CLI startup
- **OpenRouter** provider with full API key management
  - Create keys with spending limits and reset periods
  - List, delete, and export keys
  - Direct link to API keys page during setup
- **Convex** provider for deploy key management
  - Create and list deploy keys
  - Project-based key organization

#### Secure Storage

- OS keychain integration via `@postman/node-keytar`
- Service keys never written to disk
- Storage backend abstraction (keychain/encrypted-file)
- Storage status and migration commands

#### Key Management Commands

- `hydra-keys key create <provider>` - Create new API keys with options:
  - `--name` - Key name (required)
  - `--limit` - Spending/usage limit
  - `--reset` - Limit reset period (daily/weekly/monthly)
  - `--expires` - Expiration date (ISO 8601)
  - `--output` - Save key to file
- `hydra-keys key list <provider>` - List all keys
- `hydra-keys key delete <provider> <key-id>` - Delete a key
- `hydra-keys key export <provider>` - Export keys to JSON

#### Provider Management Commands

- `hydra-keys provider` - List available providers
- `hydra-keys provider add <name>` - Configure a provider with API key
- `hydra-keys provider remove <name>` - Remove provider configuration

#### Configuration Commands

- `hydra-keys init` - Initialize CLI configuration
- `hydra-keys config show` - Display all configuration
- `hydra-keys config get <key>` - Get specific config value
- `hydra-keys config set <key> <value>` - Set config value

#### Storage Commands

- `hydra-keys storage status` - Show storage backend status
- `hydra-keys storage migrate` - Migrate between storage backends

#### Plugin Commands

- `hydra-keys plugin` - List installed plugins
- `hydra-keys plugin install <package>` - Install npm plugin
- `hydra-keys plugin uninstall <package>` - Uninstall plugin

### Security

- Service/admin API keys stored securely in OS keychain
- Created keys shown only once (save immediately)
- Key IDs truncated in list views for security

### Developer Experience

- TypeScript with strict mode
- Zod schema validation for configuration
- ESLint configuration
- Jest test framework configured

[0.1.0]: https://github.com/0xzapata/hydra-keys/releases/tag/v0.1.0
