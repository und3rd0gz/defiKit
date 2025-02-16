import TokensStore from '../database/TokensStore';
import RaydiumListener from '../listeners/RaydiumListener';
import { RaydiumListenerEvents, SolanaListenerEvents } from '../listeners/types';
import TokenHolder from './TokenHandler';

const tokensStore = new TokensStore();
const raydiumListener = new RaydiumListener();

(async () => {
  raydiumListener.on(RaydiumListenerEvents.NEW_LP, async (tokenLP) => {
    const tokenHolder = new TokenHolder();

    tokenHolder.addTime = Date.now();

    tokenHolder.info = await raydiumListener.getTokenInfo(tokenLP.quote.address);

    tokenHolder.lp = tokenLP;

    raydiumListener.on(SolanaListenerEvents.ON_BALANCE_CHANGE, (change) => {
      tokenHolder.addVault(change.isBase, change.amount);
    });
  });
})();
