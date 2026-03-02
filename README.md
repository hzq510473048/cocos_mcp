# This repository will no longer supported due to movement to Code Mode approach. [Please try it instead!](https://github.com/RomaRogov/cocos-code-mode)

# Cocos Creator MCP Server

A Cocos Creator extension that implements a Model Context Protocol (MCP) server with Streamable HTTP transport. This extension runs **directly within Cocos Creator** - no external tools, bridges, or setup required. Simply install the extension and start connecting AI assistants to your game development workflow.

[**Example of the game created fully with AI agent prompts only with this extension**](https://ro-ro.itch.io/ai-breakout)

## Key Advantages

### 🚀 **Zero-Setup Integration**
- **Runs In-Engine**: MCP server operates directly within Cocos Creator extension
- **Streamable HTTP Transport**: Direct connection via `http://localhost:3000/mcp`
- **No External Dependencies**: No need for additional tools, bridges, or complicated setup
- **Instant Access**: One-click server start from the built-in control panel

### 🎯 **Compact Yet Comprehensive Toolset**
A carefully curated collection of **16 powerful tools** designed for maximum AI efficiency:

#### **🔍 Discovery & Inspection** (5 tools)
- `query_nodes` - Inspect scene hierarchy with granular detail control
- `query_components` - Discover component properties with types and tooltips  
- `get_available_asset_types` - Enumerate all available asset types
- `get_available_component_types` - Enumerate all available component types
- `get_assets_by_type` - Query assets by specific type

#### **🏗️ Creation & Modification** (4 tools)
- `create_nodes` - Bulk node creation with components and transforms
- `modify_nodes` - Batch property updates, hierarchy changes, component management
- `modify_components` - Precise component configuration with UUID targeting
- `generate_image_asset` - ⚡ Advanced AI-powered asset creation

#### **📦 Asset & Project Management** (5 tools)
- `operate_assets` - Comprehensive asset operations (create, copy, move, delete, inspect)
- `operate_current_scene` - Scene lifecycle management (open, save, configure)
- `operate_prefab_assets` - Full prefab workflow (create, edit, close)
- `node_linked_prefabs_operations` - Prefab instance management (edit, unwrap, reset)
- `operate_project_settings` - Project configuration (layers, collisions, design resolution)

#### **🔧 Advanced Operations** (2 tools)
- `execute_scene_code` - Direct TypeScript/JavaScript execution in scene context
- `operate_scripts_and_text` - Comprehensive file operations (read, write, search, replace)

### 🎨 **Experimental AI Image Generation**
Transform your asset creation workflow with advanced AI capabilities:

**Multi-Modal Generation Modes:**
- **SVG/Emoji → Image**: Convert vector graphics or emoji to game assets
- **Text → Image**: Generate assets from descriptive prompts
- **SVG + Text → Image**: Use SVG as template/init image for AI enhancement

**Provider Ecosystem:**
- **AUTOMATIC1111**: WebUI integration (tested)
- **Stable Diffusion**: Local or remote installations (untested)
- **OpenAI DALL-E**: Cloud-based generation (untested)
- **Custom Providers**: Extensible architecture for new services

**Advanced Features:**
- **Dynamic Model Selection**: Auto-populated from configured providers
- **Background Removal**: Automatic transparency for sprites/icons
- **Asset Type Control**: Generate as texture, sprite-frame, normal-map, etc.
- **Reproducible Results**: Seed-based generation for consistency
- **Batch Operations**: Efficient bulk asset creation

**AI-Optimized Workflow:**
- **Template Enhancement**: Use existing assets as generation templates
- **Prompt Engineering**: Negative prompts and guidance scale control
- **Asset Integration**: Generated content automatically imported with proper metadata

## Quick Start

1. **Install & Enable**: Install the extension in Cocos Creator and enable it in Extension Manager
2. **Start Server**: Open `Panel -> cocos-mcp -> MCP Server Control Panel` and click Start
3. **Connect AI**: Point your AI assistant to `http://localhost:3000/mcp`
4. **Start Creating**: Use natural language to build games, generate assets, and iterate rapidly

### AI Image Generation Setup

1. **Configure Providers**: Use the extension's AI Image Generation config panel
2. **Add Models**: Configure available models for each provider through the UI
3. **Test Connectivity**: Verify provider setup with the built-in test function
4. **Generate Assets**: Use the `generate_image_asset` MCP tool

#### Quick Start with Local Stable Diffusion

1. Open the AI Image Generation config panel in Cocos Creator
2. Add a new Stable Diffusion provider pointing to `http://localhost:7860`
3. Configure your models through the UI
4. Test the connection

## Technical Implementation

- **Transport**: Streamable HTTP transport with Express.js server
- **Protocol**: JSON-RPC 2.0 compliance with proper error handling
- **Session Management**: Stateful connections with CORS support
- **Type Safety**: Full TypeScript implementation with Zod schemas for input validation
- **Modular Architecture**: Each resource, tool, and completion implemented in separate files

## Architecture

The extension consists of several key components:

1. **Extension Panel** (`source/panels/default/`): Vue3-based UI for controlling the MCP server
2. **MCP Server Manager** (`source/mcp/server-manager.ts`): Manages the HTTP server and MCP transport
4. **Tools** (`source/mcp/tools/`): Provide actions for modifying the project

## Development Environment

- Node.js
- TypeScript
- Vue 3.x
- Express.js for HTTP server
- MCP TypeScript SDK

## Installation

```bash
# Install dependencies
npm install

# Build the extension
npm run build
```

## Development

### Adding New Tools
1. Create new file in `source/mcp/tools/`
2. Implement using `server.registerTool()` with Zod schema
3. Export registration function
4. Add import and call in `server-manager.ts`

## Dependencies

- `@modelcontextprotocol/sdk` - MCP TypeScript SDK
- `express` - HTTP server framework
- `zod` - Schema validation
- `vue` - UI framework for the panel

## License

This project is licensed under the MIT License.
