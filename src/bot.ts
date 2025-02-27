import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import csv from 'csv-parser';

interface CSVRow {
  name: string;
  rb_br: string;
}

const vehicles: CSVRow[] = [];
fs.createReadStream('data/data.csv')
  .pipe(csv())
  .on('data', (data) => vehicles.push(data as CSVRow))
  .on('end', () => {
    console.log('CSV file successfully processed');
  });

dotenv.config();

const token: string = process.env.TELEGRAM_TOKEN!;
const bot = new TelegramBot(token, { polling: true });

let find_status: { [key: number]: boolean } = {};
let search_status: { [key: number]: boolean } = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  find_status[chatId] = false;
  bot.sendMessage(chatId, "Hello world!");
});

bot.onText(/\/find/, (msg) => {
  const chatId = msg.chat.id;
  find_status[chatId] = true;
  bot.sendMessage(chatId, "What vehicle are you looking for? \n hint: `usa-aviation-A10C`", { parse_mode: 'Markdown' });
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (find_status[chatId] === true && text) {
    const searchResult = findArrayByName(text.trim().toLowerCase());
    console.log(searchResult);
    if (searchResult) {
        search_status[chatId] = true;
        let message:string = "Choose your vehicle from the list:\n"
        searchResult.forEach(element => {
            message += `/${element.name}\n`;
        });
      bot.sendMessage(chatId, message);
      find_status[chatId] = false;
    } else {
      bot.sendMessage(chatId, "Vehicle not found. Please try again.");
    }
  }

  if (search_status[chatId] === true && text) {
    let result = findByName(text.slice(1));
    console.log(result);
    if (result) {
      bot.sendMessage(chatId, `Found vehicle:\nName: ${result.name}\nBR: ${result.rb_br}`);
    }else{
      bot.sendMessage(chatId, `something went wrong!`);
    }
    search_status[chatId] = false;
  }
  
});

function findArrayByName(name: string): CSVRow[] {
  return vehicles.filter(vehicle => vehicle.name.toLowerCase().includes(name));
}

function findByName(name: string): CSVRow | undefined {
  return vehicles.find(vehicle => vehicle.name.toLowerCase() === name);
}