import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "livekit/index": "src/livekit/index.ts",
  },
  format: ["cjs", "esm"],
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false, // Keep readable for debugging
  external: [
    "react",
    "react-dom",
    "livekit-client",
    "socket.io-client",
    "axios",
    "jwt-decode",
    "zustand",
    "immer",
    "zod",
  ],
  target: "es2020",
  platform: "browser",
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".mjs" : ".cjs",
    };
  },
  // Production optimizations
  bundle: true,
  skipNodeModulesBundle: true,
  noExternal: [],
  // Library specific settings
  esbuildOptions(options) {
    // Don't add "use client" as banner since individual files already have it
    options.jsx = "automatic";
    options.jsxImportSource = "react";
  },
  // Type generation
  dts: {
    resolve: true,
    compilerOptions: {
      moduleResolution: "bundler",
    },
  },
});
