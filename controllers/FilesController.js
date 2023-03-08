import fs from 'fs';
import Queue from 'bull';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import extractToken from '../utils/extractToken';
import generateToken from '../utils/generateToken';

const { ObjectId } = require('mongodb');

const imageQueue = new Queue('image queue', 'redis://127.0.0.1:6379');

class FilesController {
  static async getUser(req) {
    const token = extractToken(req);
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (userId) {
      const user = await dbClient.db
        .collection('users')
        .findOne({ _id: ObjectId(userId) });

      if (!user) return null;
      return user;
    }
    return null;
  }

  static async postUpload(req, res) {
    let encodedData;
    const acceptedType = ['folder', 'file', 'image'];
    const { name, type, data } = req.body;
    let parentId = req.body.parentId || 0;
    const isPublic = req.body.isPublic || false;

    const user = await FilesController.getUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (type === 'file' || type === 'image') {
      encodedData = Buffer.from(data, 'base64');
    }

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !acceptedType.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    const files = await dbClient.db.collection('files');

    if (parentId) {
      parentId = new ObjectId(parentId);

      const file = await files.findOne({ _id: parentId, userId: user._id });

      if (!file) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (file.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    if (type === 'folder') {
      const newFile = {
        userId: user._id,
        name,
        type,
        isPublic,
        parentId,
      };

      await files.insertOne(newFile);

      const newFileObj = { ...newFile };
      delete newFileObj._id;

      return res.status(201).json({
        id: newFile._id,
        ...newFileObj,
      });
    }
    const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const filename = `${filePath}/${generateToken()}`;

    if (!fs.existsSync(filePath)) {
      fs.mkdir(filePath, (err) => {
        if (err) console.log(err);
      });
    }
    fs.writeFile(filename, encodedData, 'utf-8', (err) => {
      if (err) console.log(err);
    });

    const newFile = {
      userId: user._id,
      name,
      type,
      isPublic,
      parentId,
      localPath: filename,
    };

    await files.insertOne(newFile);

    const newFileObj = { ...newFile };
    delete newFileObj._id;
    delete newFileObj.localPath;

    res.status(201).json({
      id: newFile._id,
      ...newFileObj,
    });

    if (type === 'image') {
      await imageQueue.add({
        fileId: newFile._id,
        userId: newFile.userId,
      });
    }

    return null;
  }
}

export default FilesController;
