import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function summarize(content: string) {
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a summary bot that will summarize a group chat conversation when requested. You will be given the message history that you have to summarize. Only respond with the summary. You can use markdown to format your response. Prefer listing main discussion point with a bullet point list. ",
      },
      { role: "user", content },
    ],
    model: "gpt-3.5-turbo",
  });

  return chatCompletion.choices[0].message.content;
}
