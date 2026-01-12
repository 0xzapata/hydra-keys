import axios from "axios";
import { openrouterProvider } from "../../../src/providers/openrouter";
import * as helper from "../../../src/providers/helper";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../../../src/providers/helper", () => ({
  loadProviderConfig: jest.fn(),
}));

describe("OpenRouterProvider", () => {
  const mockConfig = {
    serviceKey: "test-service-key",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (helper.loadProviderConfig as jest.Mock).mockResolvedValue(mockConfig);
  });

  describe("createKey", () => {
    it("should create a key successfully", async () => {
      const mockResponse = {
        data: {
          data: {
            hash: "key-id-123",
            name: "test-key",
            created_at: "2023-01-01T00:00:00Z",
            limit: 100,
            limit_reset: "daily",
          },
          key: "sk-test-123",
        },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await openrouterProvider.createKey({
        name: "test-key",
        limit: 100,
        limitReset: "daily",
      });

      expect(helper.loadProviderConfig).toHaveBeenCalledWith("openrouter");
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/keys",
        expect.objectContaining({
          name: "test-key",
          limit: 100,
          limit_reset: "daily",
        }),
        expect.objectContaining({
          headers: {
            Authorization: "Bearer test-service-key",
            "Content-Type": "application/json",
          },
        }),
      );
      expect(result).toEqual({
        id: "key-id-123",
        name: "test-key",
        key: "sk-test-123",
        createdAt: new Date("2023-01-01T00:00:00Z"),
        expiresAt: undefined,
        limit: 100,
        limitReset: "daily",
      });
    });
  });

  describe("listKeys", () => {
    it("should list keys successfully", async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: "key-id-1",
              name: "key-1",
              created_at: "2023-01-01T00:00:00Z",
              limit: 50,
              limit_reset: "monthly",
            },
            {
              id: "key-id-2",
              name: "key-2",
              created_at: "2023-01-02T00:00:00Z",
            },
          ],
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await openrouterProvider.listKeys();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/keys",
        expect.objectContaining({
          headers: {
            Authorization: "Bearer test-service-key",
          },
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("key-1");
      expect(result[1].name).toBe("key-2");
      expect(result[0].key).toBe("••••");
    });
  });

  describe("deleteKey", () => {
    it("should delete a key successfully", async () => {
      mockedAxios.delete.mockResolvedValue({ data: {} });

      await openrouterProvider.deleteKey!("key-id-123");

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/keys/key-id-123",
        expect.objectContaining({
          headers: {
            Authorization: "Bearer test-service-key",
          },
        }),
      );
    });
  });

  describe("validateConfig", () => {
    it("should return valid true when API call succeeds", async () => {
      mockedAxios.get.mockResolvedValue({ data: {} });

      const result = await openrouterProvider.validateConfig(mockConfig);

      expect(result.valid).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/auth/key",
        expect.objectContaining({
          headers: {
            Authorization: "Bearer test-service-key",
          },
        }),
      );
    });

    it("should return valid false when API call fails", async () => {
      const error = {
        message: "Network Error",
        response: {
          data: {
            message: "Invalid API Key",
          },
        },
      };
      mockedAxios.get.mockRejectedValue(error);

      const result = await openrouterProvider.validateConfig(mockConfig);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid API Key");
    });
  });
});
