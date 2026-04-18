const TelegramBot = require('node-telegram-bot-api');
const express = require("express");
const fs = require("fs");

const token = "8304628992:AAFANNXH6syLC1FIuHxKeYd8MIyaWXNTXg4";
const ADMIN_ID = 7707237527;

const QR_LINK = "https://images.weserv.nl/?url=raw.githubusercontent.com/sandipmeena8585-beep/cobra-bot/main/upi_qr.png&w=220&h=220";

const UPI_ID = "godxcobra@axl";
const CHANNEL_LINK = "https://t.me/+wRZN39fdVcRkYTM9";
const PAYMENT_NAME = "SANDIP MEENA";

const bot = new TelegramBot(token, { polling: true });

// SERVER
const app = express();
app.get("/", (req,res)=>res.send("COBRA SERVER MOD RUNNING"));
app.listen(process.env.PORT || 3000);

// SAFE LOAD
function load(file, def){
  try{
    if(!fs.existsSync(file)){
      fs.writeFileSync(file, JSON.stringify(def,null,2));
      return def;
    }
    return JSON.parse(fs.readFileSync(file));
  }catch{
    return def;
  }
}

let keys = load("keys.json", {
  plan1:[], plan2:[], plan3:[], plan4:[], plan5:[]
});

let data = load("data.json", { sold: [] });

// PLANS
const plans = {
  plan1: { name: "1 HOUR - ₹30", hours: 1 },
  plan2: { name: "3 HOUR - ₹50", hours: 3 },
  plan3: { name: "5 HOUR - ₹80", hours: 5 },
  plan4: { name: "1 DAY - ₹120", days: 1 },
  plan5: { name: "7 DAY - ₹400", days: 7 }
};

let userPlan = {};
let waitingScreenshot = {};

// 🔥 MENU (SOLID COBRA STYLE)
function showMenu(chatId) {
  bot.sendMessage(chatId,
`COBRA SERVER MOD

COBRA PANEL

-----------------------------
FAST DELIVERY
SECURE ACCESS
INSTANT ACTIVATION
-----------------------------

SELECT YOUR PLAN`,
  {
    reply_markup: {
      inline_keyboard: [
        [{ text: plans.plan1.name, callback_data: "buy_plan1" }],
        [{ text: plans.plan2.name, callback_data: "buy_plan2" }],
        [{ text: plans.plan3.name, callback_data: "buy_plan3" }],
        [{ text: plans.plan4.name, callback_data: "buy_plan4" }],
        [{ text: plans.plan5.name, callback_data: "buy_plan5" }]
      ]
    }
  });
}

// START
bot.onText(/\/start/, (msg)=>{
  showMenu(msg.chat.id);
});

// MESSAGE
bot.on("message",(msg)=>{
  const userId = msg.from.id;

  // SCREENSHOT
  if(waitingScreenshot[userId] && msg.photo){
    let plan = userPlan[userId];
    if(!plan) return;

    bot.sendPhoto(ADMIN_ID, msg.photo[msg.photo.length-1].file_id, {
      caption: `PAYMENT PROOF

USER ID: ${userId}
PLAN: ${plan.name}`,
      reply_markup:{
        inline_keyboard:[[
          {text:"VERIFY",callback_data:`approve_${userId}`},
          {text:"REJECT",callback_data:`reject_${userId}`}
        ]]
      }
    });

    bot.sendMessage(userId,"WAIT FOR VERIFICATION");
    waitingScreenshot[userId]=false;
    return;
  }

  // UTR
  if(msg.reply_to_message && msg.reply_to_message.text.includes("ENTER YOUR UTR")){
    let plan = userPlan[userId];
    if(!plan) return;

    bot.sendMessage(ADMIN_ID,
`NEW PAYMENT REQUEST

USER ID: ${userId}
PLAN: ${plan.name}

UTR: ${msg.text}`,
{
  reply_markup:{
    inline_keyboard:[[
      {text:"VERIFY",callback_data:`approve_${userId}`},
      {text:"REJECT",callback_data:`reject_${userId}`}
    ]]
  }
});

    bot.sendMessage(userId,"WAIT FOR VERIFICATION");
    return;
  }

  if(msg.text && !msg.text.startsWith("/")){
    showMenu(msg.chat.id);
  }
});

// BUTTONS
bot.on("callback_query",(query)=>{
  const dataBtn = query.data;
  const userId = query.from.id;

  if(dataBtn.startsWith("buy_")){
    let planId = dataBtn.split("_")[1];
    userPlan[userId] = { ...plans[planId], id: planId };

    bot.sendPhoto(userId,QR_LINK,{
      caption: `PAYMENT DETAILS

NAME: ${PAYMENT_NAME}

PLAN:
${plans[planId].name}

-----------------------------
UPI ID:
${UPI_ID}
-----------------------------

COMPLETE PAYMENT AND SUBMIT`,
      reply_markup:{
        inline_keyboard:[
          [{text:"SEND SCREENSHOT",callback_data:"ss"}],
          [{text:"ENTER UTR",callback_data:"utr"}]
        ]
      }
    });
  }

  if(dataBtn==="ss"){
    waitingScreenshot[userId]=true;
    bot.sendMessage(userId,"SEND PAYMENT SCREENSHOT");
  }

  if(dataBtn==="utr"){
    bot.sendMessage(userId,"ENTER YOUR UTR",{reply_markup:{force_reply:true}});
  }

  // VERIFY
  if(dataBtn.startsWith("approve_")){
    if(query.from.id != ADMIN_ID) return;

    let uid = dataBtn.split("_")[1];
    let plan = userPlan[uid];
    if(!plan) return;

    let key = "COBRA-" + Math.random().toString(36).substr(2,8).toUpperCase();

    let expiry = new Date();
    if(plan.hours){
      expiry.setHours(expiry.getHours()+plan.hours);
    } else {
      expiry.setDate(expiry.getDate()+plan.days);
    }

    bot.sendMessage(uid,
`PAYMENT VERIFIED

KEY:
${key}

VALID TILL:
${expiry}

JOIN:
${CHANNEL_LINK}`);

    delete userPlan[uid];
  }

  // REJECT
  if(dataBtn.startsWith("reject_")){
    if(query.from.id != ADMIN_ID) return;
    let uid = dataBtn.split("_")[1];
    bot.sendMessage(uid,"PAYMENT FAILED - TRY AGAIN");
  }
});
