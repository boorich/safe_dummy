# Documentation
* [Safe Core SDK](https://github.com/safe-global/safe-core-sdk/blob/main/guides/integrating-the-safe-core-sdk.md)
* [Protocol Kit](https://docs.safe.global/safe-core-aa-sdk/protocol-kit)

# Pre-requisites

Create an .env file:
```bash
touch .env
```

Create 3 signing account private keys (e.g. with MetaMask) and paste them into the .env file you just created.
```bash
export OWNER_1_PRIVATE_KEY='<PRIVATE_KEY>'
export OWNER_2_PRIVATE_KEY='<PRIVATE_KEY>'
export OWNER_3_PRIVATE_KEY='<PRIVATE_KEY>'
```

# How to run
```bash
yarn install
npx ts-node index.ts 
```