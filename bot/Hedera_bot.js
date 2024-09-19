// Import required libraries
const { ethers } = require('ethers');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const express = require('express'); // For the webhook server

const PORT = process.env.PORT || 3003; // Define port for the server
const app = express();
app.use(express.json());

// Start Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Load environment variables
const TELEGRAM_TOKEN = process.env.HEDERA_TELEGRAM_TOKEN;
const HEDERA_RPC = "https://testnet.hashio.io/api";

// Initialize ethers.js provider
const provider = new ethers.JsonRpcProvider(HEDERA_RPC);

// Initialize Telegram bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

function hederaBotFunction(){
// Webhook endpoint for receiving updates from Telegram
app.post(`/bot${TELEGRAM_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Command suggestions for Telegram (inline commands)
bot.setMyCommands([
  { command: '/start', description: 'Start the bot and see the available commands' },
  { command: '/balance', description: 'Fetch your native token balance (AMBR)' },
  { command: '/erc20balance', description: 'Fetch ERC20 token balance for an address' },
  { command: '/networkinfo', description: 'Get current network info' },
  { command: '/block', description: 'Get details about a specific block' },
  { command: '/gasprice', description: 'Get current gas price' },
  { command: '/sendnative', description: 'Send native currency from one address to another' },
  { command: '/senderc20', description: 'Send ERC20 tokens from one address to another' },
  { command: '/latestblock', description: 'Get details about the latest block' },
  { command: '/nft', description: 'Fetch details about an ERC721 NFT' },
  { command: '/sendnft', description: 'Send an ERC721 NFT from one address to another' }
]);

// Start bot - with detailed command list
bot.onText(/\/start/, (msg) => {
  const welcomeMessage = `
Hello, ${msg.from.first_name}! Welcome to SoulAir Bot! 🚀

Here are the commands you can use:
  
🔹 /balance [address] – Fetch the native AMBR token balance for an address
🔹 /erc20balance [address] [token_contract_address] – Fetch ERC20 token balance for an address and token contract
🔹 /networkinfo – Get the current network info, including latest block and gas price
🔹 /block [block_number] – Get details about a specific block
🔹 /gasprice – Get current gas price
🔹 /sendnative [private_key] [recipient_address] [amount] – Send native currency to a specified address
🔹 /senderc20 [private_key] [recipient_address] [amount] [token_contract_address] – Send ERC20 tokens to a specified address
🔹 /latestblock – Get details about the latest block
🔹 /nft [contract_address] [token_id] – Fetch details about an ERC721 NFT
🔹 /sendnft [private_key] [to_address] [contract_address] [token_id] – Send an ERC721 NFT to a specified address

Feel free to explore the Hedera network with these features! 💻
  `;

  bot.sendMessage(msg.chat.id, welcomeMessage);
});

// Fetch Native Token Balance (AMBR or ETH-like)
bot.onText(/\/balance (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const address = match[1];

  try {
    // Fetch balance from the address
    const balance = await provider.getBalance(address);
    const formattedBalance = ethers.formatEther(balance); // Convert to Ether-like unit

    bot.sendMessage(chatId, `The balance of ${address} is ${formattedBalance} AMBR`);
  } catch (error) {
    bot.sendMessage(chatId, `Error fetching balance: ${error.message}`);
  }
});

// Fetch ERC20 Token Balance
bot.onText(/\/erc20balance (.+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const address = match[1];
  const tokenContractAddress = match[2];

  // ERC20 ABI to call balanceOf and decimals
  const erc20Abi = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
  ];

  try {
    // Create a contract instance for the ERC20 token
    const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, provider);

    // Fetch the token balance and decimals
    const balance = await tokenContract.balanceOf(address);
    const decimals = await tokenContract.decimals();

    // Adjust balance according to token decimals
    const formattedBalance = ethers.formatUnits(balance, decimals);

    bot.sendMessage(chatId, `The ERC20 token balance of ${address} is ${formattedBalance}`);
  } catch (error) {
    bot.sendMessage(chatId, `Error fetching ERC20 balance: ${error.message}`);
  }
});

// Fetch Network Information
bot.onText(/\/networkinfo/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Fetch network info
    const network = await provider.send('net_version');
    const latestBlock = await provider.send('eth_blockNumber');
    const gasPrice = await provider.send('eth_gasPrice');

    bot.sendMessage(chatId, `🔗 *Hedera Network Info*\n\n- Network ID: ${network}\n- Latest Block: ${parseInt(latestBlock, 16)}\n- Current Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} Gwei`);
  } catch (error) {
    bot.sendMessage(chatId, `Error fetching network info: ${error.message}`);
  }
});

// Fetch Block Details
bot.onText(/\/block (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const blockNumber = parseInt(match[1], 10);

  if (isNaN(blockNumber)) {
    return bot.sendMessage(chatId, 'Invalid block number format.');
  }

  try {
    // Convert block number to hexadecimal string
    const blockNumberHex = `0x${blockNumber.toString(16)}`;

    // Fetch block details
    const block = await provider.send('eth_getBlockByNumber', [blockNumberHex, true]);

    if (block) {
      // Convert timestamp from hexadecimal to decimal
      const timestamp = parseInt(block.timestamp, 16);
      bot.sendMessage(chatId, `🟢 *Block Details*\n\n- Block Number: ${parseInt(block.number, 16)}\n- Timestamp: ${new Date(timestamp * 1000).toISOString()}\n- Transactions: ${block.transactions.length}`);
    } else {
      bot.sendMessage(chatId, 'Block not found.');
    }
  } catch (error) {
    bot.sendMessage(chatId, `Error fetching block details: ${error.message}`);
  }
});

// Fetch Gas Price
bot.onText(/\/gasprice/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Fetch gas price using the eth_gasPrice RPC method
    const gasPrice = await provider.send('eth_gasPrice');
    bot.sendMessage(chatId, `🔋 *Current Gas Price*\n\n- Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} Gwei`);
  } catch (error) {
    bot.sendMessage(chatId, `Error fetching gas price: ${error.message}`);
  }
});

// Send Native Currency
bot.onText(/\/sendnative (.+) (.+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const privateKey = match[1];
  const toAddress = match[2];
  const amount = match[3];

  try {
    // Initialize wallet and signer
    const wallet = new ethers.Wallet(privateKey, provider);

    // Create transaction object
    const tx = {
      to: toAddress,
      value: ethers.parseEther(amount) // Convert amount to wei
    };

    // Send transaction
    const txResponse = await wallet.sendTransaction(tx);

    // Wait for transaction confirmation
    await txResponse.wait();

    bot.sendMessage(chatId, `✅ Transaction successful!\nTransaction Hash: ${txResponse.hash}`);
  } catch (error) {
    bot.sendMessage(chatId, `Error sending native currency: ${error.message}`);
  }
});

// Send ERC20 Token
bot.onText(/\/senderc20 (.+) (.+) (.+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const privateKey = match[1];
  const toAddress = match[2];
  const amount = match[3];
  const tokenContractAddress = match[4];

  // ERC20 ABI for transfer function
  const erc20Abi = [
    'function transfer(address recipient, uint256 amount) public returns (bool)',
    'function decimals() view returns (uint8)',
  ];

  try {
    // Initialize wallet and token contract
    const wallet = new ethers.Wallet(privateKey, provider);
    const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, wallet);

    // Convert amount to token units
    const decimals = await tokenContract.decimals();
    const amountInUnits = ethers.parseUnits(amount, decimals);

    // Send ERC20 tokens
    const txResponse = await tokenContract.transfer(toAddress, amountInUnits);

    // Wait for transaction confirmation
    await txResponse.wait();

    bot.sendMessage(chatId, `✅ Transaction successful!\nTransaction Hash: ${txResponse.hash}`);
} catch (error) {
  bot.sendMessage(chatId, `Error sending ERC20 tokens: ${error.message}`);
}
});

// Fetch ERC721 NFT Details
bot.onText(/\/nft (.+) (.+)/, async (msg, match) => {
const chatId = msg.chat.id;
const contractAddress = match[1];
const tokenId = match[2];

// ERC721 ABI to call tokenURI and ownerOf
const erc721Abi = [
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
];

try {
  // Create a contract instance for the ERC721 token
  const nftContract = new ethers.Contract(contractAddress, erc721Abi, provider);

  // Fetch NFT details
  const tokenURI = await nftContract.tokenURI(tokenId);
  const owner = await nftContract.ownerOf(tokenId);

  bot.sendMessage(chatId, `🎨 *NFT Details*\n\n- Token ID: ${tokenId}\n- Token URI: ${tokenURI}\n- Owner: ${owner}`);
} catch (error) {
  bot.sendMessage(chatId, `Error fetching NFT details: ${error.message}`);
}
});

// Send ERC721 NFT
bot.onText(/\/sendnft (.+) (.+) (.+) (.+)/, async (msg, match) => {
const chatId = msg.chat.id;
const privateKey = match[1];
const toAddress = match[2];
const contractAddress = match[3];
const tokenId = match[4];

// ERC721 ABI to call transferFrom
const erc721Abi = [
  'function transferFrom(address from, address to, uint256 tokenId) public',
  'function ownerOf(uint256 tokenId) view returns (address)',
];

try {
  // Initialize wallet and token contract
  const wallet = new ethers.Wallet(privateKey, provider);
  const nftContract = new ethers.Contract(contractAddress, erc721Abi, wallet);

  // Fetch the current owner of the NFT
  const currentOwner = await nftContract.ownerOf(tokenId);

  // Create transaction object
  const tx = await nftContract.transferFrom(currentOwner, toAddress, tokenId);

  // Wait for transaction confirmation
  await tx.wait();

  bot.sendMessage(chatId, `✅ NFT Transfer successful!\nTransaction Hash: ${tx.hash}`);
} catch (error) {
  bot.sendMessage(chatId, `Error sending NFT: ${error.message}`);
}
});

// Fetch Latest Block
bot.onText(/\/latestblock/, async (msg) => {
const chatId = msg.chat.id;

try {
  // Fetch latest block number
  const latestBlockNumber = await provider.getBlockNumber();
  const block = await provider.getBlock(latestBlockNumber);

  // Convert timestamp from UNIX to ISO
  const timestamp = new Date(block.timestamp * 1000).toISOString();

  bot.sendMessage(chatId, `🔵 *Latest Block Details*\n\n- Block Number: ${latestBlockNumber}\n- Timestamp: ${timestamp}\n- Transactions: ${block.transactions.length}`);
} catch (error) {
  bot.sendMessage(chatId, `Error fetching latest block details: ${error.message}`);
}
});

}


module.exports = { hederaBotFunction };

