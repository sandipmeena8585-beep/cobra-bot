const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const mongoose = require("mongoose");

// ================= CONFIG =================

const token =
process.env.BOT_TOKEN ||
"8304628992:AAFHjdhzF33fiH2QHjQScU9lK2zgqAx7nIc";

const ADMIN_ID = 7707237527;

const MONGO_URL =
"mongodb+srv://COBRA:Cobra%4012345@cluster0.uqwcyny.mongodb.net/cobra?retryWrites=true&w=majority";

const CHANNEL_LINK =
"https://t.me/+wRZN39fdVcRkYTM9";

const UPI_ID = "godxcobra@axl";

const QR_LINK =
"https://images.weserv.nl/?url=raw.githubusercontent.com/sandipmeena8585-beep/cobra-bot/main/upi_qr.png";

// ================= SERVER =================

const app = express();

app.get("/", (req,res)=>{
res.send("𝐂𝐎𝐁𝐑𝐀 𝐁𝐎𝐓 𝐑𝐔𝐍𝐍𝐈𝐍𝐆");
});

app.listen(process.env.PORT || 3000);

// ================= BOT =================

const bot = new TelegramBot(token,{
polling:true
});

// ================= DATABASE =================

mongoose.connect(MONGO_URL,{
useNewUrlParser:true,
useUnifiedTopology:true
});

// ================= MODELS =================

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

// ================= COMMANDS =================

bot.setMyCommands([

{
command:"menu",
description:"🛒 COBRA SERVER"
},

{
command:"myaccount",
description:"👤 MY ACCOUNT"
},

{
command:"help",
description:"⚙️ HELP CENTER"
},

{
command:"latestkey",
description:"🔑 MY LATEST KEY"
},

{
command:"sami",
description:"⚙️ ADMIN PANEL"
}

]);

// ================= PLANS =================

const plans = {

plan1:{
name:"𝐅𝐈𝐕𝐄 𝐇𝐎𝐔𝐑 - ₹40",
hours:5,
price:"40"
},

plan2:{
name:"𝐎𝐍𝐄 𝐃𝐀𝐘 - ₹80",
days:1,
price:"80"
},

plan3:{
name:"𝐓𝐇𝐑𝐄𝐄 𝐃𝐀𝐘 - ₹190",
days:3,
price:"190"
},

plan4:{
name:"𝐒𝐄𝐕𝐄𝐍 𝐃𝐀𝐘 - ₹350",
days:7,
price:"350"
},

plan5:{
name:"𝐅𝐈𝐅𝐓𝐄𝐄𝐍 𝐃𝐀𝐘 - ₹590",
days:15,
price:"590"
},

plan6:{
name:"𝐓𝐇𝐈𝐑𝐓𝐘 𝐃𝐀𝐘 - ₹750",
days:30,
price:"750"
},

plan7:{
name:"𝐒𝐈𝐗𝐓𝐘 𝐃𝐀𝐘 - ₹1150",
days:60,
price:"1150"
}

};

// ================= STATES =================

let userPlan = {};
let waitingSS = {};
let selectedPlan = {};
let deleteMode = {};

// ================= CLEAN CHAT =================

async function cleanChat(id){

try{

if(!userPlan[id])
return;

let msgs = userPlan[id].messages || [];

for(let m of msgs){

try{
await bot.deleteMessage(id,m);
}catch(e){}

}

userPlan[id].messages = [];

}catch(e){}

}

// ================= HOME =================

async function home(id){

if(!userPlan[id])
userPlan[id]={};

await cleanChat(id);

let txt =
`
🛍 𝐂𝐎𝐁𝐑𝐀 𝐊𝐄𝐘 𝐒𝐇𝐎𝐏 🛍

✨ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑

⚡ 𝐈𝐍𝐒𝐓𝐀𝐍𝐓 𝐊𝐄𝐘 𝐃𝐄𝐋𝐈𝐕𝐄𝐑𝐘

━━━━━━━━━━━━━━━

📸 𝐒𝐄𝐍𝐃 𝐏𝐀𝐘𝐌𝐄𝐍𝐓 𝐒𝐂𝐑𝐄𝐄𝐍𝐒𝐇𝐎𝐓

⚡ 𝐀𝐅𝐓𝐄𝐑 𝐕𝐄𝐑𝐈𝐅𝐘 𝐊𝐄𝐘 𝐃𝐄𝐋𝐈𝐕𝐄𝐑
`;

let x = await bot.sendMessage(id,txt,{
reply_markup:{
inline_keyboard:[

[
{
text:"🛒 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑",
callback_data:"menu"
}
],

[
{
text:"📜 𝐌𝐘 𝐎𝐑𝐃𝐄𝐑𝐒",
callback_data:"orders"
},
{
text:"⚙️ 𝐇𝐄𝐋𝐏",
callback_data:"help"
}
]

]
}
});

userPlan[id].messages = [x.message_id];

}

// ================= START =================

bot.onText(/\/start/, async msg=>{

home(msg.chat.id);

});

// ================= COMMANDS =================

bot.onText(/\/menu/, async msg=>{

showPlans(msg.chat.id);

});

bot.onText(/\/myaccount/, async msg=>{

await cleanChat(msg.chat.id);

let x = await bot.sendMessage(msg.chat.id,
`
👤 𝐌𝐘 𝐀𝐂𝐂𝐎𝐔𝐍𝐓

━━━━━━━━━━━━━━━

🆔 ${msg.from.id}

👤 ${msg.from.first_name}
`
);

userPlan[msg.chat.id].messages = [x.message_id];

});

bot.onText(/\/latestkey/, async msg=>{

await cleanChat(msg.chat.id);

let last =
await Sale.findOne({
user:msg.chat.id
}).sort({createdAt:-1});

if(!last){

let x = await bot.sendMessage(msg.chat.id,
"❌ 𝐍𝐎 𝐊𝐄𝐘 𝐅𝐎𝐔𝐍𝐃");

userPlan[msg.chat.id].messages = [x.message_id];

return;
}

let x = await bot.sendMessage(msg.chat.id,
`
🔥 𝐋𝐀𝐓𝐄𝐒𝐓 𝐊𝐄𝐘

━━━━━━━━━━━━━━━

📦 ${last.plan}

🔑 ${last.key}

⏰ ${last.expiry.toLocaleString()}
`
);

userPlan[msg.chat.id].messages = [x.message_id];

});

bot.onText(/\/help/, async msg=>{

await cleanChat(msg.chat.id);

let x = await bot.sendMessage(msg.chat.id,
`
⚙️ 𝐂𝐎𝐁𝐑𝐀 𝐇𝐄𝐋𝐏 𝐂𝐄𝐍𝐓𝐄𝐑

━━━━━━━━━━━━━━━

💳 𝐏𝐀𝐘𝐌𝐄𝐍𝐓 𝐈𝐒𝐒𝐔𝐄
• payment pending
• wrong amount
• screenshot failed

━━━━━━━━━━━━━━━

🔑 𝐊𝐄𝐘 𝐈𝐒𝐒𝐔𝐄
• key not working
• expired key
• invalid key

━━━━━━━━━━━━━━━

🛠 𝐌𝐎𝐃 / 𝐒𝐄𝐓𝐔𝐏 𝐈𝐒𝐒𝐔𝐄
• setup problem
• config issue
• mod login problem

━━━━━━━━━━━━━━━

👤 𝐓𝐄𝐋𝐄𝐆𝐑𝐀𝐌 𝐒𝐔𝐏𝐏𝐎𝐑𝐓

👉 @GODx_COBRA
`,
{
reply_markup:{
inline_keyboard:[[
{
text:"🏠 HOME",
callback_data:"home"
}
]]
}
});

userPlan[msg.chat.id].messages = [x.message_id];

});

// ================= SHOW PLANS =================

async function showPlans(id){

await cleanChat(id);

let keyboard = [];

for(let p in plans){

let stock =
await Key.countDocuments({
plan:p
});

keyboard.push([
{
text:`🛒 ${plans[p].name} | 📦 ${stock}`,
callback_data:`buy_${p}`
}
]);

}

let x = await bot.sendMessage(id,
`
🛒 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑

👇 𝐒𝐄𝐋𝐄𝐂𝐓 𝐏𝐋𝐀𝐍
`,
{
reply_markup:{
inline_keyboard:keyboard
}
});

userPlan[id].messages = [x.message_id];

}

// ================= SHOW ORDERS =================

async function showOrders(id){

await cleanChat(id);

let orders =
await Sale.find({user:id})
.sort({createdAt:-1});

if(!orders.length){

let x = await bot.sendMessage(id,
"❌ 𝐍𝐎 𝐎𝐑𝐃𝐄𝐑𝐒 𝐅𝐎𝐔𝐍𝐃");

userPlan[id].messages = [x.message_id];

return;
}

let latest = orders[0];

let txt =
`
🔥 𝐌𝐘 𝐋𝐀𝐓𝐄𝐒𝐓 𝐊𝐄𝐘

━━━━━━━━━━━━━━━

📦 ${latest.plan}

🔑 ${latest.key}

⏰ ${latest.expiry.toLocaleString()}
`;

let x = await bot.sendMessage(id,txt,{
reply_markup:{
inline_keyboard:[[
{
text:"🏠 HOME",
callback_data:"home"
}
]]
}
});

userPlan[id].messages = [x.message_id];

}

// ================= CALLBACK =================

bot.on("callback_query", async q=>{

let d = q.data;
let id = q.from.id;

bot.answerCallbackQuery(q.id);

// HOME
if(d==="home"){

return home(id);

}

// MENU
if(d==="menu"){

return showPlans(id);

}

// ORDERS
if(d==="orders"){

return showOrders(id);

}

// HELP
if(d==="help"){

await cleanChat(id);

let x = await bot.sendMessage(id,
`
⚙️ 𝐂𝐎𝐁𝐑𝐀 𝐇𝐄𝐋𝐏 𝐂𝐄𝐍𝐓𝐄𝐑

━━━━━━━━━━━━━━━

👤 SUPPORT

👉 @GODx_COBRA
`,
{
reply_markup:{
inline_keyboard:[[
{
text:"🏠 HOME",
callback_data:"home"
}
]]
}
});

userPlan[id].messages = [x.message_id];

return;

}

// BUY
if(d.startsWith("buy_")){

await cleanChat(id);

let p = d.split("_")[1];

userPlan[id]={
...plans[p],
id:p,
messages:[]
};

let qr = await bot.sendPhoto(id,QR_LINK,{
caption:
`
💳 𝐏𝐀𝐘𝐌𝐄𝐍𝐓 𝐏𝐀𝐆𝐄

📦 ${plans[p].name}

💰 ₹${plans[p].price}

━━━━━━━━━━━━━━━

💳 UPI ID

\`${UPI_ID}\`

━━━━━━━━━━━━━━━

📸 SEND SCREENSHOT
`,
parse_mode:"Markdown",
reply_markup:{
inline_keyboard:[[
{
text:"📸 SEND SCREENSHOT",
callback_data:"ss"
}
]]
}
});

userPlan[id].messages = [qr.message_id];

return;

}

// SEND SS
if(d==="ss"){

waitingSS[id]=true;

let x = await bot.sendMessage(id,
`
📸 𝐒𝐄𝐍𝐃 𝐏𝐀𝐘𝐌𝐄𝐍𝐓
𝐒𝐂𝐑𝐄𝐄𝐍𝐒𝐇𝐎𝐓
`
);

userPlan[id].messages.push(x.message_id);

return;

}

// APPROVE
if(d.startsWith("approve_")){

let uid =
d.split("_")[1];

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

let exp =
new Date();

if(userPlan[uid].hours){

exp.setHours(
exp.getHours() +
userPlan[uid].hours
);

}else{

exp.setDate(
exp.getDate() +
userPlan[uid].days
);

}

await Sale.create({
user:uid,
key:key.key,
plan:userPlan[uid].name,
expiry:exp
});

await cleanChat(uid);

let x = await bot.sendMessage(uid,
`
🔥 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑 🔥

━━━━━━━━━━━━━━━

🔑 KEY

\`${key.key}\`

━━━━━━━━━━━━━━━

⏰ EXPIRE

${exp.toLocaleString()}
`,
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

userPlan[uid].messages = [x.message_id];

delete waitingSS[uid];

}

// REJECT
if(d.startsWith("reject_")){

let uid =
d.split("_")[1];

await cleanChat(uid);

let x = await bot.sendMessage(uid,
`
❌ 𝐏𝐀𝐘𝐌𝐄𝐍𝐓 𝐑𝐄𝐉𝐄𝐂𝐓𝐄𝐃

⚠️ PLEASE CHECK PAYMENT
AND SEND AGAIN
`,
{
reply_markup:{
inline_keyboard:[[
{
text:"🏠 HOME",
callback_data:"home"
}
]]
}
});

userPlan[uid].messages = [x.message_id];

}

// ADMIN
if(d==="addstock"){

if(id!==ADMIN_ID) return;

return bot.sendMessage(id,
`
📦 SELECT PLAN
`,
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

if(d.startsWith("plan_")){

if(id!==ADMIN_ID) return;

selectedPlan[id]=
d.replace("plan_","");

return bot.sendMessage(id,
`
🔑 SEND KEYS LINE BY LINE
`
);

}

if(d==="delkey"){

if(id!==ADMIN_ID) return;

deleteMode[id]=true;

return bot.sendMessage(id,
`
🗑 SEND KEY TO DELETE
`
);

}

if(d==="stats"){

if(id!==ADMIN_ID) return;

let stock =
await Key.countDocuments();

let sold =
await Sale.countDocuments();

return bot.sendMessage(id,
`
📊 ADMIN STATS

━━━━━━━━━━━━━━━

📦 STOCK : ${stock}

🔥 SOLD : ${sold}
`
);

}

});

// ================= MESSAGE =================

bot.on("message", async msg=>{

let id = msg.chat.id;

// RANDOM MSG CLEAN
if(
msg.text &&
!msg.text.startsWith("/") &&
!selectedPlan[id] &&
!deleteMode[id]
){

return home(id);

}

// PHOTO AUTO DETECT
if(msg.photo){

if(!waitingSS[id] && userPlan[id]){

waitingSS[id]=true;

}

if(waitingSS[id]){

waitingSS[id]=false;

try{

await bot.deleteMessage(
id,
msg.message_id
);

}catch(e){}

await cleanChat(id);

// SEND ADMIN
await bot.sendPhoto(
ADMIN_ID,
msg.photo.pop().file_id,
{
caption:
`
💳 𝐍𝐄𝐖 𝐏𝐀𝐘𝐌𝐄𝐍𝐓

━━━━━━━━━━━━━━━

👤 USER ID

${id}

📦 PLAN

${userPlan[id]?.name || "UNKNOWN"}

━━━━━━━━━━━━━━━

⚡ PLEASE VERIFY
`,
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

// USER PAGE
let x = await bot.sendMessage(id,
`
🛍 𝐂𝐎𝐁𝐑𝐀 𝐊𝐄𝐘 𝐒𝐇𝐎𝐏 🛍

━━━━━━━━━━━━━━━

⏳ PAYMENT UNDER REVIEW

💳 ADMIN IS CHECKING
YOUR PAYMENT

⚡ PLEASE WAIT
4-5 MIN
`,
{
reply_markup:{
inline_keyboard:[

[
{
text:"🛒 COBRA SERVER",
callback_data:"menu"
}
],

[
{
text:"📜 MY ORDERS",
callback_data:"orders"
},
{
text:"⚙️ HELP",
callback_data:"help"
}
]

]
}
});

userPlan[id].messages = [x.message_id];

return;

}

}

// ADD STOCK
if(selectedPlan[id] && msg.text){

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

// DELETE KEY
if(deleteMode[id] && msg.text){

await Key.deleteOne({
key:msg.text.trim()
});

deleteMode[id]=false;

return bot.sendMessage(id,
"🗑 KEY DELETED");
}

});

// ================= ADMIN PANEL =================

bot.onText(/\/sami/, async msg=>{

if(msg.from.id!==ADMIN_ID)
return;

bot.sendMessage(msg.chat.id,
`
⚙️ COBRA ADMIN PANEL
`,
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

console.log("🟢 COBRA SERVER RUNNING");
