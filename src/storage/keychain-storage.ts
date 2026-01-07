import keytar from '@postman/node-keytar';

const SERVICE_NAME = 'hydra-keys';

export class KeychainStorage {
  async store(key: string, value: string): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, key, value);
  }

  async retrieve(key: string): Promise<string | null> {
    return await keytar.getPassword(SERVICE_NAME, key);
  }

  async delete(key: string): Promise<void> {
    await keytar.deletePassword(SERVICE_NAME, key);
  }

  async list(): Promise<string[]> {
    const credentials = await keytar.findCredentials(SERVICE_NAME);
    return credentials.map(c => c.account);
  }
}
