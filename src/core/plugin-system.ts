import { Provider } from "../providers/base";
import { openrouterProvider } from "../providers/openrouter";
import { convexProvider } from "../providers/convex";
import { neonProvider } from "../providers/neon";

class PluginSystem {
  private providers = new Map<string, Provider>();
  private initialized = false;

  private ensureInitialized(): void {
    if (!this.initialized) {
      this.registerBuiltInProviders();
      this.initialized = true;
    }
  }

  private registerBuiltInProviders(): void {
    if (!this.providers.has(openrouterProvider.name)) {
      this.providers.set(openrouterProvider.name, openrouterProvider);
    }
    if (!this.providers.has(convexProvider.name)) {
      this.providers.set(convexProvider.name, convexProvider);
    }
    if (!this.providers.has(neonProvider.name)) {
      this.providers.set(neonProvider.name, neonProvider);
    }
  }

  register(provider: Provider): void {
    if (this.providers.has(provider.name)) {
      throw new Error(`Provider ${provider.name} already registered`);
    }
    this.providers.set(provider.name, provider);
  }

  get(name: string): Provider | undefined {
    this.ensureInitialized();
    return this.providers.get(name);
  }

  list(): Provider[] {
    this.ensureInitialized();
    return Array.from(this.providers.values());
  }

  async discoverExternalPlugins(): Promise<string[]> {
    return [];
  }

  async initializeBuiltInProviders(): Promise<void> {
    this.ensureInitialized();
  }
}

export const pluginSystem = new PluginSystem();

export function registerProvider(provider: Provider): void {
  pluginSystem.register(provider);
}
