import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import hashPassword from '../utils/hashPassword';
import extractToken from '../utils/extractToken';

const { ObjectId } = require('mongodb');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const user = await dbClient.db.collection('users').findOne({ email });

    if (user) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const newUser = {
      email,
      password: hashPassword(password),
    };

    await dbClient.db.collection('users').insertOne(newUser);

    return res.status(201).json({
      id: newUser._id,
      email,
    });
  }

  static async getMe(req, res) {
    const token = extractToken(req);
    const key = `auth_${token}`;

    const userId = await redisClient.get(key);

    const user = await dbClient.db
      .collection('users')
      .findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({
      id: user._id,
      email: user.email,
    });
  }
}

export default UsersController;
