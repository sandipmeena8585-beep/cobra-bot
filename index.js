const TelegramBot = require('node-telegram-bot-api');

const token = "8304628992:AAFfdn3lSUhbqq4Xl2AlgRUQGpeXH1X_S88";
const bot = new TelegramBot(token, { polling: true });

const ADMIN_ID = 7707237527;

const plans = {
  "1 Day - 120₹": "plan1",
  "7 Day - 400₹": "plan2",
  "15 Day - 600₹": "plan3",
  "30 Day - 800₹": "plan4"
};

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🔥 COBRA VIP PANEL\n\nSelect Plan:", {
    reply_markup: {
      keyboard: Object.keys(plans).map(p => [p]),
      resize_keyboard: true
    }
  });
});

bot.on("message", (msg) => {

  if (plans[msg.text]) {
    bot.sendMessage(msg.chat.id,
      `💰 Payment karo:\n\nUPI: godxcobra@axl\n\nPayment ke baad UTR bhejo`
    );
  }

  if (!plans[msg.text] && msg.text !== "/start") {
    bot.sendMessage(ADMIN_ID,
      `📥 Payment Request\nUser: ${msg.from.id}\nUTR: ${msg.text}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "✅ Approve", callback_data: `approve_${msg.from.id}` }]
          ]
        }
      }
    );
  }
});

bot.on("callback_query", (query) => {
  const data = query.data;

  if (data.startsWith("approve_")) {
    const userId = data.split("_")[1];

    bot.sendMessage(userId, "✅ Payment Verified\n🔑 Your Key: VIP-12345");
    bot.answerCallbackQuery(query.id);
  }
});
