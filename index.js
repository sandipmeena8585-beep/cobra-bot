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

// ================= COMMAND MENU =================

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

bot.sendMessage(msg.chat.id,
`
👤 𝐌𝐘 𝐀𝐂𝐂𝐎𝐔𝐍𝐓

🆔 ${msg.from.id}

👤 ${msg.from.first_name}
`
);

});

bot.onText(/\/latestkey/, async msg=>{

let last =
await Sale.findOne({
user:msg.chat.id
}).sort({createdAt:-1});

if(!last){

return bot.sendMessage(msg.chat.id,
"❌ 𝐍𝐎 𝐊𝐄𝐘 𝐅𝐎𝐔𝐍𝐃");
}

bot.sendMessage(msg.chat.id,
`
🔥 𝐋𝐀𝐓𝐄𝐒𝐓 𝐊𝐄𝐘

━━━━━━━━━━━━━━━

📦 ${last.plan}

🔑 ${last.key}

⏰ ${last.expiry.toLocaleString()}
`
);

});

// ================= HELP =================

bot.onText(/\/help/, async msg=>{

bot.sendMessage(msg.chat.id,
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

⚡ 𝐂𝐎𝐁𝐑𝐀 𝐒𝐔𝐏𝐏𝐎𝐑𝐓
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
.sort({createdAt:-1});

if(!orders.length){

return bot.sendMessage(id,
"❌ 𝐍𝐎 𝐎𝐑𝐃𝐄𝐑𝐒 𝐅𝐎𝐔𝐍𝐃");
}

let latest = orders[0];

let txt =
`
🔥 𝐌𝐘 𝐋𝐀𝐓𝐄𝐒𝐓 𝐊𝐄𝐘

━━━━━━━━━━━━━━━

📦 ${latest.plan}

🔑 ${latest.key}

⏰ ${latest.expiry.toLocaleString()}

━━━━━━━━━━━━━━━
`;

if(orders.length > 1){

txt += `

📜 𝐎𝐋𝐃 𝐎𝐑𝐃𝐄𝐑𝐒

`;

orders.slice(1,4).forEach((o,i)=>{

txt += `
${i+1}. ${o.plan}
⏰ ${o.expiry.toLocaleString()}
`;

});

}

bot.sendMessage(id,txt,{
reply_markup:{
inline_keyboard:[[
{
text:"📜 𝐌𝐎𝐑𝐄",
callback_data:"more_orders"
}
]]
}
});

}

// ================= CALLBACK =================

bot.on("callback_query", async q=>{

let d = q.data;
let id = q.from.id;

bot.answerCallbackQuery(q.id);

// ================= HOME =================

if(d==="menu"){

return showPlans(id);

}

if(d==="orders"){

return showOrders(id);

}

if(d==="help"){

return bot.sendMessage(id,
`
⚙️ 𝐂𝐎𝐁𝐑𝐀 𝐇𝐄𝐋𝐏 𝐂𝐄𝐍𝐓𝐄𝐑

💳 PAYMENT ISSUE
🔑 KEY ISSUE
🛠 MOD ISSUE
`
);

}

// ================= MORE ORDERS =================

if(d==="more_orders"){

let orders =
await Sale.find({user:id})
.sort({createdAt:-1})
.limit(15);

let txt =
`📜 𝐅𝐔𝐋𝐋 𝐎𝐑𝐃𝐄𝐑 𝐇𝐈𝐒𝐓𝐎𝐑𝐘\n\n`;

orders.forEach((o,i)=>{

txt += `
${i+1}. ${o.plan}

🔑 ${o.key}

⏰ ${o.expiry.toLocaleString()}

━━━━━━━━━━━━━━━
`;

});

return bot.sendMessage(id,txt);

}

// ================= BUY =================

if(d.startsWith("buy_")){

let p = d.split("_")[1];

userPlan[id]={
...plans[p],
id:p
};

let qr = await bot.sendPhoto(id,QR_LINK,{
caption:
`
💳 𝐏𝐀𝐘𝐌𝐄𝐍𝐓 𝐏𝐀𝐆𝐄

📦 ${plans[p].name}

💰 ₹${plans[p].price}

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

userPlan[id].qrMsg = qr.message_id;

return;

}

// ================= SEND SCREENSHOT =================

if(d==="ss"){

waitingSS[id]=true;

let x = await bot.sendMessage(id,
`
📸 𝐒𝐄𝐍𝐃 𝐏𝐀𝐘𝐌𝐄𝐍𝐓
𝐒𝐂𝐑𝐄𝐄𝐍𝐒𝐇𝐎𝐓
`
);

userPlan[id].ssMsg = x.message_id;

return;

}

// ================= APPROVE =================

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

delete userPlan[uid];

}

// ================= REJECT =================

if(d.startsWith("reject_")){

let uid =
d.split("_")[1];

bot.sendMessage(uid,
`
❌ 𝐏𝐀𝐘𝐌𝐄𝐍𝐓 𝐑𝐄𝐉𝐄𝐂𝐓𝐄𝐃

⚠️ 𝐏𝐋𝐄𝐀𝐒𝐄 𝐂𝐇𝐄𝐂𝐊 𝐏𝐀𝐘𝐌𝐄𝐍𝐓
𝐀𝐍𝐃 𝐒𝐄𝐍𝐃 𝐀𝐆𝐀𝐈𝐍
`
);

}

// ================= ADMIN =================

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

if(d==="delkey"){

if(id!==ADMIN_ID) return;

deleteMode[id]=true;

return bot.sendMessage(id,
`
🗑 𝐒𝐄𝐍𝐃 𝐊𝐄𝐘 𝐓𝐎 𝐃𝐄𝐋𝐄𝐓𝐄
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
📊 𝐀𝐃𝐌𝐈𝐍 𝐒𝐓𝐀𝐓𝐒

━━━━━━━━━━━━━━━

📦 STOCK : ${stock}

🔥 SOLD : ${sold}
`
);

}

});

// ================= SCREENSHOT =================

bot.on("message", async msg=>{

let id = msg.chat.id;

if(waitingSS[id] && msg.photo){

waitingSS[id]=false;

try{

await bot.deleteMessage(
id,
msg.message_id
);

if(userPlan[id]?.qrMsg){

await bot.deleteMessage(
id,
userPlan[id].qrMsg
);

}

if(userPlan[id]?.ssMsg){

await bot.deleteMessage(
id,
userPlan[id].ssMsg
);

}

}catch(e){}

// SEND TO ADMIN
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

${userPlan[id].name}

━━━━━━━━━━━━━━━

⚡ 𝐏𝐋𝐄𝐀𝐒𝐄 𝐕𝐄𝐑𝐈𝐅𝐘
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

// CLEAN PAGE
return bot.sendMessage(id,
`
🛍 𝐂𝐎𝐁𝐑𝐀 𝐊𝐄𝐘 𝐒𝐇𝐎𝐏 🛍

━━━━━━━━━━━━━━━

⏳ 𝐏𝐀𝐘𝐌𝐄𝐍𝐓 𝐔𝐍𝐃𝐄𝐑 𝐑𝐄𝐕𝐈𝐄𝐖

💳 𝐀𝐃𝐌𝐈𝐍 𝐈𝐒 𝐂𝐇𝐄𝐂𝐊𝐈𝐍𝐆
𝐘𝐎𝐔𝐑 𝐏𝐀𝐘𝐌𝐄𝐍𝐓

⚡ 𝐏𝐋𝐄𝐀𝐒𝐄 𝐖𝐀𝐈𝐓
𝟒-𝟓 𝐌𝐈𝐍
`,
{
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

}

// ================= ADD STOCK =================

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
"✅ 𝐒𝐓𝐎𝐂𝐊 𝐀𝐃𝐃𝐄𝐃");
}

// ================= DELETE KEY =================

if(deleteMode[id] && msg.text){

await Key.deleteOne({
key:msg.text.trim()
});

deleteMode[id]=false;

return bot.sendMessage(id,
"🗑 𝐊𝐄𝐘 𝐃𝐄𝐋𝐄𝐓𝐄𝐃");
}

});

// ================= ADMIN PANEL =================

bot.onText(/\/sami/, async msg=>{

if(msg.from.id!==ADMIN_ID)
return;

bot.sendMessage(msg.chat.id,
`
⚙️ 𝐂𝐎𝐁𝐑𝐀 𝐀𝐃𝐌𝐈𝐍 𝐏𝐀𝐍𝐄𝐋
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

console.log("🟢 COBRA SERVER RUNNING");
