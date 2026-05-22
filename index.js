const TelegramBot = require('node-telegram-bot-api');
const express = require("express");
const mongoose = require("mongoose");

// ===== CONFIG =====
const token = process.env.BOT_TOKEN || "8304628992:AAFHjdhzF33fiH2QHjQScU9lK2zgqAx7nIc";
const ADMIN_ID = 7707237527;

const MONGO_URL = "mongodb+srv://COBRA:Cobra%4012345@cluster0.uqwcyny.mongodb.net/cobra?retryWrites=true&w=majority";

const CHANNEL_LINK = "https://t.me/+wRZN39fdVcRkYTM9";

const UPI_ID = "godxcobra@axl";

const QR_LINK = "https://images.weserv.nl/?url=raw.githubusercontent.com/sandipmeena8585-beep/cobra-bot/main/upi_qr.png";

// ===== SERVER =====
const app = express();

app.get("/",(req,res)=>{
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
command:"menu",
description:"🛍 Shop Menu"
},
{
command:"history",
description:"📜 My Orders"
},
{
command:"admin",
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

const User = mongoose.model("User",{
id:Number
});

// ===== PLANS =====
const plans = {

plan1:{
name:"⏱ 1 DAY — ₹100",
days:1,
price:"100"
},

plan2:{
name:"⏱ 3 DAY — ₹200",
days:3,
price:"200"
},

plan3:{
name:"⏱ 7 DAY — ₹400",
days:7,
price:"400"
},

plan4:{
name:"⏱ 15 DAY — ₹600",
days:15,
price:"600"
},

plan5:{
name:"⏱ 30 DAY — ₹800",
days:30,
price:"800"
},

plan6:{
name:"⏱ 60 DAY — ₹1200",
days:60,
price:"1200"
}

};

// ===== STATE =====
let userPlan = {};
let selectedPlan = {};
let waitingUTR = {};
let waitingSS = {};
let deleteMode = {};

let lockedUser = {};
let usedUTR = new Set();

// ===== HOME =====
async function home(id){

let txt =
`🛍 𝐂𝐎𝐁𝐑𝐀 𝐊𝐄𝐘 𝐒𝐇𝐎𝐏 🛍

✨ Welcome! Pick a product below.
⚡ Instant key delivery after approval.

━━━━━━━━━━━━━━━

📸 After payment send screenshot.
⚡ Key delivered instantly after approval!`;

bot.sendMessage(id,txt,{
reply_markup:{
keyboard:[
["🛒 COBRA SERVER"],
["📜 MY ORDERS"],
["👤 ACCOUNT","📊 INFO"],
["⚙️ HELP"]
],
resize_keyboard:true,
persistent:true,
one_time_keyboard:false
}
});

}

// ===== START =====
bot.onText(/\/start/,async msg=>{

await User.updateOne(
{id:msg.from.id},
{id:msg.from.id},
{upsert:true}
);

home(msg.from.id);

});

// ===== MENU =====
bot.onText(/\/menu/,async msg=>{

let id = msg.chat.id;

let keyboard = [];

for(let p in plans){

let stock = await Key.countDocuments({plan:p});

keyboard.push([
{
text:`${plans[p].name}\n📦 STOCK: ${stock}`,
callback_data:`buy_${p}`
}
]);

}

bot.sendMessage(id,
`🛒 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑

👇 TAP A PLAN TO PURCHASE`,
{
reply_markup:{
inline_keyboard:keyboard
}
});

});

// ===== HISTORY =====
bot.onText(/\/history/,async msg=>{

let id = msg.chat.id;

let orders = await Sale.find({user:id})
.sort({createdAt:-1})
.limit(5);

if(!orders.length){
return bot.sendMessage(id,"❌ NO ORDERS");
}

let txt = `📜 YOUR ORDERS\n\n`;

orders.forEach((o,i)=>{

txt +=
`${i+1}. ${o.plan}

KEY:
${o.key}

EXPIRE:
${o.expiry.toLocaleString()}

━━━━━━━━━━━━━━━

`;

});

bot.sendMessage(id,txt);

});

// ===== MESSAGE =====
bot.on("message",async msg=>{

let id = msg.from.id;

// ===== LOCK =====
if(lockedUser[id]){
return bot.sendMessage(id,
`📬 ORDER RECEIVED

✅ Payment already submitted
⏳ Waiting for admin approval`);
}

// ===== SHOP =====
if(msg.text==="🛒 COBRA SERVER"){

let keyboard = [];

for(let p in plans){

let stock = await Key.countDocuments({plan:p});

keyboard.push([
{
text:`${plans[p].name}\n📦 STOCK: ${stock}`,
callback_data:`buy_${p}`
}
]);

}

return bot.sendMessage(id,
`🛒 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑

👇 TAP A PLAN TO PURCHASE`,
{
reply_markup:{
inline_keyboard:keyboard
}
});

}

// ===== MY ORDERS =====
if(msg.text==="📜 MY ORDERS"){

let orders = await Sale.find({user:id})
.sort({createdAt:-1})
.limit(5);

if(!orders.length){
return bot.sendMessage(id,"❌ NO ORDERS");
}

let txt = `📜 YOUR ORDERS\n\n`;

orders.forEach((o,i)=>{

txt +=
`${i+1}. ${o.plan}

KEY:
${o.key}

EXPIRE:
${o.expiry.toLocaleString()}

━━━━━━━━━━━━━━━

`;

});

return bot.sendMessage(id,txt);

}

// ===== ACCOUNT =====
if(msg.text==="👤 ACCOUNT"){

let latest = await Sale.findOne({user:id})
.sort({createdAt:-1});

if(!latest){
return bot.sendMessage(id,"❌ NO ACTIVE PLAN");
}

return bot.sendMessage(id,
`👤 𝐀𝐂𝐂𝐎𝐔𝐍𝐓

🔥 𝐋𝐀𝐓𝐄𝐒𝐓

🔑 KEY:
\`${latest.key}\`

━━━━━━━━━━━━━━━

⏳ EXPIRE:
${latest.expiry.toLocaleString()}

━━━━━━━━━━━━━━━

⚡ KILL LIMIT 10 12
🛡 LEGIT PLAY SAFE

🔥 ENJOY COBRA SERVER`,
{
parse_mode:"Markdown"
});

}

// ===== INFO =====
if(msg.text==="📊 INFO"){

return bot.sendMessage(id,
`📊 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑

━━━━━━━━━━━━━━━

ESP - 350M
AIMBOT - 150M
IPDA VIEW - YES / NO

━━━━━━━━━━━━━━━

⚡ FAST SERVER
🛡 SAFE PLAY
🔥 PREMIUM EXPERIENCE`);

}

// ===== HELP =====
if(msg.text==="⚙️ HELP"){

return bot.sendMessage(id,
`⚙️ HELP CENTER

━━━━━━━━━━━━━━━

KEY ISSUE
PAYMENT ISSUE

━━━━━━━━━━━━━━━

CONTACT OWNER
👉 @GODx_COBRA`);

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

return bot.sendMessage(id,"✅ STOCK ADDED");

}

// ===== DELETE KEY =====
if(deleteMode[id]){

await Key.deleteOne({
key:msg.text.trim()
});

deleteMode[id]=false;

return bot.sendMessage(id,"🗑 KEY DELETED");

}

// ===== UTR =====
if(waitingUTR[id]){

waitingUTR[id]=false;

if(usedUTR.has(msg.text)){
return bot.sendMessage(id,"❌ UTR ALREADY USED");
}

usedUTR.add(msg.text);

lockedUser[id]=true;

return bot.sendMessage(ADMIN_ID,
`💳 PAYMENT REQUEST

━━━━━━━━━━━━━━━

USER: ${id}

PLAN:
${userPlan[id].name}

━━━━━━━━━━━━━━━

UTR:
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

}

// ===== SCREENSHOT =====
if(waitingSS[id] && msg.photo){

waitingSS[id]=false;

lockedUser[id]=true;

bot.sendPhoto(
ADMIN_ID,
msg.photo.pop().file_id,
{
caption:
`💳 SCREENSHOT PAYMENT

━━━━━━━━━━━━━━━

USER: ${id}

PLAN:
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
`📬 ORDER RECEIVED!

✅ Screenshot submitted successfully!
⏳ Waiting for approval

⚡ You'll receive your key once approved!`);

}

});

// ===== CALLBACK =====
bot.on("callback_query",async q=>{

let d = q.data;
let id = q.from.id;

bot.answerCallbackQuery(q.id);

// ===== BUY =====
if(d.startsWith("buy_")){

let p = d.split("_")[1];

userPlan[id] = {
...plans[p],
id:p
};

return bot.sendPhoto(id,QR_LINK,{
caption:
`💳 PAYMENT PAGE

🎮 COBRA SERVER
⏱ PLAN: ${plans[p].name}
💰 AMOUNT: ₹${plans[p].price}

━━━━━━━━━━━━━━━

💳 PAY VIA UPI ID

\`${UPI_ID}\`

━━━━━━━━━━━━━━━

📸 Send screenshot after payment.
⚡ Key delivered instantly after approval.

🔒 SAFE & SECURE PAYMENT`,
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

// ===== SCREENSHOT BUTTON =====
if(d==="ss"){

waitingSS[id]=true;

return bot.sendMessage(id,
`📸 SEND PAYMENT SCREENSHOT`);

}

// ===== UTR BUTTON =====
if(d==="utr"){

waitingUTR[id]=true;

return bot.sendMessage(id,
`💳 ENTER UTR NUMBER`,{
reply_markup:{
force_reply:true
}
});

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

let key = await Key.findOneAndDelete({
plan:userPlan[uid].id
});

if(!key){
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
`🔥 𝐄𝐍𝐉𝐎𝐘 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑 🔥

━━━━━━━━━━━━━━━

🔑 KEY

\`${key.key}\`

━━━━━━━━━━━━━━━

⚡ KILL LIMIT 10 12
🛡 LEGIT PLAY SAFE`,
{
parse_mode:"Markdown",
reply_markup:{
inline_keyboard:[
[
{
text:"📦 JOIN PAID GROUP",
url:CHANNEL_LINK
}
]
]
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
`❌ PAYMENT REJECTED`);

}

// ===== ADMIN ADD STOCK =====
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

selectedPlan[id] =
d.replace("plan_","");

return bot.sendMessage(id,
`SEND KEYS LINE BY LINE`);

}

// ===== DELETE KEY =====
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

let expired =
await Sale.countDocuments({
expiry:{$lt:new Date()}
});

let txt =
`📊 ADMIN STATS

━━━━━━━━━━━━━━━

📦 STOCK: ${stock}
🔥 SOLD: ${sold}
⏳ EXPIRED: ${expired}

━━━━━━━━━━━━━━━

`;

for(let p in plans){

let c =
await Key.countDocuments({
plan:p
});

txt +=
`${plans[p].name}

📦 ${c} KEYS

━━━━━━━━━━━━━━━

`;

}

return bot.sendMessage(id,txt);

}

});

// ===== ADMIN PANEL =====
bot.onText(/\/admin/,msg=>{

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
