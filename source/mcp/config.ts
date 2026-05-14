export interface ImageGenerationModel {
  id: string;
  name: string;
  description?: string;
  provider: 'stable-diffusion' | 'automatic1111' | 'dall-e' | 'midjourney' | 'custom';
  enabled: boolean;
}

export interface ImageGenerationProvider {
  id: string;
  name: string;
  type: 'stable-diffusion' | 'automatic1111' | 'dall-e' | 'midjourney' | 'custom';
  enabled: boolean;
  config: {
    baseUrl?: string;
    apiKey?: string;
    timeout?: number;
    customHeaders?: Record<string, string>;
    [key: string]: any;
  };
  models: ImageGenerationModel[];
}

export interface ImageGenerationConfig {
  enabled: boolean;
  providers: ImageGenerationProvider[];
  defaultProvider?: string;
  defaultModel?: string;
  maxImageSize?: number;
  outputFormat?: 'png' | 'jpg' | 'webp';
  quality?: number;
}

export interface McpServerToolConfig {
  // Core tools (always enabled)
  createNodes: boolean;
  modifyNodes: boolean;
  queryNodes: boolean;
  queryComponents: boolean;
  modifyComponents: boolean;
  
  // Scene and asset tools
  operateCurrentScene: boolean;
  operatePrefabAssets: boolean;
  operateAssets: boolean;
  nodeLinkedPrefabsOperations: boolean;
  
  // Discovery tools
  getAvailableComponentTypes: boolean;
  getAvailableAssetTypes: boolean;
  getAssetsByType: boolean;
  
  // Generation tools
  generateImageAsset: boolean;
  
  // Project tools
  operateProjectSettings: boolean;
  scriptHotReload: boolean;
  
  // File system tools (optional)
  operateScriptsAndText: boolean;
  
  // Code execution tools (optional, security-sensitive)
  executeSceneCode: boolean;
}

export interface McpServerConfig {
  port: number;
  name: string;
  version: string;
  tools: McpServerToolConfig;
  imageGeneration: ImageGenerationConfig;
}

export const DEFAULT_IMAGE_GENERATION_CONFIG: ImageGenerationConfig = {
  enabled: true,
  providers: [
    {
      id: 'local-sd',
      name: 'Local Stable Diffusion',
      type: 'stable-diffusion',
      enabled: false,
      config: {
        baseUrl: 'http://localhost:7860',
        timeout: 30000
      },
      models: [
      ]
    },
    {
      id: 'automatic1111',
      name: 'AUTOMATIC1111 WebUI',
      type: 'automatic1111',
      enabled: false,
      config: {
        baseUrl: 'http://localhost:7860',
        timeout: 30000
      },
      models: [
      ]
    },
    {
      id: 'openai-dalle',
      name: 'OpenAI DALL-E',
      type: 'dall-e',
      enabled: false,
      config: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        timeout: 60000
      },
      models: [
      ]
    }
  ],
  defaultProvider: 'local-sd',
  defaultModel: 'sd-v1.5',
  maxImageSize: 1024,
  outputFormat: 'png',
  quality: 90
};

export const DEFAULT_TOOL_CONFIG: McpServerToolConfig = {
  // Core tools (enabled by default)
  createNodes: true,
  modifyNodes: true,
  queryNodes: true,
  queryComponents: true,
  modifyComponents: true,
  
  // Scene and asset tools (enabled by default)
  operateCurrentScene: true,
  operatePrefabAssets: true,
  operateAssets: true,
  nodeLinkedPrefabsOperations: true,
  
  // Discovery tools (enabled by default)
  getAvailableComponentTypes: true,
  getAvailableAssetTypes: true,
  getAssetsByType: true,
  
  // Generation tools (enabled by default)
  generateImageAsset: true,
  
  // Project tools (enabled by default)
  operateProjectSettings: true,
  scriptHotReload: true,
  
  // File system tools (disabled by default for security)
  operateScriptsAndText: false,
  
  // Code execution tools (disabled by default for security)
  executeSceneCode: false,
};

export const DEFAULT_SERVER_CONFIG: McpServerConfig = {
  port: 3000,
  name: "cocos-mcp-server",
  version: "1.0.2",
  tools: DEFAULT_TOOL_CONFIG,
  imageGeneration: DEFAULT_IMAGE_GENERATION_CONFIG
};
