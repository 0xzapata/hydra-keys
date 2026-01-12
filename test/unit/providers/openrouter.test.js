"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const openrouter_1 = require("../../../src/providers/openrouter");
const helper = __importStar(require("../../../src/providers/helper"));
jest.mock("axios");
const mockedAxios = axios_1.default;
jest.mock("../../../src/providers/helper", () => ({
    loadProviderConfig: jest.fn(),
}));
describe("OpenRouterProvider", () => {
    const mockConfig = {
        serviceKey: "test-service-key",
    };
    beforeEach(() => {
        jest.clearAllMocks();
        helper.loadProviderConfig.mockResolvedValue(mockConfig);
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
            const result = await openrouter_1.openrouterProvider.createKey({
                name: "test-key",
                limit: 100,
                limitReset: "daily",
            });
            expect(helper.loadProviderConfig).toHaveBeenCalledWith("openrouter");
            expect(mockedAxios.post).toHaveBeenCalledWith("https://openrouter.ai/api/v1/keys", expect.objectContaining({
                name: "test-key",
                limit: 100,
                limit_reset: "daily",
            }), expect.objectContaining({
                headers: {
                    Authorization: "Bearer test-service-key",
                },
            }));
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
            const result = await openrouter_1.openrouterProvider.listKeys();
            expect(mockedAxios.get).toHaveBeenCalledWith("https://openrouter.ai/api/v1/keys", expect.objectContaining({
                headers: {
                    Authorization: "Bearer test-service-key",
                },
            }));
            expect(result).toHaveLength(2);
            expect(result[0].name).toBe("key-1");
            expect(result[1].name).toBe("key-2");
            expect(result[0].key).toBe("••••");
        });
    });
    describe("deleteKey", () => {
        it("should delete a key successfully", async () => {
            mockedAxios.delete.mockResolvedValue({ data: {} });
            await openrouter_1.openrouterProvider.deleteKey("key-id-123");
            expect(mockedAxios.delete).toHaveBeenCalledWith("https://openrouter.ai/api/v1/keys/key-id-123", expect.objectContaining({
                headers: {
                    Authorization: "Bearer test-service-key",
                },
            }));
        });
    });
    describe("validateConfig", () => {
        it("should return valid true when API call succeeds", async () => {
            mockedAxios.get.mockResolvedValue({ data: {} });
            const result = await openrouter_1.openrouterProvider.validateConfig(mockConfig);
            expect(result.valid).toBe(true);
            expect(mockedAxios.get).toHaveBeenCalledWith("https://openrouter.ai/api/v1/auth/key", expect.objectContaining({
                headers: {
                    Authorization: "Bearer test-service-key",
                },
            }));
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
            const result = await openrouter_1.openrouterProvider.validateConfig(mockConfig);
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Invalid API Key");
        });
    });
});
//# sourceMappingURL=openrouter.test.js.map