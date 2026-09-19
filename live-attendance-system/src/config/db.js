import mongoose from "mongoose";
import config from "./env.js";
import logger from "../utils/logger.js";

mongoose.set("strictQuery", true);

export const connectDB = async (uri = config.MONGO_URI) => {
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });

  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));

  logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};

export const disconnectDB = () => mongoose.connection.close();

export const isDbConnected = () => mongoose.connection.readyState === 1;

export default connectDB;
