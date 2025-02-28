import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import csv from 'csv-parser';

interface CSVRow {
  name: string;
  rb_br: string;
  nation: string;
  is_premium: string;
}

const emoji: { [key: string]: string } = {
  "britain": "🇬🇧",
  "china": "🇨🇳",
  "france": "🇫🇷",
  "germany": "🇩🇪",
  "israel": "🇮🇱",
  "italy": "🇮🇹",
  "japan": "🇯🇵",
  "sweden": "🇸🇪",
  "usa": "🇺🇸",
  "ussr": "🇷🇺"
};

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

function image(vehicle: string): string {
  return `https://natgo.xyz/files/wt/images/garageimages/${vehicle}.jpg`;
}

function findArrayByName(name: string): CSVRow[] {
  let search = vehicles.filter(vehicle => vehicle.name.toLowerCase().replace("_", "").includes(name));
  console.log(search.length);
  if (search.length > 0)
    return search;
  else
    return vehicles.filter(vehicle => vehicle.name.toLowerCase().includes(name));
}

bot.on('inline_query', async (query) => {
  const queryText = query.query.trim().toLowerCase();
  const searchResult = findArrayByName(queryText).slice(0, 10); // Limit results to 10

  const results: TelegramBot.InlineQueryResultArticle[] = searchResult.map((vehicle, index) => ({
    type: 'article',
    id: String(index),
    title: vehicle.name,
    description: `RB BR: ${vehicle.rb_br} | Nation: ${emoji[vehicle.nation.toLowerCase()]}`,
    thumb_url: image(vehicle.name),
    input_message_content: {
      message_text: inline_vehicle_info_tpl(vehicle.name, vehicle.nation.toLowerCase(), vehicle.rb_br, vehicle.rb_br, vehicle.is_premium),
      parse_mode: 'Markdown'
    }
  }));

  await bot.answerInlineQuery(query.id, results);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  find_status[chatId] = false;
  console.log(msg.chat.username)
  bot.sendMessage(chatId, "Hi!");
});

bot.onText(/\/find/, (msg) => {
  const chatId = msg.chat.id;
  find_status[chatId] = true;
  bot.sendMessage(chatId, "What vehicle are you looking for? \n hint: `a_10c`", { parse_mode: 'Markdown' });
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (find_status[chatId] === true && text) {
    const searchResult = findArrayByName(text.trim().toLowerCase());
    console.log(searchResult.length);
    if (searchResult.length > 0) {
      if (searchResult.length > 1) {
        let message: string = "Choose your vehicle from the list:\n";
        searchResult.forEach(element => {
          message += `/${element.name}\n`;
        });
        search_status[chatId] = true;
        bot.sendMessage(chatId, message);
      } else {
        bot.sendPhoto(chatId, image(searchResult[0].name), {
          caption: vehicle_info_tpl(searchResult[0].name, searchResult[0].nation.toLowerCase(), searchResult[0].rb_br, searchResult[0].rb_br,searchResult[0].is_premium)
        });
      }
    } else {
      bot.sendMessage(chatId, "Vehicle not found. Please try again.");
    }
    find_status[chatId] = false;
  } else if (search_status[chatId] === true && text) {
    let result = findByName(text.slice(1).toLowerCase());
    console.log(text);
    console.log(result);
    if (result) {
      bot.sendPhoto(chatId, image(result.name), {
        caption: vehicle_info_tpl(result.name, result.nation.toLowerCase(), result.rb_br, result.rb_br,result.is_premium)
      });
    }
    search_status[chatId] = false;
  }
});

function findByName(name: string): CSVRow | undefined {
  return vehicles.find(vehicle => vehicle.name.toLowerCase() === name);
}

function vehicle_info_tpl(name: string, nation: string, rb_br: string, ab_br: string,premium: string): string {
  let pr_emoji = premium === "TRUE"?`✅`:`❌`;
  let message: string = `
  Found vehicle:
  Name: ${name}
  Nation: ${emoji[nation]}
  RB BR: ${rb_br}
  AB BR: ${ab_br}
  Premium: ${pr_emoji}`
  ;
  return message;
}

function inline_vehicle_info_tpl(name: string, nation: string, rb_br: string, ab_br: string,premium: string): string {
  let pr_emoji = premium === "TRUE"?`✅`:`❌`;
  const imageUrl = image(name);
  return `
  Found vehicle:
  Name: ${name}
  RB BR: ${rb_br}
  AB BR: ${ab_br}
  Nation: ${emoji[nation]}
  Premium: ${pr_emoji}
  [Vehicle Image](${imageUrl})
  `;
}