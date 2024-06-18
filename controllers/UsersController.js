import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const crypto = require('crypto');
const { ObjectId } = require('mongodb');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }
    const userCollection = dbClient.db.collection('users');
    if (await userCollection.findOne({ email })) {
      return res.status(400).send({ error: 'Already exist' });
    }

    const hashedPaswd = crypto.createHash('sha1').update(password).digest('hex');
    const insertResult = await userCollection.insertOne({ email, password: hashedPaswd });
    const { insertedId } = insertResult;
    return res.status(201).send({ email, id: insertedId });
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).send({ Error: 'Unauthorized' });
    }
    const userCollection = dbClient.db.collection('users');
    const user = await userCollection.findOne({ _id: ObjectId(userId) });
    return res.send({ email: user.email, id: userId });
  }
}

module.exports = UsersController;
