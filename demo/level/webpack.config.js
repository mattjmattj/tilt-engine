import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: "production",
  entry: "./src/level.js",
  output: {
    filename: "build.js",
    path: path.resolve(__dirname, "public"),
  }
};