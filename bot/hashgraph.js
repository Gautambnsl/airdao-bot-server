const {Resolver} = require('@hedera-name-service/hns-resolution-sdk');

 async function resolveHederaNameOrAccountId(value){
    const resolver = new Resolver('hedera_main');
    const res = await resolver.resolveSLD(value)
    return res;
}

module.exports = { resolveHederaNameOrAccountId };
