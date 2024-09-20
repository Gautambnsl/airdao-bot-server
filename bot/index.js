// index.js

const { FhenixBot } = require('./Fhenix_bot');
const { AirDAOFunction } = require('./AirDao_bot');
const { hederaBotFunction } = require('./Hedera_bot');
const { MorphBotFunction } = require('./Morph_bot');
const { oasisBotFunction } = require('./Oasis_bot');
const { RootStockBotFunction } = require('./RootStock_bot');


// Initialize Telegram bot and handle errors
try {
  FhenixBot();
  AirDAOFunction();
  hederaBotFunction();
  MorphBotFunction();
  oasisBotFunction();
  RootStockBotFunction();
} catch (error) {
  console.error('Error initializing Telegram bot:', error.message);
}

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // process.exit(1); // Optionally exit the process
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // process.exit(1); // Optionally exit the process
});
