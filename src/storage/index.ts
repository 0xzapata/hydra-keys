import { KeychainStorage } from "./keychain-storage";

export interface StorageBackend {
  store(key: string, value: string): Promise<void>;
  retrieve(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
}

export interface StorageStatus {
  available: boolean;
  backend: "keychain" | "encrypted-file";
  error?: string;
}

export class StorageManager {
  private storage: StorageBackend = new KeychainStorage();

  async checkStorage(): Promise<StorageStatus> {
    try {
      await this.storage.list();
      return { available: true, backend: "keychain" };
    } catch (error: any) {
      return {
        available: false,
        backend: "encrypted-file",
        error: error.message,
      };
    }
  }

  getKeychain(): StorageBackend {
    return this.storage;
  }

  getEncrypted() {
    throw new Error(
      "Encrypted storage not yet implemented. Please use keychain storage.",
    );
  }
}
