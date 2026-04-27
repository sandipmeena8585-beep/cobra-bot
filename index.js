const TelegramBot = require('node-telegram-bot-api');
const express = require("express");
const mongoose = require("mongoose");

// ===== CONFIG =====
const token = "8304628992:AAFHjdhzF33fiH2QHjQScU9lK2zgqAx7nIc";
const MONGO_URL = "mongodb+srv://COBRA:Cobra%4012345@cluster0.uqwcyny.mongodb.net/cobra?retryWrites=true&w=majority";
const ADMIN_ID = 7707237527;
const BOT_USERNAME = "GODx_cobraBOT";

const CHANNEL_LINK = "https://t.me/+wRZN39fdVcRkYTM9";
const UPI_ID = "godxcobra@axl";
const QR_LINK = "https://images.weserv.nl/?url=raw.githubusercontent.com/sandipmeena8585-beep/cobra-bot/main/upi_qr.png";

// ===== SERVER =====
const app = express();
app.use(express.json());
app.get("/", (req,res)=>res.sendStatus(404));
app.listen(process.env.PORT || 3000);

// ===== BOT =====
const bot = new TelegramBot(token);
const URL = process.env.RENDER_EXTERNAL_URL || "https://your-app.onrender.com";

(async ()=>{
  await bot.deleteWebHook();
  await bot.setWebHook(`${URL}/bot${token}`);
})();

app.post(`/bot${token}`, (req,res)=>{
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ===== DB =====
mongoose.connect(MONGO_URL,{
  serverSelectionTimeoutMS:5000
})
.then(()=>console.log("MongoDB Connected ✅"))
.catch(err=>console.log("Mongo Error ❌",err));

// ===== MODELS =====
const Key = mongoose.model("Key",{plan:String,key:String});

const Sale = mongoose.model("Sale",{
  user:String,
  key:String,
  plan:String,
  expiry:Date,
  price:Number,
  createdAt:{type:Date,default:Date.now}
});

const User = mongoose.model("User",{
  id:Number,
  refBy:Number,
  balance:{type:Number,default:0},
  referrals:{type:Number,default:0},
  refRewarded:{type:Boolean,default:false}
});

// ===== PLANS =====
const plans = {
  plan1:{name:"1 DAY - 100₹",days:1,price:100},
  plan2:{name:"7 DAY - 400₹",days:7,price:400},
  plan3:{name:"15 DAY - 700₹",days:15,price:700},
  plan4:{name:"30 DAY - 900₹",days:30,price:900},
  plan5:{name:"60 DAY - 1200₹",days:60,price:1200}
};

const rewards = {plan1:10,plan2:50,plan3:80,plan4:100,plan5:200};

let userPlan={}, waitingSS={}, selectedPlan={};

// ===== HOME =====
function home(id){
  bot.sendMessage(id,"🏠 COBRA PANEL",{
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
    await User.create({id,refBy:ref});
  }

  home(id);
});

bot.onText(/\/start/, async msg=>{
  let id=msg.from.id;
  await User.updateOne({id},{id},{upsert:true});
  home(id);
});

// ===== MESSAGE =====
bot.on("message", msg=>{
  let id=msg.from.id;
  if(msg.text && !msg.text.startsWith("/") && !userPlan[id]){
    home(id);
  }

  if(waitingSS[id] && msg.photo){
    bot.sendPhoto(ADMIN_ID,msg.photo.pop().file_id,{
      caption:`USER:${id}\nPLAN:${userPlan[id].name}`,
      reply_markup:{
        inline_keyboard:[[
          {text:"✅ VERIFY",callback_data:`approve_${id}`},
          {text:"❌ REJECT",callback_data:`reject_${id}`}
        ]]
      }
    });
    waitingSS[id]=false;
    bot.sendMessage(id,"WAIT ADMIN");
  }

  if(selectedPlan[id]){
    msg.text.split("\n").forEach(async k=>{
      if(k.trim()){
        await Key.create({plan:selectedPlan[id],key:k.trim()});
      }
    });
    selectedPlan[id]=null;
    bot.sendMessage(id,"STOCK ADDED");
  }
});

// ===== BUTTON =====
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
      caption:`💳 PAY

UPI: ${UPI_ID}
${plans[p].name}`,
      reply_markup:{
        inline_keyboard:[
          [{text:"📸 SEND SS",callback_data:"ss"}]
        ]
      }
    });
  }

  if(d==="ss"){
    waitingSS[id]=true;
    return bot.sendMessage(id,"SEND SCREENSHOT");
  }

  if(d==="account"){
    let active=await Sale.findOne({user:id,expiry:{$gt:new Date()}});
    let u=await User.findOne({id});
    let history=await Sale.find({user:id}).limit(5);

    let msg=`👤 ACCOUNT

${active?`🔑 ${active.key}
📅 ${active.expiry}`:"NO ACTIVE PLAN"}

💰 BALANCE: ₹${u?.balance||0}

📜 HISTORY:
`;
    history.forEach(h=>msg+=`${h.plan}\n`);

    return bot.sendMessage(id,msg);
  }

  if(d==="refer"){
    return bot.sendMessage(id,
`🎁 LINK:
https://t.me/${BOT_USERNAME}?start=${id}`);
  }

  if(d==="info"){
    return bot.sendMessage(id,"TRUSTED SELLER");
  }

  if(d==="help"){
    return bot.sendMessage(id,"DM @GODx_COBRA");
  }

  if(d.startsWith("approve_")){
    let uid=d.split("_")[1];

    let key=await Key.findOneAndDelete({plan:userPlan[uid].id});
    if(!key) return bot.sendMessage(ADMIN_ID,"NO STOCK");

    let exp=new Date();
    exp.setDate(exp.getDate()+userPlan[uid].days);

    await Sale.create({
      user:uid,
      key:key.key,
      plan:userPlan[uid].name,
      expiry:exp,
      price:userPlan[uid].price
    });

    let userData=await User.findOne({id:uid});
    if(userData?.refBy && !userData.refRewarded){
      let r=rewards[userPlan[uid].id]||0;
      await User.updateOne({id:userData.refBy},{$inc:{balance:r}});
      await User.updateOne({id:uid},{$set:{refRewarded:true}});
    }

    bot.sendMessage(uid,
`KEY:
${key.key}

LIMIT: 10-12 SAFE

EXPIRY:
${exp}`,{
      reply_markup:{
        inline_keyboard:[
          [{text:"JOIN GROUP",url:CHANNEL_LINK}]
        ]
      }
    });

    let left=await Key.countDocuments({plan:userPlan[uid].id});
    if(left<=2){
      bot.sendMessage(ADMIN_ID,"LOW STOCK");
    }
  }

  if(d==="addstock"){
    return bot.sendMessage(id,"SELECT PLAN",{
      reply_markup:{
        inline_keyboard:[
          [{text:"1 DAY",callback_data:"plan1"}],
          [{text:"7 DAY",callback_data:"plan2"}],
          [{text:"15 DAY",callback_data:"plan3"}],
          [{text:"30 DAY",callback_data:"plan4"}],
          [{text:"60 DAY",callback_data:"plan5"}]
        ]
      }
    });
  }

  if(d.startsWith("plan")){
    selectedPlan[id]=d;
    return bot.sendMessage(id,"SEND KEYS");
  }

  if(d==="stats"){
    if(id!==ADMIN_ID) return;

    let users=await User.countDocuments();
    let sales=await Sale.countDocuments();
    let stock=await Key.countDocuments();

    bot.sendMessage(id,
`USERS:${users}
SALES:${sales}
STOCK:${stock}`);
  }
});

// ===== ADMIN =====
bot.onText(/\/admin/,msg=>{
  if(msg.from.id!==ADMIN_ID) return;

  bot.sendMessage(msg.chat.id,"ADMIN PANEL",{
    reply_markup:{
      inline_keyboard:[
        [{text:"ADD STOCK",callback_data:"addstock"}],
        [{text:"STATS",callback_data:"stats"}]
      ]
    }
  });
});
