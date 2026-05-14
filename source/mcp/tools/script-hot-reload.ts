import { ExecuteSceneScriptMethodOptions } from "@cocos/creator-types/editor/packages/scene/@types/public";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import packageJSON from "../../../package.json";

type RuntimeTarget = "editor" | "preview";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeAssetUrl(input: string): string {
  if (input.startsWith("db://") || input.length === 0) {
    return input;
  }

  const normalized = input.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.startsWith("assets/")) {
    return `db://${normalized}`;
  }
  return normalized;
}

function normalizeProjectFile(input: string): string {
  if (path.isAbsolute(input)) {
    return input;
  }

  const normalized = input.replace(/\\/g, "/").replace(/^db:\/\/assets\//, "assets/");
  return path.join(Editor.Project.path, normalized);
}

async function queryComponentTypes(): Promise<string[]> {
  const options: ExecuteSceneScriptMethodOptions = {
    name: packageJSON.name,
    method: "queryComponentTypes",
    args: [],
  };
  return await Editor.Message.request("scene", "execute-scene-script", options);
}

function walkFiles(root: string, files: string[] = []): string[] {
  if (!fs.existsSync(root)) {
    return files;
  }

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

function findRuntimeMatches(expectedSnippets: string[], targets: RuntimeTarget[]) {
  const targetRoots = targets.map(target => ({
    target,
    root: path.join(Editor.Project.path, "temp", "programming", "packer-driver", "targets", target),
  }));

  const perTarget = targetRoots.map(({ target, root }) => {
    const files = walkFiles(root);
    const matches = expectedSnippets.map(snippet => {
      const matchedFiles: string[] = [];
      for (const file of files) {
        try {
          if (fs.readFileSync(file, "utf8").includes(snippet)) {
            matchedFiles.push(path.relative(Editor.Project.path, file));
          }
        } catch {
          // Ignore files that disappear during packer refresh.
        }
      }
      return { snippet, matchedFiles };
    });

    return {
      target,
      checkedFiles: files.length,
      matches,
      allSnippetsFound: matches.every(match => match.matchedFiles.length > 0),
    };
  });

  return {
    targets: perTarget,
    allTargetsReady: perTarget.every(target => target.allSnippetsFound),
  };
}

export function registerScriptHotReloadTool(server: McpServer): void {
  server.registerTool(
    "script_hot_reload",
    {
      title: "Script Hot Reload",
      description: "Refresh Cocos script assets and verify component registration and generated editor/preview runtime chunks.",
      inputSchema: {
        scriptAssetPath: z.string().describe("Script path, asset URL, or absolute file path, such as assets/MyComponent.ts or db://assets/MyComponent.ts"),
        componentType: z.string().optional().describe("Component class name expected to be registered after refresh"),
        expectedRuntimeSnippets: z.array(z.string()).optional().default([]).describe("Code snippets expected in generated editor/preview chunks"),
        targets: z.array(z.enum(["editor", "preview"])).optional().default(["editor", "preview"]).describe("Generated runtime targets to inspect"),
        touchBeforeRefresh: z.boolean().optional().default(false).describe("Update the source file mtime before refreshing the asset"),
        waitMs: z.number().optional().default(1200).describe("Delay after refresh before verification"),
        retryCount: z.number().optional().default(2).describe("Number of additional refresh/verify attempts when checks fail"),
      }
    },
    async ({ scriptAssetPath, componentType, expectedRuntimeSnippets = [], targets = ["editor", "preview"], touchBeforeRefresh = false, waitMs = 1200, retryCount = 2 }) => {
      await Editor.Message.request("scene", "execute-scene-script", { name: packageJSON.name, method: "startCaptureSceneLogs", args: [] });

      const errors: string[] = [];
      const attempts: any[] = [];
      const assetUrl = normalizeAssetUrl(scriptAssetPath);
      const sourceFile = normalizeProjectFile(scriptAssetPath);
      const boundedWaitMs = Math.max(0, Math.min(waitMs, 10000));
      const boundedRetryCount = Math.max(0, Math.min(retryCount, 8));

      try {
        if (touchBeforeRefresh && fs.existsSync(sourceFile)) {
          const now = new Date();
          fs.utimesSync(sourceFile, now, now);
        }

        const assetInfo = await Editor.Message.request("asset-db", "query-asset-info", assetUrl);
        if (!assetInfo) {
          errors.push(`Script asset not found: ${assetUrl}`);
        }

        for (let attemptIndex = 0; attemptIndex <= boundedRetryCount; attemptIndex += 1) {
          const attempt: any = { attempt: attemptIndex + 1 };

          try {
            if (assetInfo) {
              await Editor.Message.request("asset-db", "refresh-asset", assetInfo.url || assetUrl);
              attempt.refreshedAsset = assetInfo.url || assetUrl;
            }
          } catch (refreshError) {
            attempt.refreshError = refreshError instanceof Error ? refreshError.message : String(refreshError);
          }

          await sleep(boundedWaitMs);

          if (componentType) {
            try {
              const componentTypes = await queryComponentTypes();
              attempt.componentRegistered = componentTypes.includes(componentType);
              attempt.componentTypeMatches = componentTypes.filter(type => type.includes(componentType));
            } catch (componentError) {
              attempt.componentError = componentError instanceof Error ? componentError.message : String(componentError);
            }
          }

          if (expectedRuntimeSnippets.length > 0) {
            attempt.runtime = findRuntimeMatches(expectedRuntimeSnippets, targets as RuntimeTarget[]);
          }

          attempts.push(attempt);

          const componentReady = !componentType || attempt.componentRegistered;
          const runtimeReady = expectedRuntimeSnippets.length === 0 || attempt.runtime?.allTargetsReady;
          if (componentReady && runtimeReady) {
            break;
          }
        }

        const finalAttempt = attempts[attempts.length - 1] || {};
        const componentReady = !componentType || finalAttempt.componentRegistered === true;
        const runtimeReady = expectedRuntimeSnippets.length === 0 || finalAttempt.runtime?.allTargetsReady === true;
        const capturedLogs: string[] = await Editor.Message.request("scene", "execute-scene-script", { name: packageJSON.name, method: "getCapturedSceneLogs", args: [] });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              operation: "script-hot-reload",
              success: errors.length === 0 && componentReady && runtimeReady,
              scriptAssetPath,
              assetUrl,
              sourceFile,
              componentReady,
              runtimeReady,
              attempts,
              errors,
              logs: capturedLogs,
            })
          }]
        };
      } catch (error) {
        const capturedLogs: string[] = await Editor.Message.request("scene", "execute-scene-script", { name: packageJSON.name, method: "getCapturedSceneLogs", args: [] });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              operation: "script-hot-reload",
              success: false,
              scriptAssetPath,
              assetUrl,
              sourceFile,
              error: error instanceof Error ? error.message : String(error),
              errors,
              attempts,
              logs: capturedLogs,
            })
          }]
        };
      }
    }
  );
}
