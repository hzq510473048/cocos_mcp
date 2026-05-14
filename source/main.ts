import { ExecuteSceneScriptMethodOptions } from '@cocos/creator-types/editor/packages/scene/@types/public';
import packageJSON from '../package.json';

// Try importing the server manager
let McpServerManager: any = null;
let serverManager: any = null;

// Lazy load the server manager to avoid immediate import issues
async function getServerManager() {
    if (!McpServerManager) {
        try {
            const module = await import('./mcp/server-manager');
            McpServerManager = module.McpServerManager;
        } catch (error) {
            console.error('Failed to import McpServerManager:', error);
            throw error;
        }
    }
    
    if (!serverManager) {
        serverManager = new McpServerManager();
    }
    
    return serverManager;
}

/**
 * @en Method Triggered on Extension Startup
 * @zh 扩展启动时触发的方法
 */
export const load: () => void = function () {
    console.log('MCP Extension loaded');
};

/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展时触发的方法
 */
export const unload: () => void = function () {
    methods.stopMcpServer();
    console.log('MCP Extension unloaded');
};

export const methods: Record<string, (...args: any[]) => any> = {
    openPanel() {
        Editor.Panel.open(packageJSON.name);
    },

    /**
     * Open image generator panel for SVG processing
     */
    async openImageGeneratorPanel() {
        await Editor.Panel.open(`${packageJSON.name}.image-generator`);
    },

    /**
     * Open AI configuration panel
     */
    async openAiConfigPanel() {
        await Editor.Panel.open(`${packageJSON.name}.ai-config`);
    },

    /**
     * Get AI image generation configuration
     */
    async getImageConfig() {
        try {
            const manager = await getServerManager();
            return manager.getImageConfig();
        } catch (error) {
            console.error('Error getting image config:', error);
            return {
                imageGeneration: {
                    providers: [],
                    defaultProvider: '',
                    globalSettings: {
                        timeout: 30000,
                        retries: 3,
                        quality: 'high'
                    }
                }
            };
        }
    },

    /**
     * Save AI image generation configuration
     */
    async saveImageConfig(config: any) {
        try {
            const manager = await getServerManager();
            await manager.saveImageConfig(config);
            return { success: true };
        } catch (error) {
            console.error('Error saving image config:', error);
            return { 
                success: false, 
                message: error instanceof Error ? error.message : String(error) 
            };
        }
    },

    /**
     * Test AI provider connection
     */
    async testProvider(params: { providerId: string; testPrompt: string }) {
        try {
            const manager = await getServerManager();
            const result = await manager.testImageProvider(params.providerId, params.testPrompt);
            return result;
        } catch (error) {
            console.error('Error testing provider:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : String(error) 
            };
        }
    },

    /**
     * Fetch available models from AI provider
     */
    async fetchProviderModels(params: { providerId: string }) {
        try {
            const manager = await getServerManager();
            const result = await manager.fetchProviderModels(params.providerId);
            return result;
        } catch (error) {
            console.error('Error fetching provider models:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : String(error) 
            };
        }
    },

    /**
     * Reset AI configuration to defaults
     */
    async resetImageConfig() {
        try {
            const manager = await getServerManager();
            await manager.resetImageConfig();
            return { success: true };
        } catch (error) {
            console.error('Error resetting image config:', error);
            return { 
                success: false, 
                message: error instanceof Error ? error.message : String(error) 
            };
        }
    },

    /**
     * Start MCP server
     */
    async startMcpServer(config: any) {
        try {
            console.log('Starting MCP server with config:', config);
            
            const manager = await getServerManager();
            if (config) {
                manager.updateConfig(config);
            }
            await manager.startServer();
            
            return { success: true, message: "MCP server started successfully" };
        } catch (error) {
            console.error('Error starting MCP server:', error);
            return { 
                success: false, 
                message: error instanceof Error ? error.message : String(error) 
            };
        }
    },

    /**
     * Stop MCP server  
     */
    async stopMcpServer() {
        try {
            if (serverManager) {
                await serverManager.stopServer();
                return { success: true, message: "MCP server stopped successfully" };
            }
            return { success: true, message: "MCP server was not running" };
        } catch (error) {
            return { 
                success: false, 
                message: error instanceof Error ? error.message : String(error) 
            };
        }
    },

    /**
     * Get MCP server status and configuration
     */
    async getMcpServerInfo() {
        try {
            const manager = await getServerManager();
            const info = manager.getServerInfo();
            return {
                isRunning: info.isRunning,
                config: info.config
            };
        } catch (error) {
            console.error('Error getting server info:', error);
            return {
                isRunning: false,
                config: {
                    port: 3000,
                    name: "cocos-mcp-server",
                    version: "1.0.2",
                    tools: {
                        createNodes: true,
                        modifyNodes: true,
                        queryNodes: true,
                        queryComponents: true,
                        modifyComponents: true,
                        operateCurrentScene: true,
                        operatePrefabAssets: true,
                        operateAssets: true,
                        nodeLinkedPrefabsOperations: true,
                        getAvailableComponentTypes: true,
                        getAvailableAssetTypes: true,
                        getAssetsByType: true,
                        generateImageAsset: true,
                        operateProjectSettings: true,
                        scriptHotReload: true,
                        operateScriptsAndText: true
                    }
                }
            };
        }
    },

    /**
     * Update MCP server configuration
     */
    async updateMcpServerConfig(config: any) {
        try {
            const manager = await getServerManager();
            manager.updateConfig(config);
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                message: error instanceof Error ? error.message : String(error) 
            };
        }
    },

    // Alternative method names for the UI
    'start-mcp-server': async function(config: any) {
        return this.startMcpServer(config);
    },

    'stop-mcp-server': async function() {
        return this.stopMcpServer();
    },

    'get-mcp-server-info': async function() {
        return this.getMcpServerInfo();
    },

    'update-mcp-server-config': async function(config: any) {
        return this.updateMcpServerConfig(config);
    },

    // AI Configuration method aliases
    'get-image-config': async function() {
        return this.getImageConfig();
    },

    'save-image-config': async function(config: any) {
        return this.saveImageConfig(config);
    },

    'test-provider': async function(params: { providerId: string; testPrompt: string }) {
        return this.testProvider(params);
    },

    'fetch-provider-models': async function(params: { providerId: string }) {
        return this.fetchProviderModels(params);
    },

    'reset-image-config': async function() {
        return this.resetImageConfig();
    }
};
