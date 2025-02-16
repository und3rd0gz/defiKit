# defiKit

### DeFi toolkit for collecting Solana tokens data

### How to launch

1. Change constants in:

   - [mongo/mongo-init.js](mongo/mongo-init.js)
   - [mongo/docker-compose.yaml](mongo/docker-compose.yaml)
   - [src/database/constants.ts](src/database/constants.ts)
   - [src/listeners//constants.ts](src/listeners//constants.ts)
   - [src/scripts/raydium.ts](src/scripts/raydium.ts)

2. Launch db: `npm run mongo:start`

3. Launch some of listener: `npm run raydium:start`

### Features

- [x] Collect token data
- [ ] (processing) Store and export token data
- [ ] Collect info about largest accounts
- [ ] Collect info about dev
- [ ] Accumulate full token data for training
