const TelegramBot = require('node-telegram-bot-api');
const express = require("express");
const fs = require("fs");

const token = "8304628992:AAFANNXH6syLC1FIuHxKeYd8MIyaWXNTXg4";
const ADMIN_ID = 7707237527;

const QR_LINK = "https://raw.githubusercontent.com/sandipmeena8585-beep/cobra-bot/main/upi_qr.png";
const UPI_ID = "godxcobra@axl";
const CHANNEL_LINK = "https://t.me/+wRZN39fdVcRkYTM9";

const bot = new TelegramBot(token, { polling: true });

// server
const app = express();
app.get("/", (req,res)=>res.send("Running"));
app.listen(process.env.PORT || 3000);

// load keys
let keys = JSON.parse(fs.readFileSync("keys.json"));

const plans = {
  "💎 1 DAY - 100₹": { id: "plan1", days: 1 },
  "💎 7 DAY - 400₹": { id: "plan2", days: 7 },
  "💎 15 DAY - 700₹": { id: "plan3", days: 15 },
  "💎 30 DAY - 900₹": { id: "plan4", days: 30 },
  "💎 60 DAY - 1200₹": { id: "plan5", days: 60 }
};

let userPlan = {};
let selectedPlan = {};
let requestCount = {};
let waitingUTR = {};
let tempUTR = {};

// START
bot.onText(/\/start/, (msg)=>{
  bot.sendMessage(msg.chat.id,
`🔥 COBRA VIP PANEL 🔥

👇 SELECT YOUR PLAN`,
  {
    reply_markup:{
      keyboard:Object.keys(plans).map(p=>[p]),
      resize_keyboard:true
    }
  });
});

// MESSAGE
bot.on("message",(msg)=>{
  const userId = msg.from.id;

  // 🔥 UTR INPUT (FORCE REPLY)
  if (msg.reply_to_message && msg.reply_to_message.text.includes("ENTER YOUR UTR")) {

    const plan = userPlan[userId];
    if (!plan) return;

    tempUTR[userId] = msg.text;

    bot.sendMessage(msg.chat.id,
`🧾 UTR ENTERED:

${msg.text}

👇 CLICK SUBMIT`,
    {
      reply_markup:{
        inline_keyboard:[
          [{text:"✅ SUBMIT",callback_data:"submit_utr"}]
        ]
      }
    });

    return;
  }

  // ADMIN STOCK
  if (selectedPlan[userId]){

    let plan = selectedPlan[userId];
    msg.text.split("\n").forEach(k=>{
      if(keys[plan]) keys[plan].push(k.trim());
    });

    fs.writeFileSync("keys.json",JSON.stringify(keys,null,2));

    bot.sendMessage(msg.chat.id,
`✅ STOCK UPDATED
${plan} ➜ ${keys[plan].length}`);

    selectedPlan[userId]=null;
    return;
  }

  // PLAN SELECT
  if(plans[msg.text]){

    userPlan[userId]=plans[msg.text];

    bot.sendPhoto(msg.chat.id,QR_LINK,{
      caption:
`💰 PAYMENT DETAILS

UPI: ${UPI_ID}

👇 CLICK BELOW`,
      reply_markup:{
        inline_keyboard:[
          [{text:"💸 ENTER UTR",callback_data:"enter_utr"}]
        ]
      }
    });
  }
});

// BUTTON
bot.on("callback_query",(query)=>{

  const data = query.data;
  const userId = query.from.id;

  // ENTER UTR (BOX)
  if(data==="enter_utr"){

    bot.sendMessage(query.message.chat.id,
`🧾 ENTER YOUR UTR NUMBER:

Example: 1234567890`,
    {
      reply_markup:{
        force_reply:true
      }
    });

    bot.answerCallbackQuery(query.id);
  }

  // SUBMIT FINAL
  if(data==="submit_utr"){

    const plan = userPlan[userId];
    const utr = tempUTR[userId];

    if(!plan || !utr) return;

    if(!requestCount[userId]) requestCount[userId]=0;

    if(requestCount[userId]>=3){
      bot.sendMessage(userId,"❌ LIMIT REACHED");
      return;
    }

    requestCount[userId]++;

    let planName = Object.keys(plans).find(p=>plans[p].id===plan.id);

    bot.sendMessage(ADMIN_ID,
`📥 PAYMENT REQUEST

USER: ${userId}
PLAN: ${planName}

UTR: ${utr}`,
{
  reply_markup:{
    inline_keyboard:[[
      {text:"✅ VERIFY",callback_data:`approve_${userId}`},
      {text:"❌ REJECT",callback_data:`reject_${userId}`}
    ]]
  }
});

    bot.sendMessage(userId,"⏳ WAIT FOR VERIFY");
  }

  // VERIFY
  if(data.startsWith("approve_")){

    const userId = data.split("_")[1];
    const plan = userPlan[userId];

    let key = keys[plan.id].shift();
    fs.writeFileSync("keys.json",JSON.stringify(keys,null,2));

    let expiry = new Date();
    expiry.setDate(expiry.getDate()+plan.days);

    bot.sendMessage(userId,
`✅ PAYMENT VERIFIED

🔑 KEY:
\`${key}\`

📅 ${expiry.toDateString()}

🔗 ${CHANNEL_LINK}`,
{parse_mode:"Markdown"});
  }

  // REJECT
  if(data.startsWith("reject_")){
    const userId = data.split("_")[1];

    bot.sendMessage(userId,"❌ PAYMENT REJECTED");
  }

  // ADMIN STOCK
  if(data==="addstock"){
    bot.sendMessage(query.message.chat.id,"Select Plan",{
      reply_markup:{
        inline_keyboard:[
          [{text:"1D",callback_data:"plan1"}],
          [{text:"7D",callback_data:"plan2"}],
          [{text:"15D",callback_data:"plan3"}],
          [{text:"30D",callback_data:"plan4"}],
          [{text:"60D",callback_data:"plan5"}]
        ]
      }
    });
  }

  if(data.startsWith("plan")){
    selectedPlan[userId]=data;
    bot.sendMessage(query.message.chat.id,"Send keys now");
  }
});

// ADMIN PANEL
bot.onText(/\/admin/, (msg)=>{
  if(msg.from.id!==ADMIN_ID) return;

  bot.sendMessage(msg.chat.id,"ADMIN PANEL",{
    reply_markup:{
      inline_keyboard:[
        [{text:"➕ ADD STOCK",callback_data:"addstock"}]
      ]
    }
  });
});
