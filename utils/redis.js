import { createClient } from 'redis';

const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => {
      console.log(`Redis client not connected to the server: ${err}`);
    });
    this.client.on('connect', () => {
      console.log('Redis client connected to the server');
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const getAsync = promisify(this.client.get).bind(this.client);
    const value = await getAsync(key);
    return value;
  }

  async set(key, value, expirationInSeconds) {
    const setexAsync = promisify(this.client.set).bind(this.client);
    try {
      // await setexAsync(key, expirationInSeconds, value);
      await setexAsync(key, value, 'EX', expirationInSeconds);
    } catch (error) {
      console.error(`Error setting key '${key}' from Redis:`, error);
    }
  }

  async del(key) {
    const delAsync = promisify(this.client.del).bind(this.client);
    try {
      await delAsync(key);
    } catch (error) {
      console.error(`Error deleting key '${key}' from Redis:`, error);
    }
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
