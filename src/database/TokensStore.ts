import { Collection, WithId } from 'mongodb';
import { StoredToken } from '../listeners/types';
import Logout from '../utils/Logout';
import MongoDatabaseClient from './MongoDatabaseClient';

export default class TokensStore extends MongoDatabaseClient {
  private collection = 'tokensStore';

  private async _addNewToken(collection: Collection<StoredToken>, storedToken: StoredToken) {
    Logout.yellowAccent('[Database]: Try to add new token', storedToken.info.tokenAddress);

    const foundedId = await collection.findOne({
      info: { tokenAddress: storedToken.info.tokenAddress },
    });

    if (foundedId) {
      Logout.yellowAccent(
        '[Database]: This token is already exist in db:',
        storedToken.info.tokenAddress
      );
      return;
    }

    const insertResult = await collection.insertOne({
      ...storedToken,
      addTime: Date.now(),
      lastUpdateTime: Date.now(),
      updatesCount: 0,
    });

    Logout.greenAccent(
      `[Database]: Add new token ${Logout.getPurple(storedToken.info.tokenAddress)} id =`,
      insertResult.insertedId
    );
  }

  private async _updateToken(
    collection: Collection<StoredToken>,
    storedToken: WithId<StoredToken>
  ) {
    Logout.yellowAccent('[Database]: updating token:', storedToken.info.tokenAddress);

    const token = await collection.findOne({
      info: { tokenAddress: storedToken.info.tokenAddress },
    });

    Logout.yellowAccent(
      `[Database]: ${Logout.getPurple(token.info.tokenAddress)} last update:`,
      new Date(token.lastUpdateTime).toUTCString()
    );

    Logout.yellowAccent(
      `[Database]: ${Logout.getPurple(token.info.tokenAddress)} already updates count:`,
      token.updatesCount || 0
    );

    const { _id, ...withoutId } = storedToken;

    const dataToUpdate = withoutId;
    dataToUpdate.updatesCount = (token.updatesCount || 0) + 1;
    dataToUpdate.lastUpdateTime = Date.now();

    const updateResult = await collection.updateOne(
      { _id: token._id },
      {
        $set: dataToUpdate,
      }
    );

    Logout.yellowAccent(
      `[Database]: ${Logout.getPurple(token.info.tokenAddress)} update status:`,
      updateResult.acknowledged
    );
  }

  private async _getAllTokens(collection: Collection<StoredToken>) {
    const tokens = await collection
      .find({ $or: [{ isIgnore: undefined }, { isIgnore: false }] })
      .toArray();

    return tokens;
  }

  public async addNewToken(storedToken: StoredToken) {
    await this.executeInCollection(this.collection, this._addNewToken, storedToken);
  }

  public async updateToken(storedToken: WithId<StoredToken>) {
    await this.executeInCollection(this.collection, this._updateToken, storedToken);
  }

  public async getAllTokens() {
    const tokens = this.executeInCollection(this.collection, this._getAllTokens);

    return tokens;
  }
}
