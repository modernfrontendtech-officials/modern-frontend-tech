const { MongoClient } = require("mongodb");

function createConfigError(message) {
  const error = new Error(message);
  error.code = "CONFIG_ERROR";
  return error;
}

function getConnectionUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw createConfigError("Missing MONGODB_URI. Add your Atlas connection string in Vercel.");
  }
  return uri;
}

async function getMongoClient() {
  globalThis.__learnHtmlMongoPromise ??= null;

  if (!globalThis.__learnHtmlMongoPromise) {
    const client = new MongoClient(getConnectionUri());
    globalThis.__learnHtmlMongoPromise = client.connect().catch((error) => {
      globalThis.__learnHtmlMongoPromise = null;
      throw error;
    });
  }

  return globalThis.__learnHtmlMongoPromise;
}

module.exports = {
  createConfigError,
  getMongoClient
};
