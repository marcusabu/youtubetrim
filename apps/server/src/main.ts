import express from "express";
import { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./routers/app.router";
import { createContext } from "./trpc";
import morgan from "morgan";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const DEBUG = process.env.NODE_ENV === "development";
export const HOST = process.env.HOST ?? "0.0.0.0";
export const PORT = DEBUG ? 3001 : 3000;

export const SECRET_KEY = process.env.SECRET_KEY;
if (SECRET_KEY === undefined) {
  throw new Error("SECRET_KEY is not defined");
}

export const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD;
if (LOGIN_PASSWORD === undefined) {
  throw new Error("PASSWORD is not defined");
}


const app = express();
app.use(bodyParser.json());
app.use(morgan("common"));

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

const distPath = path.resolve(__dirname, "../../client/dist");
app.use(express.static(distPath));

// @ts-ignore
app.get("/downloads/:filename", (req: Request, res: Response) => {
  if (!req.params.filename) {
    return res.status(400).send("Filename is required");
  }
  const filePath = path.join(__dirname, "../downloads", req.params.filename);

  // Make sure file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  // ✅ Set correct content type and let browser decide how to handle it
  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Disposition", "inline");

  fs.createReadStream(filePath).pipe(res);
});
app.get("/*client", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`Youtube Trim App server listening on ${HOST}:${PORT}`);
});
