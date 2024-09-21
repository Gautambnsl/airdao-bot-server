const { ethers } = require('ethers');

async function resolveAddressOrENS(input) {
    // Initialize provider with ethers.js v6.x
    const provider = new ethers.JsonRpcProvider("https://eth.rpc.blxrbdn.com");

    console.log("this is working<<<<<<<<<<<<<<<<");

    // Check if the input is already a valid Ethereum address
    if (ethers.isAddress(input)) {
        return input; // If valid address, return it as is
    }

    try {
        // If not a valid address, attempt to resolve as an ENS name
        console.log("this is also working<<<<<<<<<<<<<<<<");

        const resolvedAddress = await provider.resolveName(input);

        if (resolvedAddress && ethers.isAddress(resolvedAddress)) {
            return resolvedAddress; // Return resolved address if valid
        } else {
            throw new Error('Invalid argument: neither a valid address nor a resolvable ENS name');
        }
    } catch (error) {
        throw new Error('Invalid argument: neither a valid address nor a resolvable ENS name');
    }
}

module.exports = { resolveAddressOrENS };
