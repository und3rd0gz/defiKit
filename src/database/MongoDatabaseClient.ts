import { Collection, MongoClient } from 'mongodb';
import { MONGO_DB_NAME, MONGO_LOGIN, MONGO_PASSWORD, MONGO_URL } from './constants';
import Logout from '../utils/Logout';

export default class MongoDatabaseClient {
  private mongoUrl: string;

  private mongoUsername: string;

  private mongoPassword: string;

  private mongoDbName: string;

  private mongoClient: MongoClient;

  constructor() {
    this.mongoUrl = MONGO_URL;

    this.mongoPassword = MONGO_PASSWORD;

    this.mongoUsername = MONGO_LOGIN;

    this.mongoDbName = MONGO_DB_NAME;

    this.mongoClient = new MongoClient(this.mongoUrl, {
      auth: { password: this.mongoPassword, username: this.mongoUsername },
    });
  }

  protected async executeInCollection<T extends any[], R, CollectionType>(
    collectionName: string,
    func: (collection: Collection<CollectionType>, ...args: T) => Promise<R>,
    ...args: T
  ): Promise<R> {
    await this.mongoClient.connect();

    const collection = this.mongoClient
      .db(this.mongoDbName)
      .collection<CollectionType>(collectionName);

    try {
      const result = await func(collection, ...args);
      return result;
    } catch (e) {
      Logout.redAccent('[Database]', 'failed operation');
      Logout.white(e);
    }

    await this.mongoClient.close();

    return undefined;
  }

  public async healthCheck() {
    await this.mongoClient
      .connect()
      .then((connectedClient) => {
        Logout.greenAccent('[Database]: MongoDB connection:', 'SUCCESS');
        Logout.white(connectedClient.options.dbName);
      })
      .catch((reason) => {
        Logout.redAccent('[Database]: MongoDB connection:', 'ERROR');
        Logout.white(reason);
      });

    await this.mongoClient
      .db(this.mongoDbName)
      .collections()
      .then((collections) => {
        Logout.greenAccent(
          `[Database]: ${this.mongoDbName} collections length:`,
          collections.length
        );
      })
      .catch((reason) => {
        Logout.redAccent(`[Database]: ${this.mongoDbName} collections length:`, 'ERROR');
        Logout.white(reason);
      });

    const statusToReturn = await this.mongoClient.db(this.mongoDbName).command({ ping: 1 });
    Logout.yellowAccent(`[Database]: ${this.mongoDbName}:`, statusToReturn.ok);

    await this.mongoClient
      .close()
      .then(() => {
        Logout.greenAccent('[Database]: MongoDB connection closing:', 'CLOSED');
      })
      .catch((reason) => {
        Logout.redAccent('[Database]: MongoDB connection closing:', 'ERROR');
        Logout.white(reason);
      });

    return statusToReturn;
  }
}
