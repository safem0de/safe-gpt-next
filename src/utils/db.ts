import mongoose from "mongoose";

const uri = process.env.MONGODB_URI as string;
const coll = process.env.MONGODB_COLL as string;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (mongoose.connection.readyState === 2) return;
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  if (!db) return;

  const collections = await db.listCollections({ name: coll }).toArray();
  if (collections.length === 0) {
    await db.createCollection(coll);
  }
}
