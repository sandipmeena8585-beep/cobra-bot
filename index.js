const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const mongoose = require("mongoose");

// ================= ENV =================

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URL = process.env.MONGO_URL;

const ADMIN_ID = Number(process.env.ADMIN_ID);
const UPI_ID = process.env.UPI_ID;
const CHANNEL_LINK = process.env.CHANNEL_LINK;
const QR_LINK = process.env.QR_LINK;
const SUPPORT = process.env.SUPPORT_USERNAME;

// ================= SERVER =================

const app = express();

app.get("/", (req,res)=>{
res.send("COBRA SERVER RUNNING");
});

app.listen(process.env.PORT || 3000);

// ================= BOT =================

const bot = new TelegramBot(
BOT_TOKEN,
{
polling:true
}
);

// ================= DATABASE =================

mongoose.connect(MONGO_URL)
.then(()=>{
console.log("✅ MongoDB Connected");
})
.catch(err=>{
console.log(err);
});

// ================= MODELS =================

const Key = mongoose.model(
"Key",
{
plan:String,
key:String
}
);

const Sale = mongoose.model(
"Sale",
{
user:Number,
key:String,
plan:String,
expiry:Date,
createdAt:{
type:Date,
default:Date.now
}
}
);

// ================= PLANS =================

const plans = {

plan1:{
name:"🕐 5 HOUR",
price:40,
hours:5
},

plan2:{
name:"📅 1 DAY",
price:80,
days:1
},

plan3:{
name:"📅 3 DAY",
price:190,
days:3
},

plan4:{
name:"📅 7 DAY",
price:350,
days:7
},

plan5:{
name:"📅 15 DAY",
price:590,
days:15
},

plan6:{
name:"📅 30 DAY",
price:750,
days:30
},

plan7:{
name:"📅 60 DAY",
price:1150,
days:60
}

};

// ================= STATES =================

let selectedPlan = {};
let pendingPayment = {};
let deleteMode = {};

// ================= HOME PAGE =================

async function home(chatId){

await bot.sendMessage(
chatId,
`🔥 WELCOME TO COBRA SERVER 🔥

━━━━━━━━━━━━━━━

🛒 BUY PREMIUM KEYS

⚡ FAST DELIVERY

🛠 FULL SUPPORT

━━━━━━━━━━━━━━━

👤 DM FOR HELP

${SUPPORT}

━━━━━━━━━━━━━━━

Choose Option Below`,
{
reply_markup:{
inline_keyboard:[

[
{
text:"🛒 COBRA SERVER",
callback_data:"plans"
}
],

[
{
text:"🛠 MOD HELP",
callback_data:"help"
}
],

[
{
text:"📦 MY ORDER",
callback_data:"orders"
}
]

]
}
}
);

}

// ================= START =================

bot.onText(
/\/start/,
async(msg)=>{

home(msg.chat.id);

}
);

// ================= AUTO MENU =================

bot.on(
"message",
async(msg)=>{

if(!msg.text) return;

if(msg.text.startsWith("/"))
return;

if(msg.chat.id===ADMIN_ID)
return;

home(msg.chat.id);

}
);

// ================= COMMANDS =================

bot.setMyCommands([
{
command:"start",
description:"Open Main Menu"
}
]);

console.log("🔥 COBRA PANEL STARTED");
// ================= PLAN PAGE =================

async function showPlans(id){

let buttons = [];

for(let p in plans){

let stock =
await Key.countDocuments({
plan:p
});

buttons.push([
{
text:`${plans[p].name} - ₹${plans[p].price} | 📦 ${stock}`,
callback_data:`buy_${p}`
}
]);

}

buttons.push([
{
text:"🏠 HOME MENU",
callback_data:"home"
}
]);

return bot.sendMessage(
id,
`🛒 COBRA SERVER

━━━━━━━━━━━━━━━

SELECT YOUR PLAN

━━━━━━━━━━━━━━━`,
{
reply_markup:{
inline_keyboard:buttons
}
}
);

}

// ================= HELP PAGE =================

async function helpPage(id){

return bot.sendMessage(
id,
`🛠 COBRA HELP CENTER

━━━━━━━━━━━━━━━

💳 Payment Issue

🔑 Key Issue

🛠 Setup Issue

━━━━━━━━━━━━━━━

👤 DIRECT SUPPORT

${SUPPORT}

━━━━━━━━━━━━━━━

SEND MESSAGE TO ADMIN
FOR QUICK HELP`,
{
reply_markup:{
inline_keyboard:[[
{
text:"🏠 HOME MENU",
callback_data:"home"
}
]]
}
}
);

}

// ================= MY ORDER =================

async function myOrders(id){

let latest =
await Sale.findOne({
user:id
}).sort({
createdAt:-1
});

if(!latest){

return bot.sendMessage(
id,
`❌ NO ORDER FOUND`,
{
reply_markup:{
inline_keyboard:[[
{
text:"🏠 HOME MENU",
callback_data:"home"
}
]]
}
}
);

}

return bot.sendMessage(
id,
`📦 MY LATEST ORDER

━━━━━━━━━━━━━━━

📅 ${latest.plan}

━━━━━━━━━━━━━━━

🔑 KEY

\`${latest.key}\`

━━━━━━━━━━━━━━━

⏰ EXPIRE

${latest.expiry.toLocaleString()}`,
{
parse_mode:"Markdown",
reply_markup:{
inline_keyboard:[

[
{
text:"📜 MORE ORDERS",
callback_data:"more_orders"
}
],

[
{
text:"🏠 HOME MENU",
callback_data:"home"
}
]

]
}
}
);

}

// ================= MORE ORDERS =================

async function moreOrders(id){

let orders =
await Sale.find({
user:id
})
.sort({
createdAt:-1
})
.skip(1)
.limit(10);

if(!orders.length){

return bot.sendMessage(
id,
"❌ NO OLD ORDERS FOUND"
);

}

let text =
`📜 ORDER HISTORY

━━━━━━━━━━━━━━━

`;

for(let o of orders){

text +=
`📅 ${o.plan}

🔑 \`${o.key}\`

⏰ ${o.expiry.toLocaleString()}

━━━━━━━━━━━━━━━

`;

}

return bot.sendMessage(
id,
text,
{
parse_mode:"Markdown",
reply_markup:{
inline_keyboard:[[
{
text:"🏠 HOME MENU",
callback_data:"home"
}
]]
}
}
);

}

// ================= CALLBACK =================

bot.on(
"callback_query",
async(q)=>{

let id = q.from.id;
let data = q.data;

await bot.answerCallbackQuery(
q.id
);

// HOME

if(data==="home"){

return home(id);

}

// PLANS

if(data==="plans"){

return showPlans(id);

}

// HELP

if(data==="help"){

return helpPage(id);

}

// MY ORDER

if(data==="orders"){

return myOrders(id);

}

// MORE ORDERS

if(data==="more_orders"){

return moreOrders(id);

}

// BUY PLAN

if(data.startsWith("buy_")){

let p =
data.replace(
"buy_",
""
);

let stock =
await Key.countDocuments({
plan:p
});

if(stock<=0){

return bot.sendMessage(
id,
"❌ PLAN OUT OF STOCK"
);

}

selectedPlan[id] = p;

return bot.sendPhoto(
id,
QR_LINK,
{
caption:
`💳 PAYMENT DETAILS

━━━━━━━━━━━━━━━

📦 PLAN

${plans[p].name}

━━━━━━━━━━━━━━━

💰 PRICE

₹${plans[p].price}

━━━━━━━━━━━━━━━

💳 UPI ID

${UPI_ID}

━━━━━━━━━━━━━━━

📸 AFTER PAYMENT

SEND SCREENSHOT
IN THIS CHAT

━━━━━━━━━━━━━━━

⚡ ADMIN WILL VERIFY
YOUR PAYMENT SOON`,
reply_markup:{
inline_keyboard:[[
{
text:"🏠 HOME MENU",
callback_data:"home"
}
]]
}
}
);

}

}
);
// ================= SCREENSHOT RECEIVE =================

bot.on("photo", async(msg)=>{

let id = msg.chat.id;

if(!selectedPlan[id]) return;

if(pendingPayment[id]){

return bot.sendMessage(
id,
`⏳ YOUR PAYMENT IS ALREADY UNDER REVIEW

PLEASE WAIT FOR ADMIN RESPONSE`
);

}

pendingPayment[id] = true;

let photo =
msg.photo[
msg.photo.length-1
].file_id;

// SEND TO ADMIN

await bot.sendPhoto(
ADMIN_ID,
photo,
{
caption:
`💳 NEW PAYMENT REQUEST

━━━━━━━━━━━━━━━

👤 USER ID

${id}

━━━━━━━━━━━━━━━

📦 PLAN

${plans[selectedPlan[id]].name}

━━━━━━━━━━━━━━━

⚡ PLEASE VERIFY`,
reply_markup:{
inline_keyboard:[

[
{
text:"✅ VERIFY",
callback_data:`approve_${id}`
},
{
text:"❌ REJECT",
callback_data:`reject_${id}`
}
]

]
}
}
);

// USER HOLD PAGE

await bot.sendMessage(
id,
`⏳ PAYMENT UNDER REVIEW

━━━━━━━━━━━━━━━

💳 SCREENSHOT RECEIVED

⚡ ADMIN IS CHECKING
YOUR PAYMENT

PLEASE WAIT...`
);

});

// ================= VERIFY / REJECT =================

bot.on(
"callback_query",
async(q)=>{

let data = q.data;

// VERIFY

if(
data.startsWith(
"approve_"
)
){

let uid =
data.split("_")[1];

let plan =
selectedPlan[uid];

if(!plan){

return;
}

let key =
await Key.findOneAndDelete({
plan:plan
});

if(!key){

return bot.sendMessage(
ADMIN_ID,
"❌ NO KEY STOCK"
);

}

let expiry =
new Date();

if(plans[plan].hours){

expiry.setHours(
expiry.getHours() +
plans[plan].hours
);

}else{

expiry.setDate(
expiry.getDate() +
plans[plan].days
);

}

await Sale.create({

user:Number(uid),

key:key.key,

plan:plans[plan].name,

expiry

});

// USER KEY

await bot.sendMessage(
uid,
`✅ PAYMENT VERIFIED

━━━━━━━━━━━━━━━

🔑 KEY

\`${key.key}\`

━━━━━━━━━━━━━━━

⏰ EXPIRE

${expiry.toLocaleString()}

━━━━━━━━━━━━━━━

📢 JOIN PAID GROUP

ENJOY ❤️`,
{
parse_mode:"Markdown",
reply_markup:{
inline_keyboard:[

[
{
text:"📢 JOIN PAID GROUP",
url:CHANNEL_LINK
}
],

[
{
text:"🏠 HOME MENU",
callback_data:"home"
}
]

]
}
}
);

// ADMIN LOG

await bot.sendMessage(
ADMIN_ID,
`✅ KEY DELIVERED

━━━━━━━━━━━━━━━

👤 USER

${uid}

━━━━━━━━━━━━━━━

📦 PLAN

${plans[plan].name}

━━━━━━━━━━━━━━━

🔑 KEY

${key.key}`
);

delete selectedPlan[uid];
delete pendingPayment[uid];

return;

}

// REJECT

if(
data.startsWith(
"reject_"
)
){

let uid =
data.split("_")[1];

await bot.sendMessage(
uid,
`❌ PAYMENT REJECTED

━━━━━━━━━━━━━━━

PLEASE CONTACT SUPPORT

👉 ${SUPPORT}

━━━━━━━━━━━━━━━

SEND CORRECT SCREENSHOT
IF PAYMENT WAS SUCCESSFUL`
);

delete selectedPlan[uid];
delete pendingPayment[uid];

return;

}

});
// ================= ADMIN PANEL =================

bot.onText(
/\/admin/,
async(msg)=>{

if(
msg.from.id !== ADMIN_ID
)
return;

bot.sendMessage(
msg.chat.id,
`⚙️ COBRA ADMIN PANEL

━━━━━━━━━━━━━━━

SELECT OPTION`,
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
}
);

}
);

// ================= ADMIN BUTTONS =================

bot.on(
"callback_query",
async(q)=>{

let id = q.from.id;
let data = q.data;

if(id !== ADMIN_ID)
return;

// ADD STOCK

if(data==="addstock"){

return bot.sendMessage(
id,
`📦 ADD STOCK

SEND LIKE THIS

plan1
KEY1
KEY2
KEY3

━━━━━━━━━━━━━━━

PLANS

plan1
plan2
plan3
plan4
plan5
plan6
plan7`
);

}

// DELETE KEY

if(data==="delkey"){

deleteMode[id] = true;

return bot.sendMessage(
id,
"🗑 SEND KEY TO DELETE"
);

}

// STATS

if(data==="stats"){

let stock =
await Key.countDocuments();

let sold =
await Sale.countDocuments();

let users =
await Sale.distinct(
"user"
);

return bot.sendMessage(
id,
`📊 COBRA STATS

━━━━━━━━━━━━━━━

📦 TOTAL STOCK

${stock}

━━━━━━━━━━━━━━━

🔥 TOTAL SOLD

${sold}

━━━━━━━━━━━━━━━

👥 TOTAL USERS

${users.length}`
);

}

}
);

// ================= ADD STOCK =================

bot.on(
"message",
async(msg)=>{

let id = msg.chat.id;

if(id !== ADMIN_ID)
return;

if(!msg.text)
return;

// DELETE KEY

if(deleteMode[id]){

await Key.deleteOne({
key:msg.text.trim()
});

deleteMode[id] = false;

return bot.sendMessage(
id,
"✅ KEY DELETED"
);

}

// ADD KEYS

let lines =
msg.text.split("\n");

if(lines.length < 2)
return;

let plan =
lines[0].trim();

if(!plans[plan])
return;

let added = 0;

for(
let i=1;
i<lines.length;
i++
){

let key =
lines[i].trim();

if(!key)
continue;

await Key.create({
plan,
key
});

added++;

}

return bot.sendMessage(
id,
`✅ STOCK ADDED

━━━━━━━━━━━━━━━

📦 PLAN

${plan}

━━━━━━━━━━━━━━━

🔑 KEYS

${added}`
);

}

);

// ================= BOT COMMANDS =================

bot.setMyCommands([

{
command:"start",
description:"Open Main Menu"
},

{
command:"admin",
description:"Admin Panel"
}

]);

// ================= STARTUP =================

console.log(
"🔥 COBRA PANEL STARTED"
);
