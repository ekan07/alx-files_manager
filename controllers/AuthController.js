import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import hashPassword from '../utils/hashPassword';
import generateToken from '../utils/generateToken';
import extractToken from '../utils/extractToken';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'Unauthorized' });
    }

    const encoded = authHeader.split(' ')[1];
    const decoded = Buffer.from(encoded, 'base64').toString();
    const [email, password] = decoded.split(':');

    const user = await dbClient.db
      .collection('users')
      .findOne({ email, password: hashPassword(password) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = generateToken();

    const key = `auth_${token}`;

    await redisClient.set(key, user._id.toString(), 24 * 60 * 60);

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = extractToken(req);
    const key = `auth_${token}`;

    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await redisClient.del(key);

    return res.status(204).json('');
  }
}

export default AuthController;
