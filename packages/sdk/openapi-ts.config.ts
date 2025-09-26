import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "http://localhost:3001/doc",
  output: "./src/generated/api",
  client: "fetch",
});
