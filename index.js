const TelegramBot = require('node-telegram-bot-api');
const express = require("express");
const fs = require("fs");

const token = "8304628992:AAFANNXH6syLC1FIuHxKeYd8MIyaWXNTXg4";
const ADMIN_ID = 7707237527;

// ✅ GitHub QR RAW LINK
const QR_LINK = "https://raw.githubusercontent.com/@GODx_COBRA/cobra-bot/main/upi_qr.png";

const bot = new TelegramBot(token, { polling: true });

// 🌐 SERVER (Render fix)
const app = express();
app.get("/", (req, res) => res.send("Running"));
app.listen(process.env.PORT || 3000);

// 📦 LOAD KEYS
let keys = JSON.parse(fs.readFileSync("keys.json"));

// 💎 PLANS
const plans = {
  "💎 1 DAY - 120₹": { id: "plan1", days: 1 },
  "💎 7 DAY - 400₹": { id: "plan2", days: 7 },
  "💎 15 DAY - 600₹": { id: "plan3", days: 15 },
  "💎 30 DAY - 800₹": { id: "plan4", days: 30 }
};

let userPlan = {};
let addingKeys = {};

// 🚀 START
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
`🔥 COBRA VIP PANEL 🔥

💎 PREMIUM STORE

━━━━━━━━━━━━━━━
⚡ Instant Delivery
🔐 Secure Access
━━━━━━━━━━━━━━━

👇 Select Plan`,
  {
    reply_markup: {
      keyboard: Object.keys(plans).map(p => [p]),
      resize_keyboard: true
    }
  });
});

// 💰 PLAN SELECT + UTR
bot.on("message", (msg) => {

  // PLAN SELECT
  if (plans[msg.text]) {
    userPlan[msg.from.id] = plans[msg.text];

    bot.sendPhoto(msg.chat.id, QR_LINK, {
      caption:
`💰 PAYMENT

UPI: godxcobra@axl

📌 Scan QR & Pay
👉 UTR bhejo`
    });
  }

  // ADMIN ADD KEY MODE
  else if (addingKeys[msg.from.id]) {

    let lines = msg.text.split("\n");

    lines.forEach(line => {
      let [plan, key] = line.split(" ");

      if (keys[plan]) {
        keys[plan].push(key);
      }
    });

    fs.writeFileSync("keys.json", JSON.stringify(keys, null, 2));

    bot.sendMessage(msg.chat.id,
`✅ KEYS ADDED

plan1: ${keys.plan1.length}
plan2: ${keys.plan2.length}
plan3: ${keys.plan3.length}
plan4: ${keys.plan4.length}`);

    addingKeys[msg.from.id] = false;
  }

  // UTR
  else if (msg.text !== "/start") {

    bot.sendMessage(ADMIN_ID,
`📥 PAYMENT REQUEST

👤 User: ${msg.from.id}
📝 UTR: ${msg.text}`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ APPROVE", callback_data: `approve_${msg.from.id}` }]
        ]
      }
    });

    bot.sendMessage(msg.chat.id, "⏳ Waiting for verification...");
  }
});

// ✅ APPROVE
bot.on("callback_query", (query) => {

  const data = query.data;

  // APPROVE
  if (data.startsWith("approve_")) {
    const userId = data.split("_")[1];
    const plan = userPlan[userId];

    if (!plan) return;

    let stock = keys[plan.id];

    if (!stock || stock.length === 0) {
      bot.sendMessage(ADMIN_ID, "❌ No keys left");
      return;
    }

    const key = stock.shift();
    fs.writeFileSync("keys.json", JSON.stringify(keys, null, 2));

    let expiry = new Date();
    expiry.setDate(expiry.getDate() + plan.days);

    bot.sendMessage(userId,
`✅ VERIFIED

━━━━━━━━━━━━━━━
🔑 KEY: ${key}
📅 EXPIRES: ${expiry.toDateString()}
━━━━━━━━━━━━━━━

⚡ Enjoy 🚀`);
  }

  // STOCK CHECK
  if (data === "stock") {
    let msg = `📦 STOCK\n\n`;

    for (let p in keys) {
      msg += `${p} ➜ ${keys[p].length}\n`;
    }

    bot.sendMessage(query.message.chat.id, msg);
  }

  // ADD KEYS
  if (data === "add") {

    if (query.from.id != ADMIN_ID) return;

    addingKeys[query.from.id] = true;

    bot.sendMessage(query.message.chat.id,
`➕ ADD KEYS

Format:
plan1 KEY1
plan1 KEY2

Example:
plan1 COBRASERVER>1D-XXXX`);
  }
});

// 👑 ADMIN PANEL
bot.onText(/\/admin/, (msg) => {

  if (msg.from.id !== ADMIN_ID) return;

  bot.sendMessage(msg.chat.id,
`👑 ADMIN PANEL`,
  {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📦 STOCK", callback_data: "stock" }],
        [{ text: "➕ ADD KEYS", callback_data: "add" }]
      ]
    }
  });
});
