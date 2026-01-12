import axios from "axios";
import { convexProvider } from "../../../src/providers/convex";
import * as helper from "../../../src/providers/helper";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../../../src/providers/helper", () => ({
  loadProviderConfig: jest.fn(),
}));

describe("ConvexProvider", () => {
  const mockConfig = {
    serviceKey: "test-service-key",
    projectId: "test-project-id",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (helper.loadProviderConfig as jest.Mock).mockResolvedValue(mockConfig);
  });

  describe("createKey", () => {
    it("should create a key successfully", async () => {
      const mockResponse = {
        data: {
          deployKey: "prod:test-deploy-key",
        },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await convexProvider.createKey({
        name: "test-key",
      });

      expect(helper.loadProviderConfig).toHaveBeenCalledWith("convex");
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://api.convex.dev/v1/deployments/test-project-id/create_deploy_key",
        {},
        expect.objectContaining({
          headers: {
            Authorization: "Convex test-service-key",
          },
        }),
      );

      expect(result).toEqual({
        id: "prod:test-deploy-key",
        name: "test-key",
        key: "prod:test-deploy-key",
        createdAt: expect.any(Date),
      });
    });
  });

  describe("listKeys", () => {
    it("should list keys successfully", async () => {
      const mockResponse = {
        data: {
          deployments: [
            {
              name: "dep1",
              deployKey: "k1",
              createTime: 1000,
            },
            {
              name: "dep2",
              id: "k2",
              createTime: 2000,
            },
          ],
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await convexProvider.listKeys();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.convex.dev/v1/deployments",
        expect.objectContaining({
          headers: {
            Authorization: "Convex test-service-key",
          },
        }),
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "k1",
        name: "dep1",
        key: "••••",
        createdAt: new Date(1000),
      });
      expect(result[1]).toEqual({
        id: "k2",
        name: "dep2",
        key: "••••",
        createdAt: new Date(2000),
      });
    });
  });

  describe("validateConfig", () => {
    it("should return valid true when API call succeeds", async () => {
      mockedAxios.get.mockResolvedValue({ data: {} });

      const result = await convexProvider.validateConfig(mockConfig);

      expect(result.valid).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.convex.dev/v1/projects",
        expect.objectContaining({
          headers: {
            Authorization: "Convex test-service-key",
          },
          timeout: 5000,
        }),
      );
    });

    it("should return valid false when API call fails", async () => {
      const error = {
        message: "Network Error",
        response: {
          data: {
            message: "Invalid Access Token",
          },
        },
      };
      mockedAxios.get.mockRejectedValue(error);

      const result = await convexProvider.validateConfig(mockConfig);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid Access Token");
    });
  });
});
