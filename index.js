const TelegramBot = require('node-telegram-bot-api');
const express = require("express");
const mongoose = require("mongoose");

// ===== CONFIG =====
const token = process.env.BOT_TOKEN || "8304628992:AAFHjdhzF33fiH2QHjQScU9lK2zgqAx7nIc";
const MONGO_URL = "mongodb+srv://COBRA:Cobra%4012345@cluster0.uqwcyny.mongodb.net/cobra?retryWrites=true&w=majority";
const ADMIN_ID = 7707237527;

const CHANNEL_LINK = "https://t.me/+wRZN39fdVcRkYTM9";
const UPI_ID = "godxcobra@axl";
const QR_LINK = "https://images.weserv.nl/?url=raw.githubusercontent.com/sandipmeena8585-beep/cobra-bot/main/upi_qr.png";

// ===== SERVER =====
const app = express();
app.use(express.json());
app.get("/", (req,res)=>res.send("RUNNING"));
app.listen(process.env.PORT || 3000);

// ===== BOT =====
const bot = new TelegramBot(token,{ polling:true });

// ===== DB =====
mongoose.connect(MONGO_URL);

// ===== MODELS =====
const Key = mongoose.model("Key",{plan:String,key:String});
const Sale = mongoose.model("Sale",{
  user:String,
  key:String,
  plan:String,
  expiry:Date,
  createdAt:{type:Date,default:Date.now}
});
const User = mongoose.model("User",{id:Number});

// ===== PLANS =====
const plans = {
  plan1:{name:"1 DAY",days:1},
  plan2:{name:"7 DAY",days:7},
  plan3:{name:"15 DAY",days:15},
  plan4:{name:"30 DAY",days:30},
  plan5:{name:"60 DAY",days:60}
};

// ===== STATE =====
let userPlan={}, selectedPlan={}, deleteMode={};

// ===== HOME =====
function home(id){
  bot.sendMessage(id,
`🏠 𝐂𝐎𝐁𝐑𝐀 𝐏𝐀𝐍𝐄𝐋`,{
    reply_markup:{
      inline_keyboard:[
        [{text:"🛒 BUY",callback_data:"buy"}],
        [{text:"👤 ACCOUNT",callback_data:"account"}],
        [{text:"📊 INFO",callback_data:"info"}],
        [{text:"⚙️ HELP",callback_data:"help"}]
      ]
    }
  });
}

// ===== START =====
bot.onText(/\/start/, async msg=>{
  let id=msg.from.id;
  await User.updateOne({id},{id},{upsert:true});
  home(id);
});

// ===== MESSAGE =====
bot.on("message", async msg=>{
  let id = msg.from.id;

  // DELETE KEY
  if(deleteMode[id]){
    await Key.deleteOne({key:msg.text.trim()});
    deleteMode[id]=false;
    return bot.sendMessage(id,"🗑 KEY DELETED");
  }

  // ADD STOCK (FIXED)
  if(selectedPlan[id]){
    let keys = msg.text.split("\n");

    for (const k of keys){
      if(k.trim()){
        await Key.create({plan:selectedPlan[id],key:k.trim()});
      }
    }

    selectedPlan[id]=null;
    return bot.sendMessage(id,"✅ STOCK ADDED");
  }

  if(msg.text && !msg.text.startsWith("/")){
    home(id);
  }
});

// ===== CALLBACK =====
bot.on("callback_query", async q=>{
  let d=q.data,id=q.from.id;
  bot.answerCallbackQuery(q.id);

  // BUY
  if(d==="buy"){
    return bot.sendMessage(id,"SELECT PLAN",{
      reply_markup:{
        inline_keyboard:Object.keys(plans).map(p=>[
          {text:plans[p].name,callback_data:`buy_${p}`}
        ])
      }
    });
  }

  // SELECT PLAN
  if(d.startsWith("buy_")){
    let p=d.split("_")[1];
    userPlan[id]={...plans[p],id:p};

    return bot.sendPhoto(id,QR_LINK,{
      caption:`💳 PAYMENT

UPI: ${UPI_ID}

✔ PAY THEN CONTACT ADMIN`,
    });
  }

  // APPROVE (manual admin)
  if(d.startsWith("approve_")){
    let uid=d.split("_")[1];

    let key=await Key.findOneAndDelete({plan:userPlan[uid].id});
    if(!key) return bot.sendMessage(ADMIN_ID,"❌ NO STOCK");

    let exp=new Date();
    exp.setDate(exp.getDate()+userPlan[uid].days);

    await Sale.create({
      user:uid,
      key:key.key,
      plan:userPlan[uid].name,
      expiry:exp
    });

    // 🔥 FINAL KEY UI
    bot.sendMessage(uid,
`ENJOY COBRA SERVER  

KEY - \`${key.key}\`  

KILL LIMIT 10 12 LEGIT PLAY SAFE`,
{
      parse_mode:"Markdown",
      reply_markup:{
        inline_keyboard:[
          [{text:"📦 JOIN PAID GROUP",url:CHANNEL_LINK}]
        ]
      }
    });

    delete userPlan[uid];
  }

  // ACCOUNT
  if(d==="account"){
    let latest = await Sale.findOne({user:id}).sort({createdAt:-1});

    if(!latest){
      return bot.sendMessage(id,"❌ NO PLAN");
    }

    return bot.sendMessage(id,
`👤 𝐀𝐂𝐂𝐎𝐔𝐍𝐓  

🔥 𝐋𝐀𝐓𝐄𝐒𝐓  

KEY - \`${latest.key}\`

EXPIRED 👇  
${latest.expiry.toLocaleString()}`,
{parse_mode:"Markdown"});
  }

  // INFO
  if(d==="info"){
    return bot.sendMessage(id,
`📊 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑  

ESP - 350M  
AIMBOT - 150M  
IPDA VIEW - YES / NO  

𝗖𝗢𝗕𝗥𝗔 𝗦𝗘𝗥𝗩𝗘𝗥 𝗠𝗢𝗗`);
  }

  // HELP
  if(d==="help"){
    return bot.sendMessage(id,
`KEY ISSUE  
PAYMENT ISSUE  

MSG OWNER 👉 @GODx_COBRA`);
  }

  // ADMIN ADD STOCK
  if(d==="addstock"){
    if(id!==ADMIN_ID) return;

    return bot.sendMessage(id,"SELECT PLAN",{
      reply_markup:{
        inline_keyboard:[
          [{text:"1D",callback_data:"plan1"}],
          [{text:"7D",callback_data:"plan2"}],
          [{text:"15D",callback_data:"plan3"}],
          [{text:"30D",callback_data:"plan4"}],
          [{text:"60D",callback_data:"plan5"}]
        ]
      }
    });
  }

  // PLAN SELECT
  if(d.startsWith("plan")){
    if(id!==ADMIN_ID) return;
    selectedPlan[id]=d;
    return bot.sendMessage(id,"SEND KEYS LINE BY LINE");
  }

  // DELETE KEY
  if(d==="delkey"){
    if(id!==ADMIN_ID) return;
    deleteMode[id]=true;
    return bot.sendMessage(id,"SEND KEY TO DELETE");
  }

  // ADMIN STATS
  if(d==="stats"){
    if(id!==ADMIN_ID) return;

    let stock = await Key.countDocuments();
    let sold = await Sale.countDocuments();
    let expired = await Sale.countDocuments({expiry:{$lt:new Date()}});

    let txt =
`📊 ADMIN STATS

📦 STOCK: ${stock}
💰 SOLD: ${sold}
⏳ EXPIRED: ${expired}

PLAN WISE:
`;

    for(let p in plans){
      let c = await Key.countDocuments({plan:p});
      txt += `${plans[p].name}: ${c}\n`;
    }

    return bot.sendMessage(id,txt);
  }
});

// ===== ADMIN PANEL =====
bot.onText(/\/admin/,msg=>{
  if(msg.from.id!==ADMIN_ID) return;

  bot.sendMessage(msg.chat.id,"⚙️ ADMIN PANEL",{
    reply_markup:{
      inline_keyboard:[
        [{text:"➕ ADD STOCK",callback_data:"addstock"}],
        [{text:"🗑 DELETE KEY",callback_data:"delkey"}],
        [{text:"📊 STATS",callback_data:"stats"}]
      ]
    }
  });
});
