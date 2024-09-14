const { ethers } = require('ethers');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const AIRDAO_RPC = process.env.AIRDAO_RPC;

const provider = new ethers.JsonRpcProvider(AIRDAO_RPC);
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Set commands once at the start
bot.setMyCommands([
  { command: '/start', description: 'Start the bot and see the available commands' },
  { command: '/balance', description: 'Fetch your native token balance (AMBR)' },
  { command: '/erc20balance', description: 'Fetch ERC20 token balance for an address' },
  { command: '/networkinfo', description: 'Get current network info' },
  { command: '/block', description: 'Get details about a specific block' },
  { command: '/gasprice', description: 'Get current gas price' },
  { command: '/pendingtx', description: 'Get the list of pending transactions' },
  { command: '/chainid', description: 'Get current chain ID' }
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
🔹 /pendingtx – Get the list of pending transactions
🔹 /chainid – Get current chain ID

Feel free to explore the AirDAO network with these features! 💻
  `;
  bot.sendMessage(msg.chat.id, welcomeMessage);
});

// Fetch Native Token Balance (AMBR or ETH-like)
bot.onText(/\/balance (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const address = match[1];
  
  if (!ethers.isAddress(address)) {
    return bot.sendMessage(chatId, 'Invalid address format.');
  }

  try {
    console.log(provider,"<<<<")
    const balance = await provider.getBalance(address);
    const formattedBalance = ethers.formatEther(balance);
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

  if (!ethers.isAddress(address) || !ethers.isAddress(tokenContractAddress)) {
    return bot.sendMessage(chatId, 'Invalid address format.');
  }

  const erc20Abi = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
  ];

  try {
    const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, provider);
    const balance = await tokenContract.balanceOf(address);
    const decimals = await tokenContract.decimals();
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
  
      bot.sendMessage(chatId, `🔗 *AirDAO Network Info*\n\n- Network ID: ${network}\n- Latest Block: ${parseInt(latestBlock, 16)}\n- Current Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} Gwei`);
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

// Fetch Pending Transactions
bot.onText(/\/pendingtx/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const pendingTxs = await provider.send('eth_getBlockByNumber', ['pending', true]);
    const txCount = pendingTxs.transactions.length;
    bot.sendMessage(chatId, `⏳ *Pending Transactions*\n\n- Number of Pending Transactions: ${txCount}`);
  } catch (error) {
    bot.sendMessage(chatId, `Error fetching pending transactions: ${error.message}`);
  }
});

// Fetch Chain ID
bot.onText(/\/chainid/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const network = await provider.getNetwork();
    bot.sendMessage(chatId, `🌐 *Network Information*\n\n- Chain ID: ${network.chainId}\n- Network Name: ${network.name}`);
  } catch (error) {
    bot.sendMessage(chatId, `Error fetching chain ID: ${error.message}`);
  }
});

// Handle invalid commands
bot.on('message', (msg) => {
  if (!msg.text.startsWith('/')) {
    bot.sendMessage(msg.chat.id, `Invalid command. Use /start, /balance, /erc20balance, /networkinfo, /block, /gasprice, /pendingtx, or /chainid.`);
  }
});
