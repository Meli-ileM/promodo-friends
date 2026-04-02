import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = process.env.PORT || 8787;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "pomofriends-server" });
});

app.get("/api/time", (_req, res) => {
  res.json({ now: new Date().toISOString() });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, "../client/dist");

app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
