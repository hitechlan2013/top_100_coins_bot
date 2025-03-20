import TelegramBot, { SendMessageOptions } from "node-telegram-bot-api";
import dotenv from "dotenv";
import { fetchTopCryptos, formatCryptoData } from "./utils";
import { addChatId, removeChatId, loadChatIds } from "./storage";

dotenv.config();

// 👉 Bot Token
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN is missing in environment variables!");
  process.exit(1);
}

// 👉 Create Bot Instance
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

console.log("🤖 CryptoBot is running...");

// 👉 Set Bot Commands
bot.setMyCommands([
  { command: "/start", description: "Start the bot" },
  { command: "/help", description: "How to use the bot" },
  { command: "/top100", description: "Show Top 100 Cryptos" },
]);

/* ===================================================================================
🚀 /START COMMAND
=================================================================================== */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const welcomeMessage = `
🚀 *Welcome to CryptoBot!* 🚀

Stay ahead of the crypto market!  
Get the latest *Top 100 Crypto Prices*, subscribe to auto updates, and more.

Use the buttons below to get started:
`;

  const options: SendMessageOptions = {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "📈 Top 100 Cryptos", callback_data: "top100" }],
        [
          { text: "✅ Subscribe Updates", callback_data: "subscribe" },
          { text: "❌ Unsubscribe", callback_data: "unsubscribe" },
        ],
        [{ text: "ℹ️ Help", callback_data: "help" }],
      ],
    },
  };

  bot.sendMessage(chatId, welcomeMessage, options);

    // Notify YOU (the owner)
    const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID!;
    if (!msg.from) {
      console.error('Message "from" field is undefined.');
      return;
    }
  
    const userId = msg.from.id;
    const firstName = msg.from.first_name || "";
    const lastName = msg.from.last_name || "";
    const username = msg.from.username ? `@${msg.from.username}` : "No username";
  
    const ownerMessage = `
  👤 *New User Started the Bot!*
  
  🆔 *ID:* ${userId}
  👨‍💻 *Name:* ${firstName} ${lastName}
  💬 *Username:* ${username}
  📅 *Time:* ${new Date().toLocaleString()}
    `;
  
    bot.sendMessage(OWNER_CHAT_ID, ownerMessage, { parse_mode: "Markdown" });
});

/* ===================================================================================
📈 /TOP100 COMMAND
=================================================================================== */
bot.onText(/\/top100/, async (msg) => {
  const chatId = msg.chat.id;

  addChatId(chatId); // Optional: Save subscriber
  bot.sendMessage(chatId, "✅ Fetching Top 100 Cryptos for you...");

  try {
    const cryptos = await fetchTopCryptos(100);
    const message = formatCryptoData(cryptos);
    const chunks = splitMessage(message);

    for (const chunk of chunks) {
      await bot.sendMessage(chatId, chunk, { parse_mode: "Markdown" });
    }
  } catch (error) {
    console.error("❌ Error fetching cryptos:", error);
    bot.sendMessage(
      chatId,
      "⚠️ Failed to fetch crypto data. Please try again later."
    );
  }
});

/* ===================================================================================
📚 /HELP COMMAND
=================================================================================== */
function sendHelpMessage(chatId: number) {
  const helpMessage = `
📖 *CryptoBot Commands Guide*  
Welcome to *CryptoBot*! 🚀 Here’s how you can interact with me:

💡 *Available Commands:*

✅ /start  
_Start the bot and get a welcome message._

✅ /top100  
_Get the latest *Top 100 Cryptocurrencies* with their prices, market cap, and 24h changes!_

✅ /help  
_Show this help message and learn how to use the bot!_

---

🔔 *Features:*  
🔹 Real-time crypto data updates  
🔹 Auto-send updates every 30 mins / 1 hour (if subscribed)  
🔹 Beautifully formatted coin stats  
🔹 Reliable and fast!

---

📬 *Contact Info:*  
👤 Telegram: [@CryptoCuteBoy](https://t.me/CryptoCuteBoy)  
📧 Email: aurora950331@gmail.com

Feel free to reach out if you have questions, feedback, or partnership ideas! 😊
`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
}
// In /help command
bot.onText(/\/help/, (msg) => {
  sendHelpMessage(msg.chat.id);
});

/* ===================================================================================
👉 CALLBACK QUERIES HANDLER
=================================================================================== */
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message?.chat.id;
  const data = callbackQuery.data;

  if (!chatId) return;

  switch (data) {
    case "top100":
      bot.sendMessage(chatId, "📊 Fetching the *Top 100 Cryptos* for you...", {
        parse_mode: "Markdown",
      });
      try {
        const cryptos = await fetchTopCryptos(100);
        const message = formatCryptoData(cryptos);
        const chunks = splitMessage(message);

        for (const chunk of chunks) {
          await bot.sendMessage(chatId, chunk, { parse_mode: "Markdown" });
        }
      } catch (error) {
        console.error("❌ Error fetching top 100:", error);
        bot.sendMessage(
          chatId,
          "⚠️ Failed to fetch crypto data. Please try again later."
        );
      }
      break;

    case "subscribe":
      addChatId(chatId);
      bot.sendMessage(chatId, "✅ You have subscribed to auto updates!");
      break;

    case "unsubscribe":
      removeChatId(chatId);
      bot.sendMessage(chatId, "❌ You have unsubscribed from auto updates.");
      break;

    case "help":
      sendHelpMessage(chatId);
      break;

    default:
      bot.sendMessage(
        chatId,
        "❓ Unknown command. Please use /help for guidance."
      );
  }
});

/* ===================================================================================
🔔 AUTO-SEND UPDATES TO SUBSCRIBERS
=================================================================================== */
async function autoSendUpdates() {
  const chatIds = loadChatIds();

  if (chatIds.length === 0) {
    console.log("ℹ️ No chat IDs found. No users to send updates to.");
    return;
  }

  console.log(`🚀 Sending updates to ${chatIds.length} users...`);

  try {
    const cryptos = await fetchTopCryptos(100);
    const message = formatCryptoData(cryptos);
    const chunks = splitMessage(message);

    for (const chatId of chatIds) {
      for (const chunk of chunks) {
        await bot.sendMessage(chatId, chunk, { parse_mode: "Markdown" });
      }
      console.log(`✅ Update sent to chat ID: ${chatId}`);
    }
  } catch (error) {
    console.error("❌ Error sending auto updates:", error);
  }
}

// Set interval (every 1 hour)
const intervalMs = 60 * 60 * 1000; // 1 hour
setInterval(autoSendUpdates, intervalMs);

/* ===================================================================================
🔧 HELPER FUNCTIONS
=================================================================================== */
function splitMessage(message: string, maxLength: number = 4000): string[] {
  const lines = message.split("\n");
  const chunks: string[] = [];

  let currentChunk = "";
  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > maxLength) {
      chunks.push(currentChunk);
      currentChunk = "";
    }
    currentChunk += line + "\n";
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}
