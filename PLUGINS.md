# 🔌 Creating a Provider Plugin for hydra-keys

`hydra-keys` is designed to be extensible. While the current version supports built-in providers, the architecture allows for easy addition of new providers through plugins.

This guide explains how to create a custom provider plugin.

## Introduction

A **Provider** in `hydra-keys` acts as a bridge between the CLI and a specific API key service (like OpenRouter, Convex, Neon, etc.).

Each provider implements a standard interface that handles:

- **Authentication**: Validating service keys
- **Key Management**: Creating, listing, and deleting API keys
- **Configuration**: Defining required settings

## The Provider Interface

All providers must implement the `Provider` interface defined in `src/providers/base.ts`.

```typescript
export interface Provider {
  name: string; // Unique internal identifier (e.g., 'openrouter')
  displayName: string; // Human-readable name (e.g., 'OpenRouter')
  version: string; // Plugin version
  keysUrl?: string; // Optional URL to manage keys in browser

  // Required Methods
  createKey(options: CreateKeyOptions): Promise<KeyResult>;
  listKeys(): Promise<KeyResult[]>;
  validateConfig(config: ProviderConfig): Promise<ValidationResult>;

  // Optional Methods
  deleteKey?(keyId: string): Promise<void>;
  getKeyDetails?(keyId: string): Promise<KeyDetails>;
}
```

### Key Types

#### `CreateKeyOptions`

Parameters passed when creating a new key.

```typescript
export interface CreateKeyOptions {
  name: string;
  limit?: number;
  limitReset?: "daily" | "weekly" | "monthly";
  expiresAt?: Date;
  metadata?: Record<string, any>;
}
```

#### `KeyResult`

The standard format for returning key information.

```typescript
export interface KeyResult {
  id: string; // Unique ID for the key
  name: string; // User-friendly name
  key: string; // The actual API key (full or masked)
  createdAt: Date;
  expiresAt?: Date;
  limit?: number;
  limitReset?: string;
  metadata?: Record<string, any>;
}
```

#### `ProviderConfig`

Configuration loaded from the user's settings.

```typescript
export interface ProviderConfig {
  serviceKey: string; // The main authentication credential
  endpoint?: string; // Optional API endpoint override
  teamId?: string; // Optional team/org identifier
  projectId?: string; // Optional project identifier
  [key: string]: any; // Any other custom config
}
```

## Implementation Steps

To add a new provider, follow these steps:

### 1. Define the Provider

Create a new file in `src/providers/` (e.g., `src/providers/my-service.ts`).

```typescript
import {
  Provider,
  CreateKeyOptions,
  KeyResult,
  ProviderConfig,
  ValidationResult,
} from "./base";
import axios from "axios";
import { loadProviderConfig } from "./helper";

export const myServiceProvider: Provider = {
  name: "myservice",
  displayName: "My Service",
  version: "1.0.0",
  // ... implementation
};
```

### 2. Implement `validateConfig`

This method checks if the user's configuration (usually the service key) is valid.

```typescript
async validateConfig(config: ProviderConfig): Promise<ValidationResult> {
  try {
    // Make a lightweight API call to verify credentials
    await axios.get('https://api.myservice.com/v1/auth/check', {
      headers: { Authorization: `Bearer ${config.serviceKey}` }
    });
    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message
    };
  }
}
```

### 3. Implement `listKeys`

Fetch and normalize existing keys.

```typescript
async listKeys(): Promise<KeyResult[]> {
  const config = await loadProviderConfig("myservice");

  const response = await axios.get('https://api.myservice.com/v1/keys', {
    headers: { Authorization: `Bearer ${config.serviceKey}` }
  });

  return response.data.keys.map((k: any) => ({
    id: k.id,
    name: k.name,
    key: "••••" + k.last_4_digits, // Mask key for security
    createdAt: new Date(k.created_at),
  }));
}
```

### 4. Implement `createKey`

Handle key creation logic.

```typescript
async createKey(options: CreateKeyOptions): Promise<KeyResult> {
  const config = await loadProviderConfig("myservice");

  const response = await axios.post('https://api.myservice.com/v1/keys', {
    name: options.name,
    limit: options.limit
  }, {
    headers: { Authorization: `Bearer ${config.serviceKey}` }
  });

  return {
    id: response.data.id,
    name: response.data.name,
    key: response.data.full_key, // Return full key ONLY here
    createdAt: new Date(),
  };
}
```

### 5. Register the Provider

Currently, providers are registered internally. Open `src/core/plugin-system.ts` and add your provider:

```typescript
import { myServiceProvider } from "../providers/my-service";

// ... inside registerBuiltInProviders()
if (!this.providers.has(myServiceProvider.name)) {
  this.providers.set(myServiceProvider.name, myServiceProvider);
}
```

> **Note**: A dynamic plugin loading system for external npm packages is currently on the roadmap (see `IMPLEMENTATION_PLAN.md`).

## Example: MockProvider

Here is a complete example of a simple mock provider for testing or development.

```typescript
import {
  Provider,
  CreateKeyOptions,
  KeyResult,
  ProviderConfig,
  ValidationResult,
} from "./base";

export const mockProvider: Provider = {
  name: "mock",
  displayName: "Mock Service",
  version: "0.1.0",

  async createKey(options: CreateKeyOptions): Promise<KeyResult> {
    const mockId = "mock_" + Math.random().toString(36).substr(2, 9);
    const mockKey = "mk_" + Math.random().toString(36).substr(2, 32);

    return {
      id: mockId,
      name: options.name,
      key: mockKey,
      createdAt: new Date(),
      limit: options.limit,
      limitReset: options.limitReset,
    };
  },

  async listKeys(): Promise<KeyResult[]> {
    // Return static mock data
    return [
      {
        id: "mock_123",
        name: "Test Key 1",
        key: "mk_••••••••",
        createdAt: new Date(),
        limit: 100,
      },
    ];
  },

  async deleteKey(keyId: string): Promise<void> {
    console.log(`[Mock] Deleted key ${keyId}`);
  },

  async validateConfig(config: ProviderConfig): Promise<ValidationResult> {
    if (config.serviceKey === "valid-key") {
      return { valid: true };
    }
    return {
      valid: false,
      error: "Invalid mock service key (use 'valid-key')",
    };
  },
};
```
