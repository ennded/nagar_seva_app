import mongoose from 'mongoose';

// Deliberately hardcoded and separate from env.mongodbUri (which points at the real dev
// database) — tests must never touch dev data. Requires the docker-compose mongo container
// (or an equivalent local mongod) reachable at localhost:27017.
const TEST_URI = 'mongodb://localhost:27017/nagar_seva_test';

export async function connectTestDb(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(TEST_URI);
}

export async function clearTestDb(): Promise<void> {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}
