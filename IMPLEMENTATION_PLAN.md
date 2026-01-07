# 🐉 hydra-keys - Implementation Plan

## Overview

A secure, extensible CLI tool for managing API keys across multiple providers, built with oclif and TypeScript.

## Project Goals

1. **Automate internal API key provisioning** for OpenRouter and Convex
2. **Secure storage** of service/admin keys using OS keychain
3. **Extensible plugin system** for easy provider addition
4. **Human-readable CLI** with optional JSON output
5. **Interactive setup** for provider configuration

---

## 📁 Project Structure

```
hydra-keys/
├── src/
│   ├── commands/              # oclif commands
│   │   ├── init.ts           # Initialize CLI
│   │   ├── provider/         # Provider management
│   │   │   ├── index.ts      # provider list/status
│   │   │   ├── add.ts        # Add provider config
│   │   │   └── remove.ts     # Remove provider config
│   │   ├── key/              # Key management
│   │   │   ├── index.ts      # List keys
│   │   │   ├── create.ts     # Create key
│   │   │   ├── delete.ts     # Delete key
│   │   │   └── export.ts     # Export keys
│   │   ├── storage/          # Storage management
│   │   │   ├── status.ts
│   │   │   └── migrate.ts
│   │   ├── plugin/           # Plugin management
│   │   │   ├── index.ts      # List plugins
│   │   │   ├── install.ts    # Install plugin
│   │   │   └── uninstall.ts  # Uninstall plugin
│   │   ├── config/           # Config management
│   │   │   ├── index.ts      # Show config
│   │   │   ├── get.ts        # Get config value
│   │   │   └── set.ts        # Set config value
│   │   └── index.ts          # Root command
│   │
│   ├── core/                 # Core business logic
│   │   ├── plugin-system.ts  # Plugin registration & discovery
│   │   ├── provider-registry.ts # Provider management
│   │   └── key-manager.ts    # High-level key operations
│   │
│   ├── storage/              # Secure storage layer
│   │   ├── index.ts          # Storage interface
│   │   ├── keychain-storage.ts # keytar implementation
│   │   └── encrypted-storage.ts # Encrypted file fallback
│   │
│   ├── providers/            # Built-in providers
│   │   ├── base.ts           # Base provider interface
│   │   ├── openrouter.ts     # OpenRouter provider
│   │   └── convex.ts         # Convex provider
│   │
│   ├── config/               # Configuration management
│   │   ├── index.ts          # Config loader/saver
│   │   └── schema.ts         # Config validation
│   │
│   ├── output/               # Output formatting
│   │   ├── formatters.ts     # Human-readable formatters
│   │   └── tables.ts         # Table display utilities
│   │
│   └── utils/                # Utilities
│       ├── prompts.ts        # Interactive prompts
│       ├── validators.ts     # Input validation
│       └── logger.ts         # Logging utilities
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── package.json
├── tsconfig.json
├── oclif.manifest.json
├── README.md
└── LICENSE
```

---

## 🔧 Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **CLI Framework** | oclif | ^3.0 | Command structure & lifecycle |
| **Language** | TypeScript | ^5.0 | Type safety & dev experience |
| **Storage** | @postman/node-keytar | ^7.9 | System keychain access |
| **Prompts** | inquirer | ^9.0 | Interactive CLI prompts |
| **Tables** | cli-table3 | ^0.6 | Human-readable tables |
| **Colors** | chalk | ^5.0 | Terminal colors |
| **Validation** | zod | ^3.22 | Schema validation |
| **HTTP** | axios | ^1.6 | API requests |

---

## 🏗️ Core Architecture

### 1. Provider Interface

```typescript
// src/providers/base.ts
export interface Provider {
  name: string;                           // e.g., "openrouter"
  displayName: string;                    // e.g., "OpenRouter"
  version: string;

  // Core operations
  createKey(options: CreateKeyOptions): Promise<KeyResult>;
  listKeys(): Promise<KeyResult[]>;
  validateConfig(config: ProviderConfig): Promise<ValidationResult>;

  // Optional operations
  deleteKey?(keyId: string): Promise<void>;
  getKeyDetails?(keyId: string): Promise<KeyDetails>;
}

export interface CreateKeyOptions {
  name: string;
  limit?: number;
  limitReset?: 'daily' | 'weekly' | 'monthly';
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface KeyResult {
  id: string;                             // Truncated/hash ID
  name: string;
  key: string;                            // Full key (shown once)
  createdAt: Date;
  expiresAt?: Date;
  limit?: number;
  limitReset?: string;
  metadata?: Record<string, any>;
}

export interface ProviderConfig {
  serviceKey: string;                     // Stored in keychain
  endpoint?: string;
  teamId?: string;
  projectId?: string;
  [key: string]: any;
}
```

### 2. Plugin System

```typescript
// src/core/plugin-system.ts
class PluginSystem {
  private providers: Map<string, Provider> = new Map();

  // Register a provider
  register(provider: Provider): void {
    if (this.providers.has(provider.name)) {
      throw new Error(`Provider ${provider.name} already registered`);
    }
    this.providers.set(provider.name, provider);
  }

  // Get provider by name
  get(name: string): Provider | undefined {
    return this.providers.get(name);
  }

  // List all providers
  list(): Provider[] {
    return Array.from(this.providers.values());
  }

  // Discover external plugins from npm
  async discoverExternalPlugins(): Promise<string[]> {
    // Scan for hydra-keys-provider-* packages
    // Load from ~/.hydra-keys/plugins/
  }
}

// Global instance
export const pluginSystem = new PluginSystem();

// Registration helper
export function registerProvider(provider: Provider): void {
  pluginSystem.register(provider);
}
```

### 3. Secure Storage Layer

```typescript
// src/storage/index.ts
export interface StorageBackend {
  store(key: string, value: string): Promise<void>;
  retrieve(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
}

// src/storage/keychain-storage.ts
export class KeychainStorage implements StorageBackend {
  private serviceName = 'hydra-keys';

  async store(key: string, value: string): Promise<void> {
    const keytar = await import('@postman/node-keytar');
    await keytar.setPassword(this.serviceName, key, value);
  }

  async retrieve(key: string): Promise<string | null> {
    const keytar = await import('@postman/node-keytar');
    return await keytar.getPassword(this.serviceName, key);
  }

  async delete(key: string): Promise<void> {
    const keytar = await import('@postman/node-keytar');
    await keytar.deletePassword(this.serviceName, key);
  }

  async list(): Promise<string[]> {
    const keytar = await import('@postman/node-keytar');
    return await keytar.findCredentials(this.serviceName)
      .then(creds => creds.map(c => c.account));
  }
}
```

### 4. Configuration Management

```typescript
// src/config/schema.ts
import { z } from 'zod';

export const configSchema = z.object({
  version: z.string().default('1'),
  storage: z.object({
    backend: z.enum(['keychain', 'encrypted-file']).default('keychain'),
  }),
  providers: z.record(z.object({
    configured: z.boolean(),
    serviceKeyId: z.string(),
    config: z.record(z.any()).optional(),
  })),
  plugins: z.array(z.string()).default([]),
  defaults: z.object({
    provider: z.string().optional(),
    keyLimit: z.number().optional(),
    limitReset: z.enum(['daily', 'weekly', 'monthly']).optional(),
  }).optional(),
});

export type Config = z.infer<typeof configSchema>;
```

---

## 📋 CLI Command Structure

### Root Command

```bash
hydra-keys [command] [options]
```

### Available Commands

```
init                          Initialize configuration
provider                      Manage providers
  list                        List available providers
  status                      Show configured providers
  add <provider>              Configure a provider (interactive)
  remove <provider>           Remove a provider

key                           Manage API keys
  list <provider>             List keys for a provider
  create <provider>           Create a new key
    --name <name>            Key name (required)
    --limit <amount>         Spending/usage limit
    --reset <period>         daily|weekly|monthly
    --expires <date>         Expiration date (ISO 8601)
    --output <file>          Save to file instead of stdout
  delete <provider> <key>     Delete a key
  export <provider>           Export keys to JSON
    --output <file>          Output file

storage                       Manage secure storage
  status                      Show storage status
  migrate                     Migrate between storage backends

plugin                        Manage plugins
  list                        List installed plugins
  install <package>           Install npm plugin
  uninstall <package>         Uninstall plugin

config                        Configuration
  show                        Show all config
  get <key>                  Get a config value
  set <key> <value>          Set a config value
```

---

## 🎨 Output Format (Human-Readable)

### Key List Example

```
$ hydra-keys key list openrouter

OpenRouter Keys
═══════════════

Key Name      ID              Created          Expires         Limit    Status
───────────── ─────────────── ──────────────── ─────────────── ──────── ─────────
Production    sk-or-••••abc1   Jan 5, 2025      -               $500     Active
Dev           sk-or-••••xyz2   Jan 7, 2025      Feb 7, 2025      $100     Active
Test          sk-or-••••def3   Dec 15, 2024    -               $50      Expiring soon

Total: 3 keys
```

### Key Creation Example

```
$ hydra-keys key create openrouter --name "CI/CD Pipeline" --limit 200 --reset monthly

✓ Key created successfully!

Name:           CI/CD Pipeline
Key:            sk-or-1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
Limit:          $200/month
Expires:        Never

⚠  Save this key now - it won't be shown again!

Or export to file:
$ hydra-keys key create openrouter --name "CI/CD" --output ./secrets.json
```

### JSON Output Option

```
$ hydra-keys key list openrouter --json

{
  "provider": "openrouter",
  "keys": [
    {
      "id": "sk-or-abc123",
      "name": "Production",
      "createdAt": "2025-01-05T00:00:00Z",
      "limit": 500,
      "limitReset": null,
      "status": "active"
    }
  ],
  "total": 1
}
```

---

## 🔐 Security Features

1. **Service Keys**: Never written to disk, stored in OS keychain via `@postman/node-keytar`
2. **Key Truncation**: Lists show only first/last 4 characters
3. **Single Display**: Created keys shown once, then cleared from memory
4. **Audit Logging**: Optional audit trail of key operations
5. **Encryption**: Encrypted file fallback uses AES-256-GCM with PBKDF2
6. **Environment Override**: Support for `HYDRA_KEYS_<PROVIDER>_KEY` for CI/CD

---

## 🚀 Initial Provider Implementations

### OpenRouter Provider

```typescript
// src/providers/openrouter.ts
import axios from 'axios';
import { Provider, CreateKeyOptions, KeyResult, ProviderConfig } from './base';

export const openrouterProvider: Provider = {
  name: 'openrouter',
  displayName: 'OpenRouter',
  version: '1.0.0',

  async createKey(options: CreateKeyOptions): Promise<KeyResult> {
    const config = this.getConfig();
    const response = await axios.post(
      'https://openrouter.ai/api/v1/keys',
      {
        name: options.name,
        limit: options.limit,
        limit_reset: options.limitReset,
        expires_at: options.expiresAt?.toISOString(),
      },
      {
        headers: {
          'Authorization': `Bearer ${config.serviceKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      id: response.data.data.id,
      name: response.data.data.name,
      key: response.data.data.key,
      createdAt: new Date(response.data.data.created_at),
      expiresAt: response.data.data.expires_at
        ? new Date(response.data.data.expires_at)
        : undefined,
      limit: response.data.data.limit,
    };
  },

  async listKeys(): Promise<KeyResult[]> {
    const config = this.getConfig();
    const response = await axios.get(
      'https://openrouter.ai/api/v1/keys',
      {
        headers: {
          'Authorization': `Bearer ${config.serviceKey}`,
        },
      }
    );

    return response.data.data.map((key: any) => ({
      id: key.id,
      name: key.name,
      key: '••••', // Truncated in list
      createdAt: new Date(key.created_at),
      expiresAt: key.expires_at ? new Date(key.expires_at) : undefined,
      limit: key.limit,
    }));
  },

  async deleteKey(keyId: string): Promise<void> {
    const config = this.getConfig();
    await axios.delete(
      `https://openrouter.ai/api/v1/keys/${keyId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.serviceKey}`,
        },
      }
    );
  },

  async validateConfig(config: ProviderConfig): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await axios.get(
        'https://openrouter.ai/api/v1/keys',
        {
          headers: {
            'Authorization': `Bearer ${config.serviceKey}`,
          },
          timeout: 5000,
        }
      );
      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
};
```

### Convex Provider

```typescript
// src/providers/convex.ts
import axios from 'axios';
import { Provider, CreateKeyOptions, KeyResult, ProviderConfig } from './base';

export const convexProvider: Provider = {
  name: 'convex',
  displayName: 'Convex',
  version: '1.0.0',

  async createKey(options: CreateKeyOptions): Promise<KeyResult> {
    const config = this.getConfig();
    const response = await axios.post(
      `https://api.convex.dev/v1/deployments/${config.projectId}/create_deploy_key`,
      {},
      {
        headers: {
          'Authorization': `Convex ${config.serviceKey}`,
        },
      }
    );

    const deployKey = response.data.deployKey;
    return {
      id: deployKey,
      name: options.name,
      key: deployKey,
      createdAt: new Date(),
    };
  },

  async listKeys(): Promise<KeyResult[]> {
    const config = this.getConfig();
    // List deployments and their deploy keys
    const response = await axios.get(
      `https://api.convex.dev/v1/deployments`,
      {
        headers: {
          'Authorization': `Convex ${config.serviceKey}`,
        },
      }
    );

    return response.data.deployments.map((deployment: any) => ({
      id: deployment.deployKey || deployment.id,
      name: deployment.name,
      key: '••••',
      createdAt: new Date(),
    }));
  },

  async validateConfig(config: ProviderConfig): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await axios.get(
        'https://api.convex.dev/v1/projects',
        {
          headers: {
            'Authorization': `Convex ${config.serviceKey}`,
          },
          timeout: 5000,
        }
      );
      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
};
```

---

## 🔌 Plugin System for External Providers

### Creating an External Plugin

```typescript
// npm package: hydra-keys-provider-anthropic
// package.json
{
  "name": "hydra-keys-provider-anthropic",
  "version": "1.0.0",
  "main": "dist/index.js",
  "keywords": ["hydra-keys", "provider", "anthropic"],
  "peerDependencies": {
    "hydra-keys": "^1.0.0"
  }
}

// src/index.ts
import { Provider, CreateKeyOptions, KeyResult, ProviderConfig } from 'hydra-keys';

export const anthropicProvider: Provider = {
  name: 'anthropic',
  displayName: 'Anthropic',
  version: '1.0.0',

  async createKey(options: CreateKeyOptions): Promise<KeyResult> {
    // Implementation for Anthropic's API key management
    // If they don't have programmatic key creation, this would be a placeholder
    throw new Error('Anthropic does not support programmatic key creation');
  },

  async listKeys(): Promise<KeyResult[]> {
    // Implementation
    return [];
  },

  async validateConfig(config: ProviderConfig): Promise<{ valid: boolean; error?: string }> {
    // Validate service key
    return { valid: true };
  },
};

// Auto-register on import
import { registerProvider } from 'hydra-keys';
registerProvider(anthropicProvider);
```

### Plugin Installation

```bash
$ hydra-keys plugin install hydra-keys-provider-anthropic

Installing hydra-keys-provider-anthropic@latest...
✓ Plugin installed successfully!

The 'anthropic' provider is now available.
Run 'hydra-keys provider add anthropic' to configure it.
```

---

## 📦 Development Phases

### Phase 1: Foundation (Week 1)

**Priority: HIGH**
- [ ] Initialize oclif project with TypeScript
- [ ] Set up project structure and build pipeline
- [ ] Create config system with validation (zod)
- [ ] Implement storage backend interface
- [ ] Implement KeychainStorage using `@postman/node-keytar`
- [ ] Create `init` command with interactive setup
- [ ] Create `config` commands (show, get, set)
- [ ] Set up testing framework (Jest)

**Deliverables**:
- Working CLI that can initialize config
- Config saved to `~/.hydra-keys/config.json`
- Keychain storage operational

**Tasks**:
1. `npx oclif generate hydra-keys`
2. Configure TypeScript with strict mode
3. Install dependencies: `@postman/node-keytar`, `zod`, `inquirer`, `chalk`, `cli-table3`, `axios`
4. Create config loader/saver with zod validation
5. Implement storage interface and KeychainStorage
6. Implement `init` command with inquirer prompts
7. Implement `config show/get/set` commands
8. Set up Jest with test structure

---

### Phase 2: Plugin System & Core Providers (Week 2)

**Priority: HIGH**
- [ ] Implement plugin system (registration, discovery)
- [ ] Create Provider interface and base types
- [ ] Implement `provider list` command
- [ ] Implement `provider status` command
- [ ] Implement `provider add` command (interactive prompts)
- [ ] Implement `provider remove` command
- [ ] Build OpenRouter provider implementation
- [ ] Build Convex provider implementation

**Deliverables**:
- Plugin system operational
- OpenRouter and Convex providers working
- Can add/remove providers interactively

**Tasks**:
1. Create `PluginSystem` class with registration/discovery
2. Define `Provider` interface and all related types
3. Register built-in providers (OpenRouter, Convex)
4. Implement `provider list` with table output
5. Implement `provider status` showing configured providers
6. Implement `provider add` with interactive prompts (service key, etc.)
7. Implement `provider remove` with confirmation
8. Implement OpenRouter provider with all methods
9. Implement Convex provider with all methods

---

### Phase 3: Key Management (Week 2-3)

**Priority: HIGH**
- [ ] Implement `key create` command
- [ ] Implement `key list` command with human-readable tables
- [ ] Implement `key delete` command
- [ ] Implement `key export` command (JSON)
- [ ] Add `--json` flag for all commands
- [ ] Add limit/expiration flags
- [ ] Add output file support (`--output`)
- [ ] Implement key truncation in displays

**Deliverables**:
- Full CRUD operations for API keys
- Both human-readable and JSON output
- Secure key display (shown once only)

**Tasks**:
1. Implement `key create` with flags for name, limit, reset, expires, output
2. Add interactive mode if --name not provided
3. Implement `key list` with formatted table output
4. Implement `key delete` with confirmation prompt
5. Implement `key export` to JSON file
6. Add `--json` global flag to all commands
7. Implement key truncation (show first 4 + •••• + last 4)
8. Add color coding for status (active, expiring, expired)

---

### Phase 4: Storage & Plugin Management (Week 3)

**Priority: MEDIUM**
- [ ] Implement EncryptedStorage fallback
- [ ] Add `storage status` command
- [ ] Add `storage migrate` command
- [ ] Implement `plugin list` command
- [ ] Implement `plugin install` command
- [ ] Implement `plugin uninstall` command
- [ ] Support external plugin discovery
- [ ] Create plugin starter template

**Deliverables**:
- Multiple storage backends operational
- Plugin management working
- External plugins can be installed

**Tasks**:
1. Implement `EncryptedStorage` with AES-256-GCM + PBKDF2
2. Implement `storage status` showing current backend and key count
3. Implement `storage migrate` with confirmation
4. Implement `plugin list` showing installed plugins
5. Implement `plugin install` using `npm install`
6. Implement `plugin uninstall` using `npm uninstall`
7. Scan for `hydra-keys-provider-*` npm packages
8. Load plugins from `~/.hydra-keys/plugins/`
9. Create plugin template with README and example

---

### Phase 5: Polish & Documentation (Week 4)

**Priority: MEDIUM**
- [ ] Comprehensive error handling
- [ ] Add shell completions
- [ ] Add audit logging (optional)
- [ ] Write comprehensive README
- [ ] Write plugin development guide
- [ ] Create example external provider
- [ ] Add CI/CD pipeline
- [ ] Integration tests for providers

**Deliverables**:
- Production-ready CLI
- Complete documentation
- Plugin ecosystem ready

**Tasks**:
1. Add try/catch to all async operations
2. Create custom error classes with user-friendly messages
3. Generate shell completion scripts (bash, zsh, fish)
4. Implement optional audit logging to `~/.hydra-keys/audit.log`
5. Write comprehensive README with installation, usage, examples
6. Write plugin development guide (CONTRIBUTING.md or PLUGINS.md)
7. Create example provider: `hydra-keys-provider-example`
8. Set up GitHub Actions for CI/CD
9. Add integration tests for OpenRouter and Convex providers

---

## 📝 Configuration Example

```json
// ~/.hydra-keys/config.json
{
  "version": "1",
  "storage": {
    "backend": "keychain"
  },
  "providers": {
    "openrouter": {
      "configured": true,
      "serviceKeyId": "sk-or-1234567890abcdef",
      "config": {
        "endpoint": "https://openrouter.ai/api/v1"
      }
    },
    "convex": {
      "configured": true,
      "serviceKeyId": "team_abc123def456",
      "config": {
        "teamId": "abc123",
        "defaultProject": "my-awesome-project"
      }
    }
  },
  "plugins": [
    "hydra-keys-provider-anthropic"
  ],
  "defaults": {
    "provider": "openrouter",
    "keyLimit": 100,
    "limitReset": "monthly"
  }
}
```

---

## ⚠️ Known Limitations & Trade-offs

1. **OpenAI**: No programmatic key creation for standard API keys (requires Enterprise + Management API + whitelisting)
2. **Keytar**: Using Postman's fork `@postman/node-keytar` (original is archived)
3. **External Plugins**: Must be npm packages with `hydra-keys-provider-*` naming convention
4. **Convex**: Creates deploy keys only (not application keys)
5. **Key Display**: Keys shown once in terminal, users must copy manually or use `--output`

---

## 🎯 Success Criteria

- [x] CLI can be initialized and configured
- [x] OpenRouter and Convex providers work end-to-end
- [x] Keys can be created with limits and expiration
- [x] Service keys stored securely in keychain
- [x] Output is human-readable by default with `--json` option
- [x] External plugins can be installed and registered
- [x] Interactive setup for provider configuration
- [x] Comprehensive error messages
- [x] Type-safe throughout (TypeScript)

---

## 🚦 Quick Start Implementation

### Step 1: Initialize Project

```bash
# Navigate to project directory
cd ~/code/personal/hydra-key

# Generate oclif project
npx oclif generate hydra-keys
cd hydra-keys

# Configure TypeScript
npm install --save-dev typescript @types/node
npm install --save-dev ts-node
npm install --save-dev @oclif/test
```

### Step 2: Install Core Dependencies

```bash
# Install runtime dependencies
npm install @postman/node-keytar zod inquirer chalk cli-table3 axios

# Install development dependencies
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev prettier eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Step 3: Configure Project

Update `package.json`:
```json
{
  "name": "hydra-keys",
  "version": "0.1.0",
  "description": "Secure, extensible CLI for managing API keys",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "hydra-keys": "./bin/run"
  },
  "oclif": {
    "bin": "hydra-keys",
    "dirname": "hydra-keys",
    "commands": "./dist/commands",
    "plugins": [
      "@oclif/plugin-help",
      "@oclif/plugin-not-found"
    ]
  }
}
```

### Step 4: Start Building

Begin with **Phase 1: Foundation** and follow the task list above.

---

## 📚 Additional Resources

- **oclif Documentation**: https://oclif.io/docs
- **OpenRouter API**: https://openrouter.ai/docs
- **Convex API**: https://docs.convex.dev/management-api
- **@postman/node-keytar**: https://www.npmjs.com/package/@postman/node-keytar
- **Zod Validation**: https://zod.dev

---

## 📅 Timeline

| Week | Phase | Key Deliverables |
|------|-------|-----------------|
| 1 | Foundation | CLI init, config system, storage, init command |
| 2 | Plugin System & Providers | Plugin system, OpenRouter & Convex providers |
| 2-3 | Key Management | CRUD operations for keys, formatted output |
| 3 | Storage & Plugins | Encrypted storage, plugin management |
| 4 | Polish & Docs | Error handling, completions, documentation |

---

## ✨ Future Enhancements (Post-MVP)

- [ ] OpenAI provider (Enterprise Management API integration)
- [ ] Key rotation automation
- [ ] Usage monitoring and alerts
- [ ] Multi-environment support (dev, staging, prod)
- [ ] Key templates and presets
- [ ] Web UI for key management
- [ ] Team/organization support
- [ ] Key sharing with revocation
- [ ] Rate limiting enforcement
- [ ] Automated compliance reporting

---

*Last Updated: 2025-01-07*
