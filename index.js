const TelegramBot = require('node-telegram-bot-api');
const express = require("express");
const mongoose = require("mongoose");

// CONFIG
const token = process.env.BOT_TOKEN || "8304628992:AAFHjdhzF33fiH2QHjQScU9lK2zgqAx7nIc";
const ADMIN_ID = 7707237527;
const MONGO_URL = "mongodb+srv://COBRA:Cobra%4012345@cluster0.uqwcyny.mongodb.net/cobra";

const CHANNEL_LINK = "https://t.me/+wRZN39fdVcRkYTM9";
const UPI_ID = "godxcobra@axl";
const QR_LINK = "https://images.weserv.nl/?url=raw.githubusercontent.com/sandipmeena8585-beep/cobra-bot/main/upi_qr.png";

// SERVER
const app = express();
app.get("/", (req,res)=>res.send("RUNNING"));
app.listen(process.env.PORT || 3000);

// BOT
const bot = new TelegramBot(token,{polling:true});

// DB
mongoose.connect(MONGO_URL);

// MODELS
const User = mongoose.model("User",{
  id:Number,
  purchases:{type:Number,default:0}
});

const Key = mongoose.model("Key",{plan:String,key:String});

const Sale = mongoose.model("Sale",{
  user:Number,
  key:String,
  plan:String,
  expiry:Date,
  utr:String,
  createdAt:{type:Date,default:Date.now}
});

const Pending = mongoose.model("Pending",{
  user:Number,
  plan:String,
  utr:String,
  status:{type:String,default:"pending"}
});

// PLANS
const plans = {
  plan1:{name:"1 DAY",days:1},
  plan2:{name:"7 DAY",days:7},
  plan3:{name:"15 DAY",days:15},
  plan4:{name:"30 DAY",days:30},
  plan5:{name:"60 DAY",days:60}
};

// HOME
function home(id){
  bot.sendMessage(id,"𝐂𝐎𝐁𝐑𝐀 𝐏𝐀𝐍𝐄𝐋",{
    reply_markup:{
      inline_keyboard:[
        [{text:"BUY",callback_data:"buy"}],
        [{text:"ACCOUNT",callback_data:"account"}],
        [{text:"INFO",callback_data:"info"}],
        [{text:"HELP",callback_data:"help"}]
      ]
    }
  });
}

// START
bot.onText(/\/start/,async msg=>{
  await User.updateOne({id:msg.from.id},{id:msg.from.id},{upsert:true});
  home(msg.from.id);
});

// CALLBACK
bot.on("callback_query",async q=>{
  let d=q.data,id=q.from.id;
  bot.answerCallbackQuery(q.id);

  // BUY
  if(d==="buy"){
    let pending = await Pending.findOne({user:id,status:"pending"});
    if(pending) return bot.sendMessage(id,"⛔ COMPLETE OLD PAYMENT");

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

    await Pending.create({user:id,plan:p});

    return bot.sendPhoto(id,QR_LINK,{
      caption:`💳 PAYMENT\n\`${UPI_ID}\``,
      parse_mode:"Markdown",
      reply_markup:{
        inline_keyboard:[
          [{text:"ENTER UTR",callback_data:"utr"}],
          [{text:"SEND SCREENSHOT",callback_data:"ss"}]
        ]
      }
    });
  }

  // ENTER UTR
  if(d==="utr"){
    bot.sendMessage(id,"ENTER UTR",{reply_markup:{force_reply:true}});
  }

  // SCREENSHOT MODE
  if(d==="ss"){
    bot.sendMessage(id,"SEND SCREENSHOT");
  }

  // APPROVE
  if(d.startsWith("approve_")){
    let uid=parseInt(d.split("_")[1]);

    let pending = await Pending.findOne({user:uid,status:"pending"});
    if(!pending) return;

    let key = await Key.findOneAndDelete({plan:pending.plan});
    if(!key) return bot.sendMessage(ADMIN_ID,"NO STOCK");

    let exp = new Date();
    exp.setDate(exp.getDate()+plans[pending.plan].days);

    await Sale.create({
      user:uid,
      key:key.key,
      plan:plans[pending.plan].name,
      expiry:exp,
      utr:pending.utr
    });

    await User.updateOne({id:uid},{$inc:{purchases:1}});

    pending.status="done";
    await pending.save();

    bot.sendMessage(uid,
`ENJOY COBRA SERVER  

KEY - \`${key.key}\`  

KILL LIMIT 10 12 LEGIT PLAY SAFE`,
{
      parse_mode:"Markdown",
      reply_markup:{
        inline_keyboard:[
          [{text:"JOIN GROUP",url:CHANNEL_LINK}]
        ]
      }
    });
  }

  // ACCOUNT
  if(d==="account"){
    let latest = await Sale.findOne({user:id}).sort({createdAt:-1});
    let u = await User.findOne({id});

    if(!latest) return bot.sendMessage(id,"NO PLAN");

    bot.sendMessage(id,
`ACCOUNT

KEY - \`${latest.key}\`

EXPIRE: ${latest.expiry.toLocaleString()}

TOTAL BUY: ${u.purchases}`,
{parse_mode:"Markdown"});
  }

  // INFO
  if(d==="info"){
    bot.sendMessage(id,
`COBRA SERVER

ESP - 350M
AIMBOT - 150M
IPDA VIEW - YES / NO`);
  }

  // HELP
  if(d==="help"){
    bot.sendMessage(id,
`KEY ISSUE
PAYMENT ISSUE

CONTACT OWNER - @GODx_COBRA`);
  }

  // ADMIN STATS
  if(d==="stats"){
    if(id!==ADMIN_ID) return;

    let users = await User.countDocuments();
    let stock = await Key.countDocuments();
    let sold = await Sale.countDocuments();

    bot.sendMessage(id,
`ADMIN STATS

USERS: ${users}
STOCK: ${stock}
SOLD: ${sold}`);
  }
});

// ADMIN PANEL
bot.onText(/\/admin/,msg=>{
  if(msg.from.id!==ADMIN_ID) return;

  bot.sendMessage(msg.chat.id,"ADMIN",{
    reply_markup:{
      inline_keyboard:[
        [{text:"STATS",callback_data:"stats"}]
      ]
    }
  });
});
