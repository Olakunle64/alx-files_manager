import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 27017;
    const dbDatabase = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(`mongodb://${dbHost}:${dbPort}`, { useUnifiedTopology: true });
    this.client.connect();
    this.db = this.client.db(dbDatabase);
  }

  isAlive() {
    return this.db.serverConfig.isConnected();
  }

  async nbUsers() {
    const count = await this.db.collection('users').countDocuments();
    return count;
  }

  async nbFiles() {
    const count = await this.db.collection('files').countDocuments();
    return count;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
