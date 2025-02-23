import TokenHandler from '../database/TokenHandler';
import { BalanceChange } from '../listeners/types';

export const tokenHandlerBalanceChangeLayer = (
  tokenHandler: TokenHandler,
  balanceChange: BalanceChange
) => {
  tokenHandler.addVault(balanceChange.isBase, balanceChange.amount);
};
