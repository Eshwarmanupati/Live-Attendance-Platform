import mongoose from "mongoose";

const { connect } = mongoose;

const connectDB = async () => {
  try {
    const conn = await connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};
 
export default connectDB;