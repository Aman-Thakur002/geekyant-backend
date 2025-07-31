import express from "express";
import * as bodyParser from "body-parser";
import morgan from "morgan";
import * as path from "path";
import logger from "./config/winston";
import cors from "cors";
import dataFilter from "./middleware/filter";
const connectDB = require('./config/database');
const PORT = process.env.PORT || 3000;
const app = express();

require("dotenv").config();

/* Cors middelware */
app.use(cors());

/* Express middelware */
app.use((req, res, next) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  next();
});

/* system out middelware */
app.use(morgan("dev"));

app.use("/public", express.static(path.join(__dirname, "../public")));

// Set Global Variablee
global.config = require("./config/file-paths");

/* express middelware for body requests */
app.use(
  bodyParser.json({
    limit: "200mb",
  })
);

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ limit: '200mb', extended: true }));


app.set("etag", false);

// Apply GET api Filter Data
app.use(dataFilter);

/* Routes*/
app.use("/api", require("./routes/index.routes"));


app.get("/*", (req, res) => {
  res.status(404).send("We couldn't find the endpoint you were looking for!");
});

/* Error handler (next) */
app.use(function (err, req, res, next) {
  if (err === "AccessDenied") {
    res.status(403).send({ status: "error", message: "Access Denied!" });
  }
  logger.error(err);
  res.statusMessage = err;
  res.status(500).send({
    status: "error",
    message: "Something wents wrong!",
    error: err,
  });
});


const server = app.listen(PORT, async () => {
  await connectDB(); 
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});

