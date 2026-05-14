# cocos-mcp Tuya Fork Install

This project-local Cocos Creator extension is based on `RomaRogov/cocos-mcp` and adds the `script_hot_reload` MCP tool.

## Install Into A Cocos Project

1. Copy this folder to the target Cocos project:

```text
<CocosProject>/extensions/cocos-mcp
```

2. Install dependencies and build:

```bash
cd <CocosProject>/extensions/cocos-mcp
npm install
npm run build
```

3. Open or restart Cocos Creator.

4. Open the MCP panel and start the server.

5. Confirm the tool list includes:

```text
script_hot_reload
```

## Notes

- Restart Cocos Creator or the MCP service after changing extension source code.
- Use `script_hot_reload` after editing gameplay scripts to verify generated editor/preview chunks match the source.
- Do not include `node_modules` when archiving this extension.
