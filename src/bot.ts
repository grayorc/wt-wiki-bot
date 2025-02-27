import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

let token: string = process.env.TELEGRAM_TOKEN!;
const bot = new TelegramBot(token, { polling: true });

let search_status: { [key : number]:boolean } = {};

bot.onText(/\/start/,(msg) => {
    const chatId = msg.chat.id;
    search_status[chatId] = false;
    bot.sendMessage(chatId,"Hello world!");
});

bot.onText(/\/find/, (msg) => {
    const chatId = msg.chat.id;
    search_status[chatId] = true;

    bot.sendMessage(chatId,"what vehicle are you looking for? \n hint: `usa-aviation-A10C`",{ parse_mode: 'Markdown' });
})
