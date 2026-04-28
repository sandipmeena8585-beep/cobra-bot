const TelegramBot = require('node-telegram-bot-api');
const express = require("express");
const mongoose = require("mongoose");

// ===== CONFIG =====
const token = process.env.BOT_TOKEN || "8304628992:AAFHjdhzF33fiH2QHjQScU9lK2zgqAx7nIc";
const MONGO_URL = "mongodb+srv://COBRA:Cobra%4012345@cluster0.uqwcyny.mongodb.net/cobra?retryWrites=true&w=majority";
const ADMIN_ID = 7707237527;

const CHANNEL_LINK = "https://t.me/+wRZN39fdVcRkYTM9";
const UPI_ID = "godxcobra@axl";
const PAYMENT_NAME = "𝐒𝐀𝐍𝐃𝐈𝐏 𝐌𝐄𝐄𝐍𝐀";
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
const Sale = mongoose.model("Sale",{user:String,key:String,plan:String,expiry:Date,utr:String,createdAt:{type:Date,default:Date.now}});
const User = mongoose.model("User",{id:Number});

// ===== PLANS =====
const plans = {
  plan1:{name:"🗝️ 𝐀 1 DAY - 100₹",days:1},
  plan2:{name:"🗝️ 𝐀 7 DAY - 400₹",days:7},
  plan3:{name:"🗝️ 𝐀 15 DAY - 700₹",days:15},
  plan4:{name:"🗝️ 𝐀 30 DAY - 900₹",days:30},
  plan5:{name:"🗝️ 𝐀 60 DAY - 1200₹",days:60}
};

// ===== STATE =====
let userPlan={}, waitingUTR={}, waitingSS={}, userUTR={}, selectedPlan={}, deleteMode={};

// ===== HOME =====
function home(id){
  bot.sendMessage(id,
`🏠 𝐂𝐎𝐁𝐑𝐀 𝐏𝐀𝐍𝐄𝐋`,{
    reply_markup:{
      inline_keyboard:[
        [{text:"🛒 𝐁𝐔𝐘",callback_data:"buy"}],
        [{text:"👤 𝐀𝐂𝐂𝐎𝐔𝐍𝐓",callback_data:"account"}],
        [{text:"📊 𝐈𝐍𝐅𝐎",callback_data:"info"}],
        [{text:"⚙️ 𝐇𝐄𝐋𝐏",callback_data:"help"}]
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

  // DELETE KEY MODE
  if(deleteMode[id]){
    await Key.deleteOne({key:msg.text.trim()});
    deleteMode[id]=false;
    return bot.sendMessage(id,"🗑 KEY DELETED");
  }

  // UTR
  if(waitingUTR[id] && msg.text){
    userUTR[id]=msg.text;
    waitingUTR[id]=false;

    return bot.sendMessage(ADMIN_ID,
`💳 𝐏𝐀𝐘𝐌𝐄𝐍𝐓

USER: ${id}
PLAN: ${userPlan[id].name}
UTR: ${msg.text}`,{
      reply_markup:{
        inline_keyboard:[[
          {text:"✅ VERIFY",callback_data:`approve_${id}`},
          {text:"❌ REJECT",callback_data:`reject_${id}`}
        ]]
      }
    });
  }

  // SCREENSHOT
  if(waitingSS[id] && msg.photo){
    bot.sendPhoto(ADMIN_ID,msg.photo.pop().file_id,{
      caption:`USER:${id}\nPLAN:${userPlan[id].name}`,
      reply_markup:{
        inline_keyboard:[[
          {text:"VERIFY",callback_data:`approve_${id}`},
          {text:"REJECT",callback_data:`reject_${id}`}
        ]]
      }
    });

    waitingSS[id]=false;
    return bot.sendMessage(id,"WAIT ADMIN");
  }

  // ADD STOCK FIXED
  if(selectedPlan[id]){
    let keys = msg.text.split("\n");

    for(let k of keys){
      if(k.trim()){
        await Key.create({plan:selectedPlan[id],key:k.trim()});
      }
    }

    selectedPlan[id]=null;
    return bot.sendMessage(id,"✅ STOCK ADDED SUCCESS");
  }

  if(msg.text && !msg.text.startsWith("/")){
    home(id);
  }
});

// ===== CALLBACK =====
bot.on("callback_query", async q=>{
  let d=q.data,id=q.from.id;
  bot.answerCallbackQuery(q.id);

  if(d==="buy"){
    return bot.sendMessage(id,"SELECT PLAN",{
      reply_markup:{
        inline_keyboard:Object.keys(plans).map(p=>[
          {text:plans[p].name,callback_data:`buy_${p}`}
        ])
      }
    });
  }

  if(d.startsWith("buy_")){
    let p=d.split("_")[1];
    userPlan[id]={...plans[p],id:p};

    return bot.sendPhoto(id,QR_LINK,{
      caption:`💳 PAYMENT\n${UPI_ID}`,
      reply_markup:{
        inline_keyboard:[
          [{text:"📸 SCREENSHOT",callback_data:"ss"}],
          [{text:"💳 ENTER UTR",callback_data:"utr"}]
        ]
      }
    });
  }

  if(d==="ss"){ waitingSS[id]=true; return bot.sendMessage(id,"SEND SS"); }
  if(d==="utr"){ waitingUTR[id]=true; return bot.sendMessage(id,"ENTER UTR"); }

  // APPROVE
  if(d.startsWith("approve_")){
    let uid=d.split("_")[1];

    let key=await Key.findOneAndDelete({plan:userPlan[uid].id});
    if(!key) return bot.sendMessage(ADMIN_ID,"NO STOCK");

    let exp=new Date();
    exp.setDate(exp.getDate()+userPlan[uid].days);

    await Sale.create({user:uid,key:key.key,plan:userPlan[uid].name,expiry:exp});

    bot.sendMessage(uid,
`🔑 KEY

\`${key.key}\`

EXP: ${exp.toLocaleString()}`,{
      parse_mode:"Markdown",
      reply_markup:{
        inline_keyboard:[
          [{text:"📦 JOIN GROUP",url:CHANNEL_LINK}]
        ]
      }
    });

    delete userPlan[uid];
  }

  // ACCOUNT
  if(d==="account"){
    let latest = await Sale.findOne({user:id}).sort({createdAt:-1});
    if(!latest) return bot.sendMessage(id,"NO PLAN");

    return bot.sendMessage(id,
`👤 𝐀𝐂𝐂𝐎𝐔𝐍𝐓  

🔥 𝐋𝐀𝐓𝐄𝐒𝐓  

KEY - \`${latest.key}\`

EXPIRED 👇  
${latest.expiry}

---------------------------------------------

KILL LIMIT 10 12 LEGIT PLAY SAFE  

ENJOY COBRA SERVER MOD  

𝗖𝗢𝗕𝗥𝗔 𝗦𝗘𝗥𝗩𝗘𝗥 𝗠𝗢𝗗`,
{parse_mode:"Markdown"});
  }

  if(d==="info"){
    return bot.sendMessage(id,
`📊 𝐂𝐎𝐁𝐑𝐀 𝐒𝐄𝐑𝐕𝐄𝐑  

ESP - 350M
AIMBOT - 150M
IPDA VIEW - YES / NO  

𝗖𝗢𝗕𝗥𝗔 𝗦𝗘𝗥𝗩𝗘𝗥 𝗠𝗢𝗗`);
  }

  if(d==="help"){
    return bot.sendMessage(id,"DM @GODx_COBRA");
  }

  // ADMIN
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

  if(d.startsWith("plan")){
    if(id!==ADMIN_ID) return;
    selectedPlan[id]=d;
    return bot.sendMessage(id,"SEND KEYS");
  }

  if(d==="delkey"){
    if(id!==ADMIN_ID) return;
    deleteMode[id]=true;
    return bot.sendMessage(id,"SEND KEY TO DELETE");
  }
});

// ===== ADMIN =====
bot.onText(/\/admin/,msg=>{
  if(msg.from.id!==ADMIN_ID) return;

  bot.sendMessage(msg.chat.id,"ADMIN PANEL",{
    reply_markup:{
      inline_keyboard:[
        [{text:"ADD STOCK",callback_data:"addstock"}],
        [{text:"DELETE KEY",callback_data:"delkey"}]
      ]
    }
  });
});
