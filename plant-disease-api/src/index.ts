import express, { Request, Response } from "express";
import dotenv from "dotenv";
import prisma from "./utils/db";
import testDatabaseConnection from "./utils/dbconn";
import Auth from "./routes/authRoutes";
import Post from "./routes/postRoutes";
import Plant from "./routes/plantRoutes";
import Versions from "./routes/versionRoutes";
import Users from "./routes/usersRoute";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const cors = require("cors");

const allowedOrigins = [
  process.env.CORS_ORIGIN, // localhost development
  process.env.CORS_ORIGIN_KUBERNETES, // Kubernetes service
  "http://localhost", // ingress hostname
  "http://localhost:80", // ingress hostname
];

app.use(cors({
  // origin: function (origin, callback) {
  //   // Allow requests with no origin (e.g., Postman) or from allowed origins
  //   if (!origin || allowedOrigins.includes(origin)) {
  //     callback(null, true);
  //   } else {
  //     console.error(`Blocked by CORS: ${origin}`);
  //     callback(new Error("Not allowed by CORS"));
  //   }
  // },
  origin: "*",  // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Authorization', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
  credentials: true, // Allow credentials (cookies, authorization headers)
}));

// Handle preflight requests for all routes
app.options("*", cors());

app.use(express.json());
// app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.use("/api/auth", Auth);
app.use("/api/plants", Plant);
app.use("/api/posts", Post);
app.use("/api/plants", Versions);
app.use("/api/users",Users);


async function startServer() {
  await testDatabaseConnection().then(() => {
    try {
      app.listen(port, () => {
        console.log(`🟢 Server is running on port ${port}`);
      });
    } catch (error) {
      console.log(`🔴`, error);
    }
  });
}

startServer();
