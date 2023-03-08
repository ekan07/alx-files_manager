const { MongoClient } = require('mongodb');

const HOST = process.env.DB_HOST || 'localhost';
const PORT = process.env.DB_PORT || '27017';
const DATABASE = process.env.DB_DATABASE || 'files_manager';
const URL = `mongodb://${HOST}:${PORT}`;

class DBClient {
  constructor() {
    MongoClient.connect(URL, (err, client) => {
      if (!err) {
        this.db = client.db(DATABASE);
      } else {
        this.db = false;
      }
    });
  }

  isAlive() {
    if (this.db) {
      return true;
    }
    return false;
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
