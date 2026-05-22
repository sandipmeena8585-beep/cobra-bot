const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const mongoose = require("mongoose");

// ================= CONFIG =================
const token = process.env.BOT_TOKEN || "8304628992:AAFHjdhzF33fiH2QHjQScU9lK2zgqAx7nIc";
const ADMIN_ID = 7707237527;

const MONGO_URL =
"mongodb+srv://COBRA:Cobra%4012345@cluster0.uqwcyny.mongodb.net/cobra?retryWrites=true&w=majority";

const CHANNEL_LINK = "https://t.me/+wRZN39fdVcRkYTM9";

const UPI_ID = "godxcobra@axl";

const QR_LINK =
"https://images.weserv.nl/?url=raw.githubusercontent.com/sandipmeena8585-beep/cobra-bot/main/upi_qr.png";

// ================= SERVER =================
const app = express();

app.get("/", (req, res) => {
res.send("COBRA BOT RUNNING");
});

app.listen(process.env.PORT || 3000);

// ================= BOT =================
const bot = new TelegramBot(token, {
polling: true
});

// ================= DATABASE =================
mongoose.connect(MONGO_URL);

// ================= MODELS =================
const Key = mongoose.model("Key", {
plan: String,
key: String
});

const Sale = mongoose.model("Sale", {
user: String,
key: String,
plan: String,
expiry: Date,
createdAt: {
type: Date,
default: Date.now
}
});

// ================= PLANS =================
const plans = {

plan1: {
name: "⏰ 5 HOUR - ₹40",
hours: 5,
price: "40"
},

plan2: {
name: "⏰ 1 DAY - ₹80",
days: 1,
price: "80"
},

plan3: {
name: "⏰ 3 DAY - ₹190",
days: 3,
price: "190"
},

plan4: {
name: "⏰ 7 DAY - ₹350",
days: 7,
price: "350"
},

plan5: {
name: "⏰ 15 DAY - ₹590",
days: 15,
price: "590"
},

plan6: {
name: "⏰ 30 DAY - ₹750",
days: 30,
price: "750"
},

plan7: {
name: "⏰ 60 DAY - ₹1150",
days: 60,
price: "1150"
}

};

// ================= STATE =================
let userPlan = {};
let waitingSS = {};
let selectedPlan = {};
let deleteMode = {};
let lockedUser = {};

// ================= HOME =================
async function home(id) {

let txt = `
🛍 𝐂𝐎𝐁𝐑𝐀 𝐊𝐄𝐘 𝐒𝐇𝐎𝐏 🛍

✨ Welcome! Pick a product below.
⚡ Instant key delivery after approval.

━━━━━━━━━━━━━━━

📸 After payment send screenshot.
⚡ Key delivered instantly after approval!
`;

bot.sendMessage(id, txt, {
reply_markup: {
keyboard: [
["🛒 COBRA SERVER"],
["📜 MY ORDERS", "⚙️ HELP"]
],
resize_keyboard: true,
persistent: true
}
});

}

// ================= START =================
bot.onText(/\/start/, async (msg) => {

home(msg.chat.id);

});

// ================= ALL MESSAGE =================
bot.on("message", async (msg) => {

let id = msg.chat.id;

// ================= AUTO HOME =================
if (
msg.text &&
msg.text !== "🛒 COBRA SERVER" &&
msg.text !== "📜 MY ORDERS" &&
msg.text !== "⚙️ HELP"
) {

return home(id);

}

// ================= HELP =================
if (msg.text === "⚙️ HELP") {

return bot.sendMessage(id,
`
⚙️ HELP CENTER

━━━━━━━━━━━━━━━

📩 PAYMENT ISSUE
📩 KEY ISSUE

━━━━━━━━━━━━━━━

OWNER:
👉 @GODx_COBRA
`
);

}

// ================= ORDERS =================
if (msg.text === "📜 MY ORDERS") {

let orders = await Sale.find({
user: id
}).sort({ createdAt: -1 }).limit(5);

if (!orders.length) {
return bot.sendMessage(id, "❌ NO ORDERS FOUND");
}

let txt = `📜 YOUR ORDERS\n\n`;

orders.forEach((o, i) => {

txt += `
${i + 1}. ${o.plan}

🔑 KEY:
${o.key}

⏰ EXPIRE:
${o.expiry.toLocaleString()}

━━━━━━━━━━━━━━━
`;

});

return bot.sendMessage(id, txt);

}

// ================= SHOP =================
if (msg.text === "🛒 COBRA SERVER") {

let keyboard = [];

for (let p in plans) {

let stock = await Key.countDocuments({
plan: p
});

keyboard.push([
{
text: `${plans[p].name}\n📦 STOCK: ${stock}`,
callback_data: `buy_${p}`
}
]);

}

return bot.sendMessage(id,
`
🛒 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑

👇 SELECT PLAN
`,
{
reply_markup: {
inline_keyboard: keyboard
}
}
);

}

// ================= ADD STOCK =================
if (selectedPlan[id]) {

for (let k of msg.text.split("\n")) {

if (k.trim()) {

await Key.create({
plan: selectedPlan[id],
key: k.trim()
});

}

}

selectedPlan[id] = null;

return bot.sendMessage(id, "✅ STOCK ADDED");

}

// ================= DELETE KEY =================
if (deleteMode[id]) {

await Key.deleteOne({
key: msg.text.trim()
});

deleteMode[id] = false;

return bot.sendMessage(id, "🗑 KEY DELETED");

}

// ================= SCREENSHOT =================
if (waitingSS[id] && msg.photo) {

waitingSS[id] = false;

lockedUser[id] = true;

// DELETE USER SCREENSHOT
bot.deleteMessage(id, msg.message_id).catch(() => {});

bot.sendPhoto(
ADMIN_ID,
msg.photo.pop().file_id,
{
caption:
`
💳 PAYMENT SCREENSHOT

━━━━━━━━━━━━━━━

👤 USER:
${id}

📦 PLAN:
${userPlan[id].name}
`,
reply_markup: {
inline_keyboard: [[
{
text: "✅ VERIFY",
callback_data: `approve_${id}`
},
{
text: "❌ REJECT",
callback_data: `reject_${id}`
}
]]
}
}
);

return bot.sendMessage(id,
`
⏳ PAYMENT UNDER REVIEW

━━━━━━━━━━━━━━━

✅ Screenshot submitted
⚡ Wait for admin verify
`
);

}

});

// ================= CALLBACK =================
bot.on("callback_query", async (q) => {

let d = q.data;
let id = q.from.id;

bot.answerCallbackQuery(q.id);

// ================= BUY =================
if (d.startsWith("buy_")) {

let p = d.split("_")[1];

userPlan[id] = {
...plans[p],
id: p
};

return bot.sendPhoto(id, QR_LINK, {
caption:
`
💳 PAYMENT PAGE

📦 PLAN:
${plans[p].name}

💰 PRICE:
₹${plans[p].price}

━━━━━━━━━━━━━━━

💳 UPI ID

\`${UPI_ID}\`

━━━━━━━━━━━━━━━

📸 SEND SCREENSHOT AFTER PAYMENT
`,
parse_mode: "Markdown",
reply_markup: {
inline_keyboard: [[
{
text: "📸 SEND SCREENSHOT",
callback_data: "ss"
}
]]
}
});

}

// ================= SEND SS =================
if (d === "ss") {

waitingSS[id] = true;

return bot.sendMessage(id,
`
📸 SEND PAYMENT SCREENSHOT
`
);

}

// ================= APPROVE =================
if (d.startsWith("approve_")) {

let uid = d.split("_")[1];

await bot.editMessageReplyMarkup(
{ inline_keyboard: [] },
{
chat_id: q.message.chat.id,
message_id: q.message.message_id
}
);

let key = await Key.findOneAndDelete({
plan: userPlan[uid].id
});

if (!key) {
return bot.sendMessage(
ADMIN_ID,
"❌ NO STOCK"
);
}

let exp = new Date();

if (userPlan[uid].hours) {

exp.setHours(
exp.getHours() + userPlan[uid].hours
);

} else {

exp.setDate(
exp.getDate() + userPlan[uid].days
);

}

await Sale.create({
user: uid,
key: key.key,
plan: userPlan[uid].name,
expiry: exp
});

bot.sendMessage(uid,
`
🔥 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑 🔥

━━━━━━━━━━━━━━━

🔑 KEY

\`${key.key}\`

━━━━━━━━━━━━━━━

⏰ EXPIRE:
${exp.toLocaleString()}

━━━━━━━━━━━━━━━

⚡ ENJOY PREMIUM ACCESS
`,
{
parse_mode: "Markdown",
reply_markup: {
inline_keyboard: [[
{
text: "📦 JOIN CHANNEL",
url: CHANNEL_LINK
}
]]
}
});

lockedUser[uid] = false;

delete userPlan[uid];

}

// ================= REJECT =================
if (d.startsWith("reject_")) {

let uid = d.split("_")[1];

await bot.editMessageReplyMarkup(
{ inline_keyboard: [] },
{
chat_id: q.message.chat.id,
message_id: q.message.message_id
}
);

lockedUser[uid] = false;

bot.sendMessage(uid,
`
❌ PAYMENT REJECTED

📩 CONTACT ADMIN
👉 @GODx_COBRA
`
);

}

// ================= ADMIN ADD =================
if (d === "addstock") {

if (id !== ADMIN_ID) return;

return bot.sendMessage(id,
`
SELECT PLAN
`,
{
reply_markup: {
inline_keyboard:
Object.keys(plans).map(p => [
{
text: plans[p].name,
callback_data: `plan_${p}`
}
])
}
});

}

// ================= PLAN SELECT =================
if (d.startsWith("plan_")) {

if (id !== ADMIN_ID) return;

selectedPlan[id] =
d.replace("plan_", "");

return bot.sendMessage(id,
`
SEND KEYS LINE BY LINE
`
);

}

// ================= DELETE =================
if (d === "delkey") {

if (id !== ADMIN_ID) return;

deleteMode[id] = true;

return bot.sendMessage(id,
`
SEND KEY TO DELETE
`
);

}

// ================= STATS =================
if (d === "stats") {

if (id !== ADMIN_ID) return;

let stock = await Key.countDocuments();
let sold = await Sale.countDocuments();

return bot.sendMessage(id,
`
📊 ADMIN STATS

━━━━━━━━━━━━━━━

📦 STOCK:
${stock}

🔥 SOLD:
${sold}
`
);

}

});

// ================= ADMIN PANEL =================
bot.onText(/\/sami/, async (msg) => {

if (msg.from.id !== ADMIN_ID) return;

bot.sendMessage(msg.chat.id,
`
⚙️ ADMIN PANEL
`,
{
reply_markup: {
inline_keyboard: [
[
{
text: "➕ ADD STOCK",
callback_data: "addstock"
}
],
[
{
text: "🗑 DELETE KEY",
callback_data: "delkey"
}
],
[
{
text: "📊 STATS",
callback_data: "stats"
}
]
]
}
});

});
