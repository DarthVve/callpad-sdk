import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: [
    "react",
    "react-dom",
    "livekit-client",
    "socket.io-client",
    "axios",
  ],
  target: "es2020",
  platform: "browser",
});
