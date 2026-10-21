const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret-key-for-jest-tests';
  process.env.JWT_EXPIRES_IN = '24h';
  global.__MONGOSERVER__ = mongoServer;
};
