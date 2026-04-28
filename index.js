const TelegramBot = require('node-telegram-bot-api');
const express = require("express");
const mongoose = require("mongoose");

// ===== CONFIG =====
const token = process.env.BOT_TOKEN || "8304628992:AAFHjdhzF33fiH2QHjQScU9lK2zgqAx7nIc";
const MONGO_URL = "mongodb+srv://COBRA:Cobra%4012345@cluster0.uqwcyny.mongodb.net/cobra?retryWrites=true&w=majority";
const ADMIN_ID = 7707237527;
const BOT_USERNAME = "GODx_cobraBOT";

const CHANNEL_LINK = "https://t.me/+wRZN39fdVcRkYTM9";
const UPI_ID = "godxcobra@axl";
const PAYMENT_NAME = "SANDIP MEENA";
const QR_LINK = "https://images.weserv.nl/?url=raw.githubusercontent.com/sandipmeena8585-beep/cobra-bot/main/upi_qr.png";

// ===== SERVER =====
const app = express();
app.use(express.json());
app.get("/", (req,res)=>res.send("RUNNING"));
app.listen(process.env.PORT || 3000);

// ===== BOT =====
const bot = new TelegramBot(token,{ polling:true });

// ===== DB =====
mongoose.connect(MONGO_URL)
.then(()=>console.log("Mongo Connected ✅"))
.catch(err=>console.log("Mongo Error ❌",err));

// ===== MODELS =====
const Key = mongoose.model("Key",{plan:String,key:String});

const Sale = mongoose.model("Sale",{
  user:String,
  key:String,
  plan:String,
  expiry:Date,
  utr:String,
  createdAt:{type:Date,default:Date.now}
});

const User = mongoose.model("User",{
  id:Number,
  refBy:Number,
  balance:{type:Number,default:0},
  referrals:{type:Number,default:0},
  referredUsers:[Number]
});

// ===== PLANS =====
const plans = {
  plan1:{name:"🗝️ 1 DAY - 100₹",days:1,ref:10},
  plan2:{name:"🗝️ 7 DAY - 400₹",days:7,ref:50},
  plan3:{name:"🗝️ 15 DAY - 700₹",days:15,ref:80},
  plan4:{name:"🗝️ 30 DAY - 900₹",days:30,ref:100},
  plan5:{name:"🗝️ 60 DAY - 1200₹",days:60,ref:200}
};

// ===== STATE =====
let userPlan={}, waitingUTR={}, userUTR={}, selectedPlan={};

// ===== STOCK =====
async function getStock(){
  return `📦 LIVE STOCK

1D: ${await Key.countDocuments({plan:"plan1"})}
7D: ${await Key.countDocuments({plan:"plan2"})}
15D: ${await Key.countDocuments({plan:"plan3"})}
30D: ${await Key.countDocuments({plan:"plan4"})}
60D: ${await Key.countDocuments({plan:"plan5"})}`;
}

// ===== HOME =====
function home(id){
  bot.sendMessage(id,
`🏠 COBRA PANEL
━━━━━━━━━━━━━━
SELECT OPTION
━━━━━━━━━━━━━━`,{
    reply_markup:{
      inline_keyboard:[
        [{text:"🛒 BUY",callback_data:"buy"}],
        [{text:"👤 ACCOUNT",callback_data:"account"}],
        [{text:"🎁 REFER",callback_data:"refer"}],
        [{text:"📊 INFO",callback_data:"info"}],
        [{text:"⚙️ HELP",callback_data:"help"}]
      ]
    }
  });
}

// ===== START =====
bot.onText(/\/start (.+)/, async (msg,match)=>{
  let id=msg.from.id;
  let ref=parseInt(match[1]);

  let exist=await User.findOne({id});
  if(!exist){
    if(ref && ref!==id){
      await User.create({id,refBy:ref,referredUsers:[]});
    } else {
      await User.create({id,referredUsers:[]});
    }
  }

  home(id);
});

bot.onText(/\/start/, async msg=>{
  let id=msg.from.id;
  await User.updateOne({id},{id},{upsert:true});
  home(id);
});

// ===== MESSAGE =====
bot.on("message", async msg=>{
  let id = msg.from.id;

  // UTR
  if(waitingUTR[id]){
    userUTR[id]=msg.text;
    waitingUTR[id]=false;

    return bot.sendMessage(ADMIN_ID,
`💳 PAYMENT REQUEST

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

  // STOCK ADD
  if(selectedPlan[id]){
    msg.text.split("\n").forEach(async k=>{
      if(k.trim()) await Key.create({plan:selectedPlan[id],key:k.trim()});
    });
    selectedPlan[id]=null;
    return bot.sendMessage(id,"✅ STOCK ADDED\n"+await getStock());
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

  // PLAN SELECT
  if(d.startsWith("buy_")){
    let p=d.split("_")[1];
    userPlan[id]={...plans[p],id:p};

    return bot.sendPhoto(id,QR_LINK,{
      caption:
`💳 PAYMENT

👤 ${PAYMENT_NAME}

📲 UPI:
\`${UPI_ID}\`

━━━━━━━━━━━━━━
✔ Tap to Copy UPI
✔ Scan QR
━━━━━━━━━━━━━━`,
      parse_mode:"Markdown",
      reply_markup:{
        inline_keyboard:[
          [{text:"💳 ENTER UTR",callback_data:"utr"}]
        ]
      }
    });
  }

  if(d==="utr"){
    waitingUTR[id]=true;
    return bot.sendMessage(id,"ENTER UTR",{reply_markup:{force_reply:true}});
  }

  // ===== APPROVE =====
  if(d.startsWith("approve_")){
    await bot.editMessageReplyMarkup({inline_keyboard:[]},{
      chat_id:q.message.chat.id,
      message_id:q.message.message_id
    });

    let uid=d.split("_")[1];

    let key=await Key.findOneAndDelete({plan:userPlan[uid].id});
    if(!key) return bot.sendMessage(ADMIN_ID,"❌ NO STOCK");

    let exp=new Date();
    exp.setDate(exp.getDate()+userPlan[uid].days);

    let user=await User.findOne({id:uid});

    // ===== REFER FIX =====
    if(user.refBy){
      let refUser=await User.findOne({id:user.refBy});
      if(refUser && !refUser.referredUsers.includes(uid)){
        refUser.referredUsers.push(uid);
        refUser.balance += userPlan[uid].ref;
        refUser.referrals += 1;
        await refUser.save();
      }
    }

    await Sale.create({
      user:uid,
      key:key.key,
      plan:userPlan[uid].name,
      expiry:exp,
      utr:userUTR[uid]
    });

    bot.sendMessage(uid,
`🔑 YOUR KEY

\`${key.key}\`

━━━━━━━━━━━━━━
🎮 LIMIT: 10-12
LEGIT PLAY SAFE

📅 EXPIRY:
${exp.toLocaleString()}
━━━━━━━━━━━━━━`,{parse_mode:"Markdown"});

    bot.sendMessage(ADMIN_ID,
`💰 SALE DONE

USER: ${uid}
KEY: ${key.key}`);

    delete userPlan[uid];
    delete userUTR[uid];
  }

  // ===== ACCOUNT =====
  if(d==="account"){
    let sales=await Sale.find({user:id});
    let txt="👤 ACCOUNT\n\n";

    sales.forEach(s=>{
      txt+=`🔑 KEY:\n\`${s.key}\`\n📅 ${s.expiry}\n\n`;
    });

    let u=await User.findOne({id});

    txt+=`💰 WALLET: ₹${u?.balance||0}\n👥 REF: ${u?.referrals||0}`;

    return bot.sendMessage(id,txt,{parse_mode:"Markdown"});
  }

  // ===== REFER =====
  if(d==="refer"){
    return bot.sendMessage(id,
`🎁 REFER & EARN

Invite friends → they buy → you earn 💰

👇 Tap below`,
    {
      reply_markup:{
        inline_keyboard:[
          [{text:"🔗 GET LINK",callback_data:"getlink"}]
        ]
      }
    });
  }

  if(d==="getlink"){
    return bot.sendMessage(id,
`🔗 YOUR LINK

https://t.me/${BOT_USERNAME}?start=${id}`);
  }

  // INFO
  if(d==="info"){
    return bot.sendMessage(id,
`🔥 TRUSTED SELLER
⚡ INSTANT DELIVERY
🛡️ SAFE SYSTEM`);
  }

  // HELP
  if(d==="help"){
    return bot.sendMessage(id,
`⚙️ HELP

❌ KEY ISSUE
❌ PAYMENT ISSUE

DM 👉 @GODx_COBRA`);
  }

  // ADMIN STOCK
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
    return bot.sendMessage(id,"SEND KEYS LINE BY LINE");
  }

  if(d==="stats"){
    if(id!==ADMIN_ID) return;

    let users=await User.countDocuments();
    let sales=await Sale.countDocuments();

    return bot.sendMessage(id,
`📊 ADMIN PANEL

USERS: ${users}
SALES: ${sales}

${await getStock()}`);
  }
});

// ===== ADMIN COMMAND =====
bot.onText(/\/admin/,msg=>{
  if(msg.from.id!==ADMIN_ID) return;

  bot.sendMessage(msg.chat.id,"⚙️ ADMIN PANEL",{
    reply_markup:{
      inline_keyboard:[
        [{text:"➕ ADD STOCK",callback_data:"addstock"}],
        [{text:"📊 STATS",callback_data:"stats"}]
      ]
    }
  });
});
