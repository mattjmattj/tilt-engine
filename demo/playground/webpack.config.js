import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: "production",
  entry: "./src/playground.js",
  output: {
    filename: "playground.js",
    path: path.resolve(__dirname, "public"),
  }
};