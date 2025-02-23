# defiKit

### DeFi toolkit for collecting Solana tokens data

### How to launch

1. Change constants in:

   - [mongo/mongo-init.js](mongo/mongo-init.js)
   - [mongo/docker-compose.yaml](mongo/docker-compose.yaml)
   - [src/database/constants.ts](src/database/constants.ts)
   - [src/listeners/constants.ts](src/listeners/constants.ts)
   - [src/scripts/constants.ts](src/scripts/constants.ts)

2. Launch db: `npm run mongo:start`

3. Launch some of listener: `npm run raydium:start`

### Features

- [x] Collect token data
- [x] Store and export token data
- [x] Collect info about largest accounts
- [x] Accumulate full token data for training
- [ ] Other liquidity pools providers (Currently only Raydium is working)

### Data Collection

defiKit collects and stores the following data about Solana tokens:

#### Token Information

- Token metadata (name, symbol, etc.)
- Total supply
- Current price
- Decimal places

#### Liquidity Pool Data

- Base and quote token balances
- Pool addresses and vault accounts
- Real-time monitoring of pool changes

#### Holder Information

- List of token holders with balances
- Largest token holder accounts
- Changes in holder balances

#### Historical Data

- Price history
- Supply changes
- Trading volume
- Holder distribution over time

The data is stored in MongoDB and can be exported for analysis and machine learning purposes. The system monitors changes in real-time through Solana RPC connections and updates the database accordingly.
