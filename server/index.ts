import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, clearConnectedClients } from "./routes";
import { seedDatabase } from "./seed";
import { resetUserOnlineStatus } from "./storage";
import { runMigrations } from "./dbMigration";
import { createInitialItems } from "./initialItems";
import serveStatic from "serve-static";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite"; // Import Vite functions
import fs from "fs"; // Import fs
import { nanoid } from "nanoid"; // Import nanoid

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Run database migrations to ensure schema is up-to-date
    await runMigrations();
    
    // Create initial items for the inventory system
    await createInitialItems();
    
    // Seed the database with default data if needed
    await seedDatabase();
    
    // Reset all user online statuses to prevent "username already taken" errors on restart
    await resetUserOnlineStatus();
    
    // Clear any connected clients that might be lingering in memory
    clearConnectedClients();
  } catch (err) {
    console.error("Error during server startup:", err);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`Error occurred: ${message}`);
    if (err.stack) {
      console.error(err.stack);
    }
    
    res.status(status).json({
      error: message,
      status: status,
      timestamp: new Date().toISOString(),
      code: err.code || 'UNKNOWN_ERROR'
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    // Setup Vite development server middleware
    const viteLogger = createLogger();
    const viteConfig = await import("../vite.config");
    const serverOptions = {
      middlewareMode: true,
      hmr: { server: server },
      allowedHosts: true as true,
    };

    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          process.exit(1);
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    // Use Vite's connect instance as middleware
    app.use(vite.middlewares);

    // Serve index.html as a fallback for client-side routing
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const clientTemplate = path.resolve(
          __dirname, // Use __dirname here
          "..",
          "client",
          "index.html",
        );

        // always reload the index.html file from disk incase it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

  } else {
    // Production static file serving
    app.use(serveStatic('../client/dist'));

    // Fallback to index.html for any unmatched routes (for client-side routing)
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  }

  // Determine the port from command-line arguments, defaulting to 5000
  const portArg = process.argv.find((arg) => arg.startsWith('--port='));
  const hostArg = process.argv.find((arg) => arg.startsWith('--host='));

  let port = 5000;
  let host = "0.0.0.0";

  try {
    if (portArg) {
      const parsedPort = parseInt(portArg.split('=')[1], 10);
      if (isNaN(parsedPort)) {
        throw new Error('Invalid port number. Please use a valid integer.');
      }
      port = parsedPort;
      console.log(`Using custom port: ${port}`);
    } else {
      console.log(`Using default port: ${port}`);
    }

    if (hostArg) {
      host = hostArg.split('=')[1];
      console.log(`Using custom host: ${host}`);
    } else {
      console.log(`Using default host: ${host}`);
    }
  } catch (error: any) {
    console.error('Error parsing command-line arguments:', error.message);
    console.error('Usage: node server.js [--port=number] [--host=string]');
    process.exit(1);
  }

  // Start the server
  server.listen(
    { port, host, reusePort: true },
    () => {
      console.log(`Server started on ${host}:${port}`);
    }
  ).on('error', (err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
  });
})();
