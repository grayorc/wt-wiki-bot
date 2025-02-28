import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import csv from 'csv-parser';

interface CSVRow {
  name: string;
  rb_br: string;
  nation: string;
}

const flags_emoji: { [key: string ]: string } = {
  "britain":"🇬🇧",
  "china":"🇨🇳",
  "france":"🇫🇷",
  "germany":"🇩🇪",
  "israel":"🇮🇱",
  "italy":"🇮🇹",
  "japan":"🇯🇵",
  "sweden":"🇸🇪",
  "usa":"🇺🇸",
  "ussr":"🇷🇺"
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

bot.on('inline_query', (query) => {
  const queryText = query.query.trim().toLowerCase();
  const searchResult = findArrayByName(queryText);

  const results: TelegramBot.InlineQueryResultArticle[] = searchResult.map((vehicle, index) => ({
    type: 'article',
    id: String(index),
    title: vehicle.name,
    description: `RB BR: ${vehicle.rb_br} | Nation: ${flags_emoji[vehicle.nation.toLowerCase()]}`,
    input_message_content: {
      message_text: vehicle_info_tpl(vehicle.name, vehicle.nation.toLowerCase(), vehicle.rb_br, vehicle.rb_br)
    }
  }));

  bot.answerInlineQuery(query.id, results);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  find_status[chatId] = false;
  bot.sendMessage(chatId, "Hello world!");
});

bot.onText(/\/find/, (msg) => {
  const chatId = msg.chat.id;
  find_status[chatId] = true;
  bot.sendMessage(chatId, "What vehicle are you looking for? \n hint: `a_10c`", { parse_mode: 'Markdown' });
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (find_status[chatId] === true && text) {
    const searchResult = findArrayByName(text.trim().toLowerCase());
    console.log(searchResult.length);
    if (searchResult) {
        find_status[chatId] = true;
        if(searchResult.length > 1){
          let message:string = "Choose your vehicle from the list:\n"
            searchResult.forEach(element => {
              message += `/${element.name}\n`;
          });
        search_status[chatId] = true;
        bot.sendMessage(chatId, message);
        }else{
          let imageUrl = `https://natgo.xyz/files/wt/images/garageimages/${searchResult[0].name}.jpg`;
          bot.sendPhoto(chatId,imageUrl,{ caption: vehicle_info_tpl(searchResult[0].name, searchResult[0].nation.toLocaleLowerCase(), searchResult[0].rb_br,searchResult[0].rb_br) })
          // bot.sendMessage(chatId, vehicle_info_tpl(searchResult[0].name, searchResult[0].nation.toLocaleLowerCase(), searchResult[0].rb_br,searchResult[0].rb_br));
        }
      find_status[chatId] = false;
    } else {
      bot.sendMessage(chatId, "Vehicle not found. Please try again.");
    }
  }else if (search_status[chatId] === true && text) { 
    let result = findByName(text.slice(1));
    console.log(text);
    console.log(result);
    if (result) {
      let imageUrl = `https://natgo.xyz/files/wt/images/garageimages/${result.name}.jpg`;
      bot.sendPhoto(
        chatId, 
        imageUrl ,{ 
        caption : vehicle_info_tpl(result.name, result.nation.toLocaleLowerCase(), result.rb_br,result.rb_br)
      });
      bot.sendMessage(chatId, vehicle_info_tpl(result.name, result.nation.toLocaleLowerCase(), result.rb_br,result.rb_br));
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

function vehicle_info_tpl(name: string, nation: string, rb_br: string, ab_br: string): string {
  console.log(flags_emoji[nation])
  let message: string = `
  Found vehicle:
  Name: ${name}
  RB BR: ${rb_br}
  AB BR: ${ab_br}
  Nation: ${flags_emoji[nation]}
  `;
  return message;
}
