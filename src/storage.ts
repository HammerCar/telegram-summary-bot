import { promises as fs } from "fs";
import TelegramBot from "node-telegram-bot-api";
import path from "path";

const storagePath = process.env.STORAGE_PATH || "./storage";

export const save = async (chatId: number, messages: TelegramBot.Message[]) => {
  const filePath = path.join(storagePath, `${chatId}.json`);

  try {
    await fs.access(storagePath);
  } catch (e) {
    await fs.mkdir(storagePath, { recursive: true });
  }

  await fs.writeFile(filePath, JSON.stringify(messages));
};

export const load = async (chatId: number) => {
  const filePath = path.join(storagePath, `${chatId}.json`);

  try {
    await fs.access(filePath);
  } catch (e) {
    return null;
  }

  const file = await fs.readFile(filePath, "utf-8");
  return JSON.parse(file) as TelegramBot.Message[];
};
