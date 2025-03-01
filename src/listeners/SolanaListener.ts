import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  RpcResponseAndContext,
  TokenAmount,
} from '@solana/web3.js';
import { SOLANA_CONNECTION, TOKEN_PROGRAM_ID } from './constants';
import { decimalToLamports } from './utils';
import BN from 'bn.js';
import { EventEmitter } from 'stream';
import { BalanceChange, SolanaListeners, TokenHolderInfo, TokenInfo, TokenSources } from './types';
import { unpackAccount } from '@solana/spl-token';
import { Metaplex } from '@metaplex-foundation/js';
import Logout from '../utils/Logout';
import TokenHandler from '../database/TokenHandler';

export default abstract class SolanaListener<T extends Record<keyof T, any[]>> extends EventEmitter<
  T | SolanaListeners
> {
  protected loggerPrefix = '[Solana]:';

  protected onLogsListeners: number[] = [];

  protected onAccountChangeListeners: { address: string; listenerId: number }[] = [];

  protected connection: Connection;

  private metaplex: Metaplex;

  constructor() {
    super();
    this.connection = SOLANA_CONNECTION;

    this.metaplex = Metaplex.make(this.connection);
  }

  private _getMessageWithPrefix(message: string) {
    return `${this.loggerPrefix} ${message}`;
  }

  private async _getTokenBalance(tokenAddress: string | PublicKey) {
    const tokenAccountPublicKey = this.toPublicKey(tokenAddress);

    const response = (await this.connection
      .getTokenAccountBalance(tokenAccountPublicKey, 'confirmed')
      .catch((error) => {
        Logout.redAccent(
          this._getMessageWithPrefix('error get token balance for address:'),
          tokenAddress
        );
        Logout.red(error);

        return undefined;
      })) as RpcResponseAndContext<TokenAmount>;

    return Number.parseInt(response?.value.amount, 10);
  }

  private async _getTokenInfo(tokenAddress: string | PublicKey): Promise<TokenInfo> {
    const token = this.toPublicKey(tokenAddress);

    const metadataAccount = this.metaplex.nfts().pdas().metadata({ mint: token });

    const metadataAccountInfo = await this.connection.getAccountInfo(metadataAccount, 'confirmed');

    const tokenSupply = await this.connection.getTokenSupply(token, 'confirmed');

    if (metadataAccountInfo) {
      const tokenMeta = await this.metaplex.nfts().findByMint({ mintAddress: token });

      return {
        tokenAddress: token.toBase58(),
        symbol: tokenMeta.symbol,
        name: tokenMeta.name,
        supply: tokenSupply.value.uiAmount,
        devAddress: tokenMeta.updateAuthorityAddress.toBase58(),
        tokenSource: TokenSources.RAYDIUM,
      };
    }

    return undefined;
  }

  private async _getTokenPrice(
    splTokenAddress: string | PublicKey,
    tokenDecimals: number | BN,
    solPoolAddress: string | PublicKey
  ) {
    const splTokenBalance = await this._getTokenBalance(splTokenAddress);
    const solPoolBalance = await this._getTokenBalance(solPoolAddress);

    if (
      Number.isNaN(splTokenBalance) ||
      Number.isNaN(solPoolBalance) ||
      splTokenBalance === undefined ||
      solPoolBalance === undefined
    ) {
      return undefined;
    }

    console.log(splTokenBalance, solPoolBalance);

    const tokenPrice =
      solPoolBalance /
      LAMPORTS_PER_SOL /
      (splTokenBalance / decimalToLamports(tokenDecimals as number));

    return tokenPrice;
  }

  private async _getTokenHolders(
    tokenAddress: string | PublicKey,
    tokenDecimal: number
  ): Promise<TokenHolderInfo[]> {
    const token = this.toPublicKey(tokenAddress);

    const TOKEN_ACC_SIZE = 165;

    const accs = await this.connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
      dataSlice: { offset: 64, length: 8 },
      filters: [{ dataSize: TOKEN_ACC_SIZE }, { memcmp: { offset: 0, bytes: token.toBase58() } }],
    });

    return accs.map((acc) => ({
      address: acc.pubkey.toBase58(),
      balance: new BN(acc.account.data.readBigInt64LE().toString())
        .div(new BN(decimalToLamports(tokenDecimal)))
        .toNumber(),
    }));
  }

  private async _getLargestTokenHolders(
    tokenAddress: string | PublicKey
  ): Promise<TokenHolderInfo[]> {
    const token = this.toPublicKey(tokenAddress);

    const largestAccounts = await this.connection.getTokenLargestAccounts(token, 'confirmed');

    return largestAccounts.value.map((account) => ({
      address: account.address.toBase58(),
      balance: account.uiAmount,
    }));
  }

  protected toPublicKey(address: string | PublicKey): PublicKey {
    return typeof address === 'string' ? new PublicKey(address) : address;
  }

  protected abstract _findLiquidityPool(tokenAddress: string | PublicKey);

  public async getTokenPrice(
    splTokenAddress: string | PublicKey,
    splTokenDecimals: number | BN,
    solPoolAddress: string | PublicKey
  ) {
    const tokenPrice = await this._getTokenPrice(splTokenAddress, splTokenDecimals, solPoolAddress);

    return tokenPrice;
  }

  /**
   * @deprecated doesn't work as expected, when creating LP in Raydium itself - vaults can already be found. See {@link RaydiumListener} class
   */
  public async findLiquidityPool(tokenAddress: string | PublicKey) {
    const result = await this._findLiquidityPool(tokenAddress);

    return result;
  }

  public monitorLiquidPoolChanges(
    tokenHandler: TokenHandler,
    handler: (balanceChange: BalanceChange) => void
  ) {
    const baseVault = this.toPublicKey(tokenHandler.lp.base.vaultAddress);
    const quoteVault = this.toPublicKey(tokenHandler.lp.quote.vaultAddress);

    const baseListener = this.connection.onAccountChange(
      baseVault,
      (accountInfo) => {
        const data = unpackAccount(baseVault, accountInfo);

        handler({
          amount: new BN(data.amount as unknown as number).div(new BN(LAMPORTS_PER_SOL)).toNumber(),
          isBase: true,
        });
      },
      { commitment: 'confirmed' }
    );

    const quoteListener = this.connection.onAccountChange(
      quoteVault,
      (accountInfo) => {
        const data = unpackAccount(quoteVault, accountInfo);

        handler({
          amount: new BN(data.amount as unknown as number)
            .div(new BN(decimalToLamports(tokenHandler.lp.quote.decimal)))
            .toNumber(),
          isBase: false,
        });
      },
      { commitment: 'confirmed' }
    );

    tokenHandler.onAccountChangeListeners.push(baseListener, quoteListener);
  }

  public removeSolanaListeners() {
    this.onLogsListeners.forEach(async (id) => {
      await this.connection.removeOnLogsListener(id);
    });
  }

  public async removeTokenHandlerListeners(tokenHandler: TokenHandler) {
    for (let i = 0; i < tokenHandler.onAccountChangeListeners.length; i += 1) {
      await this.connection.removeAccountChangeListener(tokenHandler.onAccountChangeListeners[i]);
    }

    tokenHandler.onAccountChangeListeners = [];
  }

  public async getTokenInfo(tokenAddress: string | PublicKey) {
    const result = await this._getTokenInfo(tokenAddress);

    return result;
  }

  public async getTokenHolders(tokenAddress: string | PublicKey, tokenDecimal: number) {
    const result = await this._getTokenHolders(tokenAddress, tokenDecimal);

    return result;
  }

  public async getLargestTokenHolders(tokenAddress: string | PublicKey) {
    const result = await this._getLargestTokenHolders(tokenAddress);

    return result;
  }
}
