import { MongoClient } from 'mongodb';
import { mongoConfig } from './settings.js';

let connection = undefined;
let db = undefined;

export async function dbConnection() {
  if (!connection) {
    connection = await MongoClient.connect(mongoConfig.serverUrl);
    db = connection.db(mongoConfig.database);
  }
  return db;
}

export async function closeConnection() {
  await connection.close();
}
