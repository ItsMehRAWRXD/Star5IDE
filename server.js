"use strict";

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const RawrZStandalone = require("./rawrz-standalone");

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 8080;
const apiKey = process.env.API_KEY || "";
const cli = new RawrZStandalone();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined"));

// API key middleware (optional if API_KEY is not set)
app.use((req, res, next) => {
  if (!apiKey) {
    return next();
  }
  const provided = req.header("x-api-key");
  if (!provided || provided !== apiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// Health endpoints
app.get("/", (req, res) => {
  res.json({ name: "rawrz-security-platform", status: "ok" });
});

app.get("/healthz", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Safe API wrappers
app.post("/api/hash", async (req, res) => {
  try {
    const { input, algorithm = "sha256", save = false, extension = ".hash" } = req.body || {};
    if (typeof input !== "string" || !input.length) {
      return res.status(400).json({ error: "input is required" });
    }
    const result = await cli.hash(input, algorithm, Boolean(save), extension);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

app.post("/api/encode", async (req, res) => {
  try {
    const { type, input } = req.body || {};
    if (!type || typeof input !== "string") {
      return res.status(400).json({ error: "type and input are required" });
    }
    switch (String(type).toLowerCase()) {
      case "base64":
        return res.json(await cli.base64Encode(input));
      case "hex":
        return res.json(await cli.hexEncode(input));
      case "url":
        return res.json(await cli.urlEncode(input));
      default:
        return res.status(400).json({ error: "Unsupported type. Use base64|hex|url" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

app.post("/api/decode", async (req, res) => {
  try {
    const { type, input } = req.body || {};
    if (!type || typeof input !== "string") {
      return res.status(400).json({ error: "type and input are required" });
    }
    switch (String(type).toLowerCase()) {
      case "base64":
        return res.json(await cli.base64Decode(input));
      case "hex":
        return res.json(await cli.hexDecode(input));
      case "url":
        return res.json(await cli.urlDecode(input));
      default:
        return res.status(400).json({ error: "Unsupported type. Use base64|hex|url" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

app.get("/api/uuid", async (_req, res) => {
  try {
    const result = await cli.generateUUID();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

app.get("/api/time", async (_req, res) => {
  try {
    const result = await cli.getTime();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

app.post("/api/validate", async (req, res) => {
  try {
    const { input, type } = req.body || {};
    if (typeof input !== "string" || !type) {
      return res.status(400).json({ error: "input and type are required" });
    }
    const result = await cli.validate(input, type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

app.post("/api/textops", async (req, res) => {
  try {
    const { operation, input } = req.body || {};
    if (!operation || typeof input !== "string") {
      return res.status(400).json({ error: "operation and input are required" });
    }
    const result = await cli.textOperations(operation, input);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(500).json({ error: err && err.message ? err.message : "Internal Server Error" });
});

app.listen(port, () => {
  const msg = apiKey
    ? `API server listening on port ${port} (API key required)`
    : `API server listening on port ${port} (no API key configured)`;
  // eslint-disable-next-line no-console
  console.log(msg);
});

