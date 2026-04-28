// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import registerRoutes from "./routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 6969;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Content Security Policy middleware
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' http://localhost:* https://*; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self' data:;"
  );
  next();
});

// statikus fájlok (képek, feltöltések)
app.use("/public", express.static(path.join(process.cwd(), "public")));

// regisztráljuk az összes route-ot
registerRoutes(app);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
