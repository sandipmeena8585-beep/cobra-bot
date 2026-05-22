const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const mongoose = require("mongoose");

// ================= CONFIG =================
const token = process.env.BOT_TOKEN || "8304628992:AAFHjdhzF33fiH2QHjQScU9lK2zgqAx7nIc";

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

// ================= COMMAND MENU =================
bot.setMyCommands([
{
command:"start",
description:"🏠 𝐌𝐀𝐈𝐍 𝐌𝐄𝐍𝐔"
},
{
command:"menu",
description:"🛒 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑"
},
{
command:"history",
description:"📜 𝐌𝐘 𝐎𝐑𝐃𝐄𝐑𝐒"
},
{
command:"help",
description:"⚙️ 𝐇𝐄𝐋𝐏 𝐂𝐄𝐍𝐓𝐄𝐑"
},
{
command:"sami",
description:"⚙️ 𝐀𝐃𝐌𝐈𝐍 𝐏𝐀𝐍𝐄𝐋"
}
]);

// ================= DATABASE =================
mongoose.connect(MONGO_URL);

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

// ================= STATE =================
let userPlan = {};
let waitingSS = {};
let selectedPlan = {};
let deleteMode = {};
let lockedUser = {};

// ================= HOME =================
async function home(id){

let txt =
`
🛍 𝐂𝐎𝐁𝐑𝐀 𝐊𝐄𝐘 𝐒𝐇𝐎𝐏 🛍

✨ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑

⚡ 𝐈𝐍𝐒𝐓𝐀𝐍𝐓 𝐊𝐄𝐘 𝐃𝐄𝐋𝐈𝐕𝐄𝐑𝐘

━━━━━━━━━━━━━━━

📸 𝐒𝐄𝐍𝐃 𝐏𝐀𝐘𝐌𝐄𝐍𝐓 𝐒𝐂𝐑𝐄𝐄𝐍𝐒𝐇𝐎𝐓

⚡ 𝐀𝐅𝐓𝐄𝐑 𝐕𝐄𝐑𝐈𝐅𝐘 𝐊𝐄𝐘 𝐃𝐄𝐋𝐈𝐕𝐄𝐑
`;

bot.sendMessage(id,txt,{
reply_markup:{
keyboard:[
["🛒 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑"],
["📜 𝐌𝐘 𝐎𝐑𝐃𝐄𝐑𝐒","⚙️ 𝐇𝐄𝐋𝐏"]
],
resize_keyboard:true,
persistent:true,
one_time_keyboard:false
}
});

}

// ================= START =================
bot.onText(/\/start/, async msg=>{

home(msg.chat.id);

});

// ================= MENU =================
bot.onText(/\/menu/, async msg=>{

showPlans(msg.chat.id);

});

// ================= HISTORY =================
bot.onText(/\/history/, async msg=>{

showOrders(msg.chat.id);

});

// ================= HELP =================
bot.onText(/\/help/, async msg=>{

bot.sendMessage(msg.chat.id,
`
⚙️ 𝐇𝐄𝐋𝐏 𝐂𝐄𝐍𝐓𝐄𝐑

━━━━━━━━━━━━━━━

📩 𝐏𝐀𝐘𝐌𝐄𝐍𝐓 𝐈𝐒𝐒𝐔𝐄

📩 𝐊𝐄𝐘 𝐈𝐒𝐒𝐔𝐄

━━━━━━━━━━━━━━━

👤 𝐎𝐖𝐍𝐄𝐑

👉 @GODx_COBRA
`
);

});

// ================= SHOW PLANS =================
async function showPlans(id){

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

bot.sendMessage(id,
`
🛒 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑

👇 𝐒𝐄𝐋𝐄𝐂𝐓 𝐏𝐋𝐀𝐍
`,
{
reply_markup:{
inline_keyboard:keyboard
}
});

}

// ================= SHOW ORDERS =================
async function showOrders(id){

let orders =
await Sale.find({user:id})
.sort({createdAt:-1})
.limit(5);

if(!orders.length){

return bot.sendMessage(id,
"❌ 𝐍𝐎 𝐎𝐑𝐃𝐄𝐑𝐒");
}

let txt =
`📜 𝐘𝐎𝐔𝐑 𝐎𝐑𝐃𝐄𝐑𝐒\n\n`;

orders.forEach((o,i)=>{

txt +=
`
${i+1}. ${o.plan}

🔑 𝐊𝐄𝐘

${o.key}

⏰ 𝐄𝐗𝐏𝐈𝐑𝐄

${o.expiry.toLocaleString()}

━━━━━━━━━━━━━━━
`;

});

bot.sendMessage(id,txt);

}

// ================= MESSAGE =================
bot.on("message", async msg=>{

let id = msg.chat.id;

// ================= BUTTONS =================
if(msg.text==="🛒 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑"){

return showPlans(id);

}

if(msg.text==="📜 𝐌𝐘 𝐎𝐑𝐃𝐄𝐑𝐒"){

return showOrders(id);

}

if(msg.text==="⚙️ 𝐇𝐄𝐋𝐏"){

return bot.sendMessage(id,
`
⚙️ 𝐇𝐄𝐋𝐏 𝐂𝐄𝐍𝐓𝐄𝐑

━━━━━━━━━━━━━━━

📩 𝐏𝐀𝐘𝐌𝐄𝐍𝐓 𝐈𝐒𝐒𝐔𝐄

📩 𝐊𝐄𝐘 𝐈𝐒𝐒𝐔𝐄

━━━━━━━━━━━━━━━

👤 𝐎𝐖𝐍𝐄𝐑

👉 @GODx_COBRA
`
);

}

// ================= ADD STOCK =================
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
"✅ 𝐒𝐓𝐎𝐂𝐊 𝐀𝐃𝐃𝐄𝐃");

}

// ================= DELETE KEY =================
if(deleteMode[id]){

await Key.deleteOne({
key:msg.text.trim()
});

deleteMode[id]=false;

return bot.sendMessage(id,
"🗑 𝐊𝐄𝐘 𝐃𝐄𝐋𝐄𝐓𝐄𝐃");

}

// ================= SCREENSHOT =================
if(waitingSS[id] && msg.photo){

waitingSS[id]=false;

lockedUser[id]=true;

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
`
💳 𝐏𝐀𝐘𝐌𝐄𝐍𝐓 𝐒𝐂𝐑𝐄𝐄𝐍𝐒𝐇𝐎𝐓

━━━━━━━━━━━━━━━

👤 𝐔𝐒𝐄𝐑

${id}

📦 𝐏𝐋𝐀𝐍

${userPlan[id].name}
`,
reply_markup:{
inline_keyboard:[[
{
text:"✅ 𝐕𝐄𝐑𝐈𝐅𝐘",
callback_data:`approve_${id}`
},
{
text:"❌ 𝐑𝐄𝐉𝐄𝐂𝐓",
callback_data:`reject_${id}`
}
]]
}
}
);

return bot.sendMessage(id,
`
⏳ 𝐏𝐀𝐘𝐌𝐄𝐍𝐓 𝐔𝐍𝐃𝐄𝐑 𝐑𝐄𝐕𝐈𝐄𝐖

📦 ${userPlan[id].name}

⚡ 𝐖𝐀𝐈𝐓 𝐅𝐎𝐑 𝐕𝐄𝐑𝐈𝐅𝐘
`
);

}

});

// ================= CALLBACK =================
bot.on("callback_query", async q=>{

let d = q.data;
let id = q.from.id;

bot.answerCallbackQuery(q.id);

// ================= BUY =================
if(d.startsWith("buy_")){

let p = d.split("_")[1];

userPlan[id]={
...plans[p],
id:p
};

return bot.sendPhoto(id,QR_LINK,{
caption:
`
💳 𝐏𝐀𝐘𝐌𝐄𝐍𝐓 𝐏𝐀𝐆𝐄

📦 𝐏𝐋𝐀𝐍

${plans[p].name}

💰 𝐏𝐑𝐈𝐂𝐄

₹${plans[p].price}

━━━━━━━━━━━━━━━

💳 𝐔𝐏𝐈 𝐈𝐃

\`${UPI_ID}\`

━━━━━━━━━━━━━━━

📸 𝐒𝐄𝐍𝐃 𝐒𝐂𝐑𝐄𝐄𝐍𝐒𝐇𝐎𝐓
`,
parse_mode:"Markdown",
reply_markup:{
inline_keyboard:[[
{
text:"📸 𝐒𝐄𝐍𝐃 𝐒𝐂𝐑𝐄𝐄𝐍𝐒𝐇𝐎𝐓",
callback_data:"ss"
}
]]
}
});

}

// ================= SEND SS =================
if(d==="ss"){

waitingSS[id]=true;

return bot.sendMessage(id,
`
📸 𝐒𝐄𝐍𝐃 𝐏𝐀𝐘𝐌𝐄𝐍𝐓 𝐒𝐂𝐑𝐄𝐄𝐍𝐒𝐇𝐎𝐓
`
);

}

// ================= APPROVE =================
if(d.startsWith("approve_")){

await bot.editMessageReplyMarkup(
{inline_keyboard:[]},
{
chat_id:q.message.chat.id,
message_id:q.message.message_id
}
);

let uid =
d.split("_")[1];

let key =
await Key.findOneAndDelete({
plan:userPlan[uid].id
});

if(!key){

lockedUser[uid]=false;

return bot.sendMessage(
ADMIN_ID,
"❌ 𝐍𝐎 𝐒𝐓𝐎𝐂𝐊"
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

bot.sendMessage(uid,
`
🔥 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑 🔥

━━━━━━━━━━━━━━━

🔑 𝐊𝐄𝐘

\`${key.key}\`

━━━━━━━━━━━━━━━

⏰ 𝐄𝐗𝐏𝐈𝐑𝐄

${exp.toLocaleString()}

━━━━━━━━━━━━━━━

⚡ 𝐄𝐍𝐉𝐎𝐘
`,
{
parse_mode:"Markdown",
reply_markup:{
inline_keyboard:[[
{
text:"📦 𝐉𝐎𝐈𝐍 𝐏𝐀𝐈𝐃 𝐆𝐑𝐎𝐔𝐏",
url:CHANNEL_LINK
}
]]
}
});

lockedUser[uid]=false;

delete userPlan[uid];

}

// ================= REJECT =================
if(d.startsWith("reject_")){

await bot.editMessageReplyMarkup(
{inline_keyboard:[]},
{
chat_id:q.message.chat.id,
message_id:q.message.message_id
}
);

let uid =
d.split("_")[1];

lockedUser[uid]=false;

bot.sendMessage(uid,
`
❌ 𝐏𝐀𝐘𝐌𝐄𝐍𝐓 𝐑𝐄𝐉𝐄𝐂𝐓𝐄𝐃

👉 @GODx_COBRA
`
);

}

// ================= ADD STOCK =================
if(d==="addstock"){

if(id!==ADMIN_ID) return;

return bot.sendMessage(id,
`
📦 𝐒𝐄𝐋𝐄𝐂𝐓 𝐏𝐋𝐀𝐍
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

// ================= PLAN SELECT =================
if(d.startsWith("plan_")){

if(id!==ADMIN_ID) return;

selectedPlan[id]=
d.replace("plan_","");

return bot.sendMessage(id,
`
🔑 𝐒𝐄𝐍𝐃 𝐊𝐄𝐘𝐒 𝐋𝐈𝐍𝐄 𝐁𝐘 𝐋𝐈𝐍𝐄
`
);

}

// ================= DELETE =================
if(d==="delkey"){

if(id!==ADMIN_ID) return;

deleteMode[id]=true;

return bot.sendMessage(id,
`
🗑 𝐒𝐄𝐍𝐃 𝐊𝐄𝐘 𝐓𝐎 𝐃𝐄𝐋𝐄𝐓𝐄
`
);

}

// ================= STATS =================
if(d==="stats"){

if(id!==ADMIN_ID) return;

let stock =
await Key.countDocuments();

let sold =
await Sale.countDocuments();

return bot.sendMessage(id,
`
📊 𝐀𝐃𝐌𝐈𝐍 𝐒𝐓𝐀𝐓𝐒

━━━━━━━━━━━━━━━

📦 𝐒𝐓𝐎𝐂𝐊

${stock}

🔥 𝐒𝐎𝐋𝐃

${sold}
`
);

}

});

// ================= ADMIN =================
bot.onText(/\/sami/, async msg=>{

if(msg.from.id!==ADMIN_ID)
return;

bot.sendMessage(msg.chat.id,
`
⚙️ 𝐀𝐃𝐌𝐈𝐍 𝐏𝐀𝐍𝐄𝐋
`,
{
reply_markup:{
inline_keyboard:[

[
{
text:"➕ 𝐀𝐃𝐃 𝐒𝐓𝐎𝐂𝐊",
callback_data:"addstock"
}
],

[
{
text:"🗑 𝐃𝐄𝐋𝐄𝐓𝐄 𝐊𝐄𝐘",
callback_data:"delkey"
}
],

[
{
text:"📊 𝐒𝐓𝐀𝐓𝐒",
callback_data:"stats"
}
]

]
}
});

});
