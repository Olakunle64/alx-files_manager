import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class AuthController {
  static async getConnect(req, res) {
    const emailPaswd = req.headers.authorization;
    if (!emailPaswd) {
      return res.status(401).send({ error: 'Unauthorized - Missing Authorization header' });
    }
    const [, removedBasic] = emailPaswd.split(' ')[1];
    const buffer = Buffer.from(removedBasic, 'base64');
    const decodedString = buffer.toString('utf-8');
    const emPwd = decodedString;
    const emailPassword = emPwd.split(':');
    const email = emailPassword[0];
    const password = emailPassword.slice(1).join('');

    const hashedPaswd = crypto.createHash('sha1').update(password).digest('hex');
    const userCollection = dbClient.db.collection('users');
    const user = await userCollection.findOne({ email, password: hashedPaswd });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 86400);
    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).send({ Error: 'Unauthorized' });
    }
    await redisClient.del(key);
    return res.status(204).send();
  }
}

module.exports = AuthController;
