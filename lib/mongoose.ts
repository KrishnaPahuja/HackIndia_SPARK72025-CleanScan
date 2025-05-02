import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodwastereduction';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Define the cached connection
interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Declare the global variable for TypeScript
declare global {
  // eslint-disable-next-line no-var
  var mongooseConnection: MongooseConnection | undefined;
}

// Initialize the cached connection
const cached: MongooseConnection = global.mongooseConnection || {
  conn: null,
  promise: null,
};

// Set the global variable for future use
if (!global.mongooseConnection) {
  global.mongooseConnection = cached;
}

export async function connectToDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDB; 