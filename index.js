const TelegramBot = require('node-telegram-bot-api');
const express = require("express");
const mongoose = require("mongoose");

// ===== CONFIG =====
const token = process.env.BOT_TOKEN || "8304628992:AAFHjdhzF33fiH2QHjQScU9lK2zgqAx7nIc";
const ADMIN_ID = 7707237527;

const MONGO_URL =
"mongodb+srv://COBRA:Cobra%4012345@cluster0.uqwcyny.mongodb.net/cobra?retryWrites=true&w=majority";

const CHANNEL_LINK =
"https://t.me/+wRZN39fdVcRkYTM9";

const UPI_ID = "godxcobra@axl";

const QR_LINK =
"https://images.weserv.nl/?url=raw.githubusercontent.com/sandipmeena8585-beep/cobra-bot/main/upi_qr.png";

// ===== SERVER =====
const app = express();

app.get("/", (req,res)=>{
res.send("COBRA BOT RUNNING");
});

app.listen(process.env.PORT || 3000);

// ===== BOT =====
const bot = new TelegramBot(token,{polling:true});

// ===== COMMAND MENU =====
bot.setMyCommands([
{
command:"start",
description:"🏠 Main Menu"
},
{
command:"cobra",
description:"🛒 COBRA SERVER"
},
{
command:"orders",
description:"📜 My Orders"
},
{
command:"help",
description:"⚙️ Help Center"
},
{
command:"sami",
description:"⚙️ Admin Panel"
}
]);

// ===== DATABASE =====
mongoose.connect(MONGO_URL);

// ===== MODELS =====
const Key = mongoose.model("Key",{
plan:String,
key:String
});

const Sale = mongoose.model("Sale",{
user:String,
key:String,
plan:String,
expiry:Date,
createdAt:{
type:Date,
default:Date.now
}
});

// ===== PLANS =====
const plans = {

plan1:{
name:"5 HOUR - ₹40",
days:0,
price:"40"
},

plan2:{
name:"1 DAY - ₹80",
days:1,
price:"80"
},

plan3:{
name:"3 DAY - ₹190",
days:3,
price:"190"
},

plan4:{
name:"7 DAY - ₹350",
days:7,
price:"350"
},

plan5:{
name:"15 DAY - ₹590",
days:15,
price:"590"
},

plan6:{
name:"30 DAY - ₹750",
days:30,
price:"750"
},

plan7:{
name:"60 DAY - ₹1150",
days:60,
price:"1150"
}

};

// ===== STATE =====
let userPlan = {};
let waitingSS = {};
let waitingUTR = {};
let selectedPlan = {};
let deleteMode = {};
let lockedUser = {};
let usedUTR = new Set();

// ===== START =====
bot.onText(/\/start/, async msg=>{

bot.sendMessage(msg.chat.id,
`🛍 𝐂𝐎𝐁𝐑𝐀 𝐊𝐄𝐘 𝐒𝐇𝐎𝐏 🛍

✨ Welcome! Pick a product below.
⚡ Instant key delivery after approval.

━━━━━━━━━━━━━━━

📸 After payment send screenshot.
⚡ Key delivered instantly after approval!

━━━━━━━━━━━━━━━

⬅️ LEFT SIDE MENU TAP KRO`,
{
reply_markup:{
remove_keyboard:true
}
});

});

// ===== COBRA =====
bot.onText(/\/cobra/, async msg=>{

let keyboard = [];

for(let p in plans){

let stock =
await Key.countDocuments({plan:p});

keyboard.push([
{
text:`🛒 ${plans[p].name} | 📦 ${stock}`,
callback_data:`buy_${p}`
}
]);

}

keyboard.push([
{
text:"📜 MY ORDERS",
callback_data:"orders"
}
]);

bot.sendMessage(msg.chat.id,
`🛒 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑

👇 SELECT PLAN`,
{
reply_markup:{
inline_keyboard:keyboard
}
});

});

// ===== ORDERS =====
bot.onText(/\/orders/, async msg=>{

let orders =
await Sale.find({user:msg.chat.id})
.sort({createdAt:-1})
.limit(5);

if(!orders.length){
return bot.sendMessage(
msg.chat.id,
"❌ NO ORDERS"
);
}

let txt = `📜 YOUR ORDERS\n\n`;

orders.forEach((o,i)=>{

txt +=
`${i+1}. ${o.plan}

🔑 KEY:
${o.key}

━━━━━━━━━━━━━━━

`;

});

bot.sendMessage(msg.chat.id,txt);

});

// ===== HELP =====
bot.onText(/\/help/, msg=>{

bot.sendMessage(msg.chat.id,
`⚙️ HELP CENTER

━━━━━━━━━━━━━━━

📌 PAYMENT ISSUE
📌 KEY ISSUE

━━━━━━━━━━━━━━━

👤 OWNER:
👉 @GODx_COBRA`);

});

// ===== MESSAGE =====
bot.on("message", async msg=>{

let id = msg.from.id;

// ===== LOCK =====
if(
lockedUser[id] &&
!msg.photo &&
!waitingUTR[id]
){
return;
}

// ===== ADD STOCK =====
if(selectedPlan[id]){

for(let k of msg.text.split("\n")){

if(k.trim()){

await Key.create({
plan:selectedPlan[id],
key:k.trim()
});

}

}

selectedPlan[id]=null;

return bot.sendMessage(id,
"✅ STOCK ADDED");

}

// ===== DELETE KEY =====
if(deleteMode[id]){

await Key.deleteOne({
key:msg.text.trim()
});

deleteMode[id]=false;

return bot.sendMessage(id,
"🗑 KEY DELETED");

}

// ===== UTR =====
if(waitingUTR[id]){

waitingUTR[id]=false;

if(usedUTR.has(msg.text)){
return bot.sendMessage(id,
"❌ UTR ALREADY USED");
}

usedUTR.add(msg.text);

lockedUser[id]=true;

let x = await bot.sendMessage(
ADMIN_ID,
`💳 PAYMENT REQUEST

━━━━━━━━━━━━━━━

👤 USER:
${id}

📦 PLAN:
${userPlan[id].name}

━━━━━━━━━━━━━━━

💳 UTR:
${msg.text}`,
{
reply_markup:{
inline_keyboard:[[
{
text:"✅ VERIFY",
callback_data:`approve_${id}`
},
{
text:"❌ REJECT",
callback_data:`reject_${id}`
}
]]
}
});

return;
}

// ===== SCREENSHOT =====
if(waitingSS[id] && msg.photo){

waitingSS[id]=false;

lockedUser[id]=true;

// ===== DELETE USER SCREENSHOT =====
try{
await bot.deleteMessage(
id,
msg.message_id
);
}catch(e){}

bot.sendPhoto(
ADMIN_ID,
msg.photo.pop().file_id,
{
caption:
`💳 SCREENSHOT PAYMENT

━━━━━━━━━━━━━━━

👤 USER:
${id}

📦 PLAN:
${userPlan[id].name}`,

reply_markup:{
inline_keyboard:[[
{
text:"✅ VERIFY",
callback_data:`approve_${id}`
},
{
text:"❌ REJECT",
callback_data:`reject_${id}`
}
]]
}
}
);

return bot.sendMessage(id,
`⏳ PAYMENT SENT FOR VERIFY

📦 PLAN:
${userPlan[id].name}`);

}

});

// ===== CALLBACK =====
bot.on("callback_query", async q=>{

let d = q.data;
let id = q.from.id;

bot.answerCallbackQuery(q.id);

// ===== BUY =====
if(d.startsWith("buy_")){

let p = d.split("_")[1];

userPlan[id]={
...plans[p],
id:p
};

return bot.sendPhoto(id,QR_LINK,{
caption:
`💳 PAYMENT PAGE

📦 PLAN:
${plans[p].name}

💰 PRICE:
₹${plans[p].price}

━━━━━━━━━━━━━━━

💳 PAY VIA UPI

\`${UPI_ID}\`

━━━━━━━━━━━━━━━

📸 SEND SCREENSHOT
OR
💳 SEND UTR`,
parse_mode:"Markdown",
reply_markup:{
inline_keyboard:[
[
{
text:"📸 SEND SCREENSHOT",
callback_data:"ss"
}
],
[
{
text:"💳 ENTER UTR",
callback_data:"utr"
}
]
]
}
});

}

// ===== ORDERS =====
if(d==="orders"){

let orders =
await Sale.find({user:id})
.sort({createdAt:-1})
.limit(5);

if(!orders.length){
return bot.sendMessage(id,
"❌ NO ORDERS");
}

let txt = `📜 YOUR ORDERS\n\n`;

orders.forEach((o,i)=>{

txt +=
`${i+1}. ${o.plan}

🔑 KEY:
${o.key}

━━━━━━━━━━━━━━━

`;

});

return bot.sendMessage(id,txt);

}

// ===== SCREENSHOT =====
if(d==="ss"){

waitingSS[id]=true;

return bot.sendMessage(id,
`📸 SEND PAYMENT SCREENSHOT`);

}

// ===== UTR =====
if(d==="utr"){

waitingUTR[id]=true;

return bot.sendMessage(id,
`💳 SEND UTR NUMBER`);

}

// ===== APPROVE =====
if(d.startsWith("approve_")){

await bot.editMessageReplyMarkup(
{inline_keyboard:[]},
{
chat_id:q.message.chat.id,
message_id:q.message.message_id
}
);

let uid = d.split("_")[1];

let key =
await Key.findOneAndDelete({
plan:userPlan[uid].id
});

if(!key){

lockedUser[uid]=false;

return bot.sendMessage(
ADMIN_ID,
"❌ NO STOCK"
);
}

let exp = new Date();

exp.setDate(
exp.getDate() +
userPlan[uid].days
);

await Sale.create({
user:uid,
key:key.key,
plan:userPlan[uid].name,
expiry:exp
});

bot.sendMessage(uid,
`🔥 COBRA SERVER APPROVED 🔥

━━━━━━━━━━━━━━━

🔑 KEY

\`${key.key}\`

━━━━━━━━━━━━━━━

📦 PLAN:
${userPlan[uid].name}

━━━━━━━━━━━━━━━

⚡ ENJOY`,
{
parse_mode:"Markdown",
reply_markup:{
inline_keyboard:[[
{
text:"📦 JOIN PAID GROUP",
url:CHANNEL_LINK
}
]]
}
});

lockedUser[uid]=false;

delete userPlan[uid];

}

// ===== REJECT =====
if(d.startsWith("reject_")){

await bot.editMessageReplyMarkup(
{inline_keyboard:[]},
{
chat_id:q.message.chat.id,
message_id:q.message.message_id
}
);

let uid = d.split("_")[1];

lockedUser[uid]=false;

bot.sendMessage(uid,
`❌ ORDER REJECTED`);

}

// ===== ADD STOCK =====
if(d==="addstock"){

if(id!==ADMIN_ID) return;

return bot.sendMessage(id,
`SELECT PLAN`,
{
reply_markup:{
inline_keyboard:
Object.keys(plans).map(p=>[
{
text:plans[p].name,
callback_data:`plan_${p}`
}
])
}
});

}

// ===== PLAN SELECT =====
if(d.startsWith("plan_")){

if(id!==ADMIN_ID) return;

selectedPlan[id]=
d.replace("plan_","");

return bot.sendMessage(id,
`SEND KEYS LINE BY LINE`);

}

// ===== DELETE =====
if(d==="delkey"){

if(id!==ADMIN_ID) return;

deleteMode[id]=true;

return bot.sendMessage(id,
`SEND KEY TO DELETE`);

}

// ===== STATS =====
if(d==="stats"){

if(id!==ADMIN_ID) return;

let stock =
await Key.countDocuments();

let sold =
await Sale.countDocuments();

return bot.sendMessage(id,
`📊 ADMIN STATS

━━━━━━━━━━━━━━━

📦 STOCK: ${stock}
🔥 SOLD: ${sold}`);

}

});

// ===== ADMIN PANEL =====
bot.onText(/\/sami/, msg=>{

if(msg.from.id!==ADMIN_ID)
return;

bot.sendMessage(msg.chat.id,
`⚙️ ADMIN PANEL`,
{
reply_markup:{
inline_keyboard:[
[
{
text:"➕ ADD STOCK",
callback_data:"addstock"
}
],
[
{
text:"🗑 DELETE KEY",
callback_data:"delkey"
}
],
[
{
text:"📊 STATS",
callback_data:"stats"
}
]
]
}
});

});
