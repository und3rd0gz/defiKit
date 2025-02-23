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
