import mongoose from "mongoose";

export const connectMongoDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in .env.local");
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected!");
    } catch (error) {
        console.log(error);
    }
}
