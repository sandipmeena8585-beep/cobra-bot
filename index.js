const TelegramBot = require('node-telegram-bot-api');
const express = require("express");
const mongoose = require("mongoose");

// ===== CONFIG =====
const token = process.env.BOT_TOKEN || "8304628992:AAFHjdhzF33fiH2QHjQScU9lK2zgqAx7nIc";
const ADMIN_ID = 7707237527;

const MONGO_URL =
"mongodb+srv://COBRA:Cobra%4012345@cluster0.uqwcyny.mongodb.net/cobra?retryWrites=true&w=majority";

const CHANNEL_LINK = "https://t.me/+wRZN39fdVcRkYTM9";

const UPI_ID = "godxcobra@axl";

const QR_LINK =
"https://images.weserv.nl/?url=raw.githubusercontent.com/sandipmeena8585-beep/cobra-bot/main/upi_qr.png";

// ===== SERVER =====
const app = express();

app.get("/", (req, res) => {
res.send("COBRA BOT RUNNING");
});

app.listen(process.env.PORT || 3000);

// ===== BOT =====
const bot = new TelegramBot(token, {
polling: true
});

// ===== COMMAND MENU =====
bot.setMyCommands([
{
command:"start",
description:"🏠 Main Menu"
},
{
command:"menu",
description:"🛒 Shop Menu"
},
{
command:"history",
description:"📜 My Orders"
},
{
command:"help",
description:"⚙️ Help Center"
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
name:"🛒 INFINITE LOADER",
days:1,
price:"100"
},

plan2:{
name:"🛒 DRACO MOD",
days:3,
price:"200"
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

// ===== AUTO DELETE =====
async function autoDelete(chatId,messageId){

setTimeout(async()=>{

try{
await bot.deleteMessage(chatId,messageId);
}catch(e){}

},15000);

}

// ===== HOME =====
async function home(id){

let txt =
`🛍 𝐊𝐄𝐘 𝐒𝐇𝐎𝐏 🛍

👋 Welcome! Pick a product below.
✨ Only plans with stock are shown.

━━━━━━━━━━━━━━━

📸 After payment send screenshot here.
⚡ Key delivered instantly after approval!`;

bot.sendMessage(id,txt,{
reply_markup:{
keyboard:[
["🛒 INFINITE LOADER"],
["🛒 DRACO MOD"],
["🧾 My Orders"]
],
resize_keyboard:true,
is_persistent:true
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

// ===== HELP =====
bot.onText(/\/help/,async msg=>{

bot.sendMessage(msg.chat.id,
`⚙️ HELP CENTER

━━━━━━━━━━━━━━━

KEY ISSUE
PAYMENT ISSUE

━━━━━━━━━━━━━━━

CONTACT OWNER
👉 @GODx_COBRA`);

});

// ===== HISTORY =====
bot.onText(/\/history/,async msg=>{

let id = msg.chat.id;

let orders =
await Sale.find({user:id})
.sort({createdAt:-1})
.limit(5);

if(!orders.length){
return bot.sendMessage(id,
"❌ NO ORDERS");
}

let txt =
`📜 YOUR ORDERS

`;

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

// ===== MENU =====
bot.onText(/\/menu/,async msg=>{

let id = msg.chat.id;

let keyboard = [];

for(let p in plans){

let stock =
await Key.countDocuments({plan:p});

keyboard.push([
{
text:`${plans[p].name}
📦 STOCK: ${stock}`,
callback_data:`buy_${p}`
}
]);

}

bot.sendMessage(id,
`🛒 SELECT PRODUCT`,
{
reply_markup:{
inline_keyboard:keyboard
}
});

});

// ===== MESSAGE =====
bot.on("message",async msg=>{

let id = msg.from.id;

// ===== DELETE RANDOM CHAT =====
if(
msg.text &&
!msg.text.startsWith("/") &&
msg.from.id !== ADMIN_ID &&
msg.text !== "🛒 INFINITE LOADER" &&
msg.text !== "🛒 DRACO MOD" &&
msg.text !== "🧾 My Orders"
){

try{
await bot.deleteMessage(msg.chat.id,msg.message_id);
}catch(e){}

}

// ===== BUTTONS =====
if(msg.text==="🛒 INFINITE LOADER"){

return bot.sendMessage(id,"/menu");

}

if(msg.text==="🛒 DRACO MOD"){

return bot.sendMessage(id,"/menu");

}

if(msg.text==="🧾 My Orders"){

return bot.sendMessage(id,"/history");

}

// ===== LOCK =====
if(lockedUser[id]){

let m =
await bot.sendMessage(id,
`📬 ORDER RECEIVED

✅ Payment already submitted
⏳ Waiting for admin approval`);

return autoDelete(id,m.message_id);

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

return bot.sendPhoto(id,
QR_LINK,
{
caption:
`💳 PAYMENT PAGE

🎮 ${plans[p].name}
💰 AMOUNT: ₹${plans[p].price}

━━━━━━━━━━━━━━━

💳 PAY VIA UPI ID

\`${UPI_ID}\`

━━━━━━━━━━━━━━━

📸 Send screenshot after payment.`,
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

// ===== SS =====
if(d==="ss"){

waitingSS[id]=true;

let m =
await bot.sendMessage(id,
"📸 SEND PAYMENT SCREENSHOT");

autoDelete(id,m.message_id);

}

// ===== UTR =====
if(d==="utr"){

waitingUTR[id]=true;

let m =
await bot.sendMessage(id,
"💳 ENTER UTR NUMBER");

autoDelete(id,m.message_id);

}

// ===== APPROVE =====
if(d.startsWith("approve_")){

let uid = d.split("_")[1];

let key =
await Key.findOneAndDelete({
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
`🔥 ENJOY COBRA SERVER 🔥

━━━━━━━━━━━━━━━

🔑 KEY

\`${key.key}\`

━━━━━━━━━━━━━━━

⚡ LEGIT PLAY SAFE`,
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

let uid = d.split("_")[1];

lockedUser[uid]=false;

bot.sendMessage(uid,
`❌ PAYMENT REJECTED`);

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

// ===== PLAN =====
if(d.startsWith("plan_")){

if(id!==ADMIN_ID) return;

selectedPlan[id] =
d.replace("plan_","");

return bot.sendMessage(id,
"SEND KEYS LINE BY LINE");

}

// ===== DELETE =====
if(d==="delkey"){

if(id!==ADMIN_ID) return;

deleteMode[id]=true;

return bot.sendMessage(id,
"SEND KEY TO DELETE");

}

// ===== STATS =====
if(d==="stats"){

if(id!==ADMIN_ID) return;

let stock =
await Key.countDocuments();

let sold =
await Sale.countDocuments();

bot.sendMessage(id,
`📊 ADMIN STATS

📦 STOCK: ${stock}
🔥 SOLD: ${sold}`);

}

});

// ===== ADMIN =====
bot.onText(/\/(admin|sami)/,msg=>{

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
