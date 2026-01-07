export interface CreateKeyOptions {
  name: string;
  limit?: number;
  limitReset?: "daily" | "weekly" | "monthly";
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface KeyResult {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  expiresAt?: Date;
  limit?: number;
  limitReset?: string;
  metadata?: Record<string, any>;
}

export interface KeyDetails extends KeyResult {
  lastUsed?: Date;
  usage?: {
    requests: number;
    cost: number;
  };
}

export interface ProviderConfig {
  serviceKey: string;
  endpoint?: string;
  teamId?: string;
  projectId?: string;
  [key: string]: any;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface Provider {
  name: string;
  displayName: string;
  version: string;
  keysUrl?: string;

  createKey(options: CreateKeyOptions): Promise<KeyResult>;
  listKeys(): Promise<KeyResult[]>;
  validateConfig(config: ProviderConfig): Promise<ValidationResult>;

  deleteKey?(keyId: string): Promise<void>;
  getKeyDetails?(keyId: string): Promise<KeyDetails>;
}
