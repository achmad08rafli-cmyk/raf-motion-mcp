
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { z } from "zod";

const app = createMcpExpressApp();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "RAF MOTION MCP",
    status: "online",
    message: "Remotion MCP server is running"
  });
});

function createServer() {
  const server = new McpServer({
    name: "raf-motion-mcp",
    version: "1.0.0"
  });

  server.registerTool(
    "hello",
    {
      description: "Test whether RAF MOTION MCP is working",
      inputSchema: {
        name: z.string().optional()
      }
    },
    async ({ name }) => ({
      content: [{
        type: "text",
        text: `Hello ${name || "Creator"}! RAF MOTION MCP is ready.`
      }]
    })
  );

  server.registerTool(
    "project_info",
    {
      description: "Get information about the RAF MOTION video system",
      inputSchema: {}
    },
    async () => ({
      content: [{
        type: "text",
        text: JSON.stringify({
          project: "RAF MOTION",
          engine: "Remotion",
          server: "Node.js",
          status: "Prototype ready",
          next_step: "Connect Remotion rendering engine"
        })
      }]
    })
  );

  return server;
}

app.post("/mcp", async (req, res) => {
  const server = createServer();

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    res.on("close", () => {
      transport.close();
      server.close();
    });
  } catch (error) {
    console.error("MCP Error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal MCP server error"
      });
    }
  }
});

app.get("/mcp", (req, res) => {
  res.status(405).json({
    error: "Method not allowed"
  });
});

app.delete("/mcp", (req, res) => {
  res.status(405).json({
    error: "Method not allowed"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`RAF MOTION MCP running on port ${PORT}`);
});
