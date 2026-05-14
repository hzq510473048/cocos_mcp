import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express from 'express';
import { createServer, Server as HttpServer } from 'http';
import { randomUUID } from 'node:crypto';

// Import configuration
import { McpServerConfig, DEFAULT_SERVER_CONFIG } from './config.js';
import { ConfigStorage } from './config-storage.js';
import { ImageGenerationService } from './services/image-generation-service.js';

// Import all tools
import { registerCreateNodesTool } from "./tools/create-nodes.js";
import { registerModifyNodesTool } from "./tools/modify-nodes.js";
import { registerQueryNodesTool } from "./tools/query-nodes.js";
import { registerQueryComponentsTool } from "./tools/query-components.js";
import { registerModifyComponentsTool } from "./tools/modify-components.js";
import { registerNodeLinkedPrefabsOperationsTool } from "./tools/node-linked-prefabs-operations.js";
import { registerGetAvailableComponentTypesTool } from "./tools/get-available-component-types.js";
import { registerGetAvailableAssetTypesTool } from "./tools/get-available-asset-types.js";
import { registerOperateAssetsTool } from "./tools/operate-assets.js";
import { registerGetAssetsByTypeTool } from "./tools/get-assets-by-type.js";
import { registerGenerateImageAssetTool } from "./tools/generate-image-asset.js";
import { registerOperateCurrentSceneTool } from "./tools/operate-current-scene.js";
import { registerOperateProjectSettingsTool } from "./tools/operate-project-settings.js";
import { registerScriptHotReloadTool } from "./tools/script-hot-reload.js";
import { registerOperatePrefabAssetsTool } from "./tools/operate-prefab-assets.js";
import { registerOperateScriptsAndTextTool } from "./tools/operate-scripts-and-text.js";
import { registerExecuteSceneCodeTool } from "./tools/execute-scene-code.js";

// Legacy interface for backward compatibility
export interface ServerConfig {
  port: number;
  name?: string;
  version?: string;
}

export class McpServerManager {
  private static instance: McpServerManager | null = null;
  private server: McpServer | null = null;
  private transport: StreamableHTTPServerTransport | null = null;
  private httpServer: HttpServer | null = null;
  private expressApp: express.Application | null = null;
  private config: McpServerConfig = { ...DEFAULT_SERVER_CONFIG };
  private isRunning: boolean = false;
  private transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
  private configStorage: ConfigStorage;
  private imageGenerationService: ImageGenerationService;

  constructor() {
    this.configStorage = new ConfigStorage();
    // Load saved configuration on startup
    this.config = this.configStorage.loadConfig();
    
    // Initialize image generation service
    this.imageGenerationService = new ImageGenerationService(this.config.imageGeneration);
    // Set static instance reference
    McpServerManager.instance = this;
  }

  public static getInstance(): McpServerManager | null {
    return McpServerManager.instance;
  }

  private createMcpServer(): McpServer {
    const server = new McpServer({
      name: this.config.name,
      version: this.config.version
    });

    // Register tools based on configuration
    const tools = this.config.tools;
    console.log('Registering tools with config:', tools);
    
    // Core tools (always needed for basic functionality)
    if (tools.createNodes) {
      registerCreateNodesTool(server);
    }
    if (tools.modifyNodes) {
      registerModifyNodesTool(server);
    }
    if (tools.queryNodes) {
      registerQueryNodesTool(server);
    }
    if (tools.queryComponents) {
      registerQueryComponentsTool(server);
    }
    if (tools.modifyComponents) {
      registerModifyComponentsTool(server);
    }
    
    // Scene and asset tools
    if (tools.operateCurrentScene) {
      registerOperateCurrentSceneTool(server);
    }
    if (tools.operatePrefabAssets) {
      registerOperatePrefabAssetsTool(server);
    }
    if (tools.operateAssets) {
      registerOperateAssetsTool(server);
    }
    if (tools.nodeLinkedPrefabsOperations) {
      registerNodeLinkedPrefabsOperationsTool(server);
    }
    
    // Discovery tools
    if (tools.getAvailableComponentTypes) {
      registerGetAvailableComponentTypesTool(server);
    }
    if (tools.getAvailableAssetTypes) {
      registerGetAvailableAssetTypesTool(server);
    }
    if (tools.getAssetsByType) {
      registerGetAssetsByTypeTool(server);
    }
    
    // Generation tools
    if (tools.generateImageAsset) {
      console.log('Registering generateImageAsset tool...');
      registerGenerateImageAssetTool(server, this);
    } else {
      console.log('generateImageAsset tool is disabled in config');
    }
    
    // Project tools
    if (tools.operateProjectSettings) {
      registerOperateProjectSettingsTool(server);
    }
    if (tools.scriptHotReload) {
      registerScriptHotReloadTool(server);
    }
    
    // File system tools (security-sensitive)
    if (tools.operateScriptsAndText) {
      registerOperateScriptsAndTextTool(server);
    }
    
    // Code execution tools (security-sensitive)
    if (tools.executeSceneCode) {
      registerExecuteSceneCodeTool(server);
    }

    return server;
  }

  public updateConfig(config: Partial<McpServerConfig> | Partial<ServerConfig>): void {
    // Handle legacy config format
    if ('tools' in config) {
      // New format with tools configuration - properly merge tools
      const newConfig = config as Partial<McpServerConfig>;
      this.config = {
        ...this.config,
        ...newConfig,
        tools: {
          ...this.config.tools,
          ...newConfig.tools
        },
        imageGeneration: {
          ...this.config.imageGeneration,
          ...newConfig.imageGeneration
        }
      };
    } else {
      // Legacy format - update basic server settings only
      const legacyConfig = config as Partial<ServerConfig>;
      this.config = {
        ...this.config,
        port: legacyConfig.port ?? this.config.port,
        name: legacyConfig.name ?? this.config.name,
        version: legacyConfig.version ?? this.config.version
      };
    }
    
    // Update image generation service configuration
    this.imageGenerationService.updateConfig(this.config.imageGeneration);
    
    // Save configuration to disk
    this.configStorage.saveConfig(this.config);
  }

  public getConfig(): McpServerConfig {
    return { ...this.config };
  }

  public getServerInfo(): { isRunning: boolean; config: McpServerConfig } {
    return {
      isRunning: this.isRunning,
      config: this.getConfig()
    };
  }

  public getImageGenerationService(): ImageGenerationService {
    return this.imageGenerationService;
  }

  public getImageConfig() {
    return this.config.imageGeneration;
  }

  public async saveImageConfig(imageConfig: any) {
    this.config.imageGeneration = imageConfig.imageGeneration || imageConfig;
    this.imageGenerationService.updateConfig(this.config.imageGeneration);
    this.configStorage.saveConfig(this.config);
  }

  public async testImageProvider(providerId: string, testPrompt: string = 'A simple test image') {
    try {
      const result = await this.imageGenerationService.testProvider(providerId, testPrompt);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  public async fetchProviderModels(providerId: string) {
    try {
      const result = await this.imageGenerationService.fetchAvailableModels(providerId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  public async resetImageConfig() {
    this.config.imageGeneration = { ...DEFAULT_SERVER_CONFIG.imageGeneration };
    this.imageGenerationService.updateConfig(this.config.imageGeneration);
    this.configStorage.saveConfig(this.config);
  }

  public isServerRunning(): boolean {
    return this.isRunning;
  }

  public async startServer(): Promise<void> {
    if (this.isRunning) {
      throw new Error("Server is already running");
    }

    try {
      // Create Express app
      this.expressApp = express();
      this.expressApp.use(express.json());
      
      // Add CORS headers
      this.expressApp.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, mcp-session-id');
        next();
      });

      // Handle POST requests for client-to-server communication
      this.expressApp.post('/mcp', async (req, res) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        let transport: StreamableHTTPServerTransport;

        if (sessionId && this.transports[sessionId]) {
          // Reuse existing transport
          transport = this.transports[sessionId];
        } else if (!sessionId && isInitializeRequest(req.body)) {
          // New initialization request
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
              this.transports[sessionId] = transport;
            }
          });

          // Clean up transport when closed
          transport.onclose = () => {
            if (transport.sessionId) {
              delete this.transports[transport.sessionId];
            }
          };

          const server = this.createMcpServer();
          await server.connect(transport);
        } else {
          // Invalid request - no session ID and not an initialize request
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Bad Request: No valid session ID provided',
            },
            id: null,
          });
          return;
        }

        try {
          await transport.handleRequest(req, res, req.body);
        } catch (error) {
          console.error('Error handling MCP request:', error);
          if (!res.headersSent) {
            res.status(500).json({
              jsonrpc: '2.0',
              error: {
                code: -32603,
                message: 'Internal server error',
              },
              id: null,
            });
          }
        }
      });

      // Reusable handler for GET and DELETE requests
      const handleSessionRequest = async (req: express.Request, res: express.Response) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        if (!sessionId || !this.transports[sessionId]) {
          res.status(400).send('Invalid or missing session ID');
          return;
        }
        
        const transport = this.transports[sessionId];
        await transport.handleRequest(req, res);
      };

      // Handle GET requests for server-to-client notifications via SSE
      this.expressApp.get('/mcp', handleSessionRequest);

      // Handle DELETE requests for session termination
      this.expressApp.delete('/mcp', handleSessionRequest);

      // Create and start HTTP server
      this.httpServer = createServer(this.expressApp);
      
      await new Promise<void>((resolve, reject) => {
        this.httpServer!.listen(this.config.port, () => {
          resolve();
        }).on('error', (error) => {
          reject(error);
        });
      });

      this.isRunning = true;
      console.log(`MCP server started on port ${this.config.port}`);
    } catch (error) {
      this.isRunning = false;
      this.server = null;
      this.transport = null;
      this.httpServer = null;
      this.expressApp = null;
      this.transports = {};
      throw error;
    }
  }

  public async stopServer(): Promise<void> {
    if (!this.isRunning) {
      throw new Error("Server is not running");
    }

    try {
      // Close all transports
      for (const transport of Object.values(this.transports)) {
        try {
          await transport.close();
        } catch (error) {
          console.error("Error closing transport:", error);
        }
      }
      this.transports = {};

      // Close HTTP server
      if (this.httpServer) {
        await new Promise<void>((resolve) => {
          this.httpServer!.close(() => resolve());
        });
        this.httpServer = null;
      }

      this.server = null;
      this.transport = null;
      this.expressApp = null;
      this.isRunning = false;
      
      console.log("MCP server stopped");
    } catch (error) {
      console.error("Error stopping server:", error);
      throw error;
    }
  }

  public static encodeUuid(uuid: string): string {
    return uuid.includes("@") ? btoa(uuid) : uuid;
  }

  public static decodeUuid(encodedUuid: string): string {
    if (McpServerManager.isBase64(encodedUuid)) {
      const decodedUuid = atob(encodedUuid);
      if (decodedUuid.includes("@")) {
        return decodedUuid;
      }
    }
    return encodedUuid;
  }

  private static isBase64(str: string): boolean {
    if (!str || str.length % 4 !== 0) return false;

    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    return base64Regex.test(str);
  }
}
