import fs from 'fs';
import path from 'path';

const chatIdsFile = path.resolve(__dirname, 'chatIds.json');

// Load chat IDs from file
export function loadChatIds(): number[] {
  if (!fs.existsSync(chatIdsFile)) {
    return [];
  }

  const data = fs.readFileSync(chatIdsFile, 'utf-8');
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Failed to parse chatIds.json:', error);
    return [];
  }
}

// Add a chat ID and save it
export function addChatId(chatId: number): void {
  const chatIds = loadChatIds();

  if (!chatIds.includes(chatId)) {
    chatIds.push(chatId);
    saveChatIds(chatIds);
    console.log(`✅ New chat ID added: ${chatId}`);
  }
}

// Remove a chat ID and save it
export function removeChatId(chatId: number): void {
  const chatIds = loadChatIds();
  const index = chatIds.indexOf(chatId);

  if (index !== -1) {
    chatIds.splice(index, 1);
    saveChatIds(chatIds);
    console.log(`❌ Chat ID removed: ${chatId}`);
  } else {
    console.log(`ℹ️ Chat ID not found: ${chatId}`);
  }
}

// Save chat IDs to file
function saveChatIds(chatIds: number[]): void {
  try {
    fs.writeFileSync(chatIdsFile, JSON.stringify(chatIds, null, 2));
  } catch (error) {
    console.error('❌ Failed to save chat IDs:', error);
  }
}
