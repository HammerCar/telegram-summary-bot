import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import { load, save } from "./storage";
import summarize from "./summarize";

const chatAllowList =
  process.env.TELEGRAM_CHAT_ID_ALLOW_LIST?.split(",").map((v) => v.trim()) ||
  [];

const createBot = () => {
  if (process.env.TELEGRAM_WEBHOOK_URL) {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || "");
    bot.setWebHook(process.env.TELEGRAM_WEBHOOK_URL);

    return bot;
  } else {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || "", {
      polling: true,
    });

    return bot;
  }
};

const bot = createBot();

const messages: { [chatId: string]: TelegramBot.Message[] } = {};
const maxMessageCount = 1000;

bot.onText(/\/(?:tldr|summary)(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;

  if (!chatAllowList.includes(chatId.toString())) {
    return;
  }

  const args = match?.[1] || "";
  const count = Number(args) || 100;

  const chatMessages = messages[chatId] || [];
  const content = chatMessages
    .slice(-count)
    .map(
      (msg) =>
        `[${new Date(msg.date * 1000).toLocaleString("fi-FI")}] <${
          msg.from?.first_name
        } ${msg.from?.last_name}> ${
          msg.forward_from
            ? `(Forwarded from ${msg.forward_from.first_name} ${msg.forward_from.last_name}) `
            : ""
        }${msg.text}`
    )
    .join("\n");

  if (content.length === 0) {
    bot.sendMessage(chatId, "No messages found");
    return;
  }

  bot.sendChatAction(chatId, "typing");

  const summary = await summarize(content);

  if (!summary || summary.length === 0) {
    bot.sendMessage(chatId, "Error summarizing");
    return;
  }

  const escaped = summary.replaceAll(".", "\\.").replaceAll("-", "\\-");
  const message = await bot.sendMessage(chatId, escaped, {
    parse_mode: "MarkdownV2",
  });

  if (!message) {
    bot.sendMessage(chatId, "Error sending message");
    return;
  }

  messages[chatId].push(message);

  while (messages[chatId].length > maxMessageCount) {
    messages[chatId].shift();
  }

  save(chatId, messages[chatId]);
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  console.log("Received message in chat", chatId);

  if (!chatAllowList.includes(chatId.toString())) {
    return;
  }

  if (!messages[chatId]) {
    messages[chatId] = (await load(chatId)) || [];
  }

  messages[chatId].push(msg);

  while (messages[chatId].length > maxMessageCount) {
    messages[chatId].shift();
  }

  save(chatId, messages[chatId]);
});
