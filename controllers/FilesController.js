import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';
import path from 'path';
import mime from 'mime-types';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

dotenv.config();

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).send({ Error: 'Unauthorized' });
    }
    const acceptedType = ['image', 'folder', 'file'];
    const { name, type, data } = req.body;
    let { parentId, isPublic } = req.body;
    if (!name) {
      return res.status(400).send({ Error: 'Missing name' });
    }
    if (!type || !acceptedType.includes(type)) {
      return res.status(400).send({ Error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).send({ Error: 'Missing data' });
    }
    const fileCollection = dbClient.db.collection('files');
    if (parentId) {
      const parentFile = await fileCollection.findOne({ _id: ObjectId(parentId) });
      if (!parentFile) {
        return res.status(400).send({ error: 'Parent not found' });
      }
      if (parentFile && parentFile.type !== 'folder') {
        return res.status(400).send({ error: 'Parent is not a folder' });
      }
    } else {
      parentId = '0';
    }

    if (!isPublic) {
      isPublic = false;
    }
    const newFile = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId !== '0' ? ObjectId(parentId) : '0',
    };
    if (type === 'file' || type === 'image') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      const fileId = uuidv4();
      const localPath = path.join(folderPath, fileId);
      fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
      newFile.localPath = localPath;
      await fileCollection.insertOne(newFile);
      delete newFile.localPath;
      return res.status(201).send(newFile);
    }
    await fileCollection.insertOne(newFile);
    return res.status(201).send(newFile);
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).send({ Error: 'Unauthorized' });
    }
    const { id } = req.params;
    const fileCollection = dbClient.db.collection('files');
    const file = await fileCollection.findOne({ _id: ObjectId(id), userId: ObjectId(userId) });
    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }
    return res.status(201).send(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).send({ Error: 'Unauthorized' });
    }
    let { parentId = '0', page = '0' } = req.query;
    parentId = parentId === '0' ? '0' : ObjectId(parentId);
    const pageSize = 20;
    page = parseInt(page, 10);
    const skip = page * pageSize;
    const fileCollection = dbClient.db.collection('files');
    try {
      const files = await fileCollection
        .aggregate([
          { $match: { userId: ObjectId(userId), parentId: parentId === '0' ? parentId : ObjectId(parentId) } },
          { $skip: skip },
          { $limit: pageSize },
        ])
        .toArray();

      return res.status(200).send(files);
    } catch (err) {
      return res.status(500).send({ error: 'Internal server error' });
    }
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).send({ Error: 'Unauthorized' });
    }
    const { id } = req.params;
    const fileCollection = dbClient.db.collection('files');
    const file = await fileCollection.findOne({ _id: ObjectId(id), userId: ObjectId(userId) });
    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }
    const update = {
      $set: {
        // Add the fields you want to update
        isPublic: true,
      },
    };
    await fileCollection.updateOne(file, update);
    file.isPublic = true;
    return res.status(200).send(file);
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).send({ Error: 'Unauthorized' });
    }
    const { id } = req.params;
    const fileCollection = dbClient.db.collection('files');
    const file = await fileCollection.findOne({ _id: ObjectId(id), userId: ObjectId(userId) });
    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }
    const update = {
      $set: {
        // Add the fields you want to update
        isPublic: false,
      },
    };
    await fileCollection.updateOne(file, update);
    file.isPublic = false;
    return res.status(200).send(file);
  }

  static async getFile(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const { id } = req.params;
    const fileCollection = dbClient.db.collection('files');
    const file = await fileCollection.findOne({ _id: ObjectId(id) });
    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }
    if (!file.isPublic && (!userId || file.userId.toString() !== userId.toString())) {
      return res.status(404).send({ error: 'Not found' });
    }
    if (file.type === 'folder') {
      return res.status(404).send({ error: 'A folder doesn\'t have content' });
    }
    if (!fs.existsSync(file.localPath)) {
      return res.status(404).send({ error: 'Not found' });
    }
    // Get the MIME type based on the file name
    const mimeType = mime.lookup(file.name);
    if (!mimeType) {
      return res.status(400).send({ error: 'Cannot determine MIME type' });
    }
    // Read and return the file content
    fs.readFile(file.localPath.toString(), (err, data) => {
      if (err) {
        return res.status(500).send({ error: 'Internal server error' });
      }
      res.setHeader('Content-Type', mimeType);
      return res.status(200).send(data);
    });
  }
}

module.exports = FilesController;
