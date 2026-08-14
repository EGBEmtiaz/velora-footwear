import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import {fileURLToPath} from "node:url";
import crypto from "node:crypto";
import {supabase} from "./db.js";
import {loginAdmin,requireAdmin} from "./adminAuth.js";
import {BkashService} from "./bkash.js";
import {NagadService} from "./nagad.js";

const app=express();
app.use(cors({origin:true,credentials:true}));
app.use(express.json({limit:"1mb"}));
app.use(cookieParser());

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,"..","..");
const bkash=new BkashService(process.env);
const nagad=new NagadService(process.env);

const makeOrderNo=()=>`VEL-${Date.now().toString().slice(-8)}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

app.get("/api/health",async(_req,res)=>{
 const {error}=await supabase.from("products").select("id").limit(1);
 res.json({ok:!error,shop:"Velora Footwear",database:!error,bkash:Boolean(process.env.BKASH_APP_KEY&&process.env.BKASH_APP_SECRET&&process.env.BKASH_USERNAME&&process.env.BKASH_PASSWORD),nagad:nagad.enabled});
});

app.get("/api/products",async(_req,res)=>{
 const {data,error}=await supabase.from("products").select("*").eq("active",true).order("created_at",{ascending:false});
 if(error)return res.status(500).json({error:error.message});res.json(data);
});

app.post("/api/orders",async(req,res)=>{
 const {customer,items,payment}=req.body;
 if(!customer?.name||!customer?.phone||!customer?.address||!customer?.district||!Array.isArray(items)||!items.length||!payment)return res.status(400).json({error:"Incomplete order."});
 const ids=items.map(i=>i.id);
 const {data:products,error:pe}=await supabase.from("products").select("*").in("id",ids).eq("active",true);
 if(pe)return res.status(500).json({error:pe.message});
 const map=new Map(products.map(p=>[p.id,p]));
 let subtotal=0;const safeItems=[];
 for(const item of items){
   const p=map.get(item.id);const qty=Math.max(1,Math.min(99,Number(item.qty)||1));
   if(!p)return res.status(400).json({error:"Product unavailable."});
   if(p.stock<qty)return res.status(400).json({error:`Not enough stock for ${p.name}.`});
   subtotal+=Number(p.price)*qty;
   safeItems.push({product_id:p.id,product_name:p.name,unit_price:p.price,quantity:qty,line_total:Number(p.price)*qty});
 }
 const deliveryFee=0,total=subtotal+deliveryFee,orderNumber=makeOrderNo();
 const {data:order,error:oe}=await supabase.from("orders").insert({order_number:orderNumber,customer_name:customer.name,phone:customer.phone,address:customer.address,district:customer.district,payment_method:payment,payment_status:payment==="cod"?"unpaid":"pending",subtotal,delivery_fee:deliveryFee,total,order_status:"pending"}).select().single();
 if(oe)return res.status(500).json({error:oe.message});
 const {error:ie}=await supabase.from("order_items").insert(safeItems.map(x=>({...x,order_id:order.id})));
 if(ie){await supabase.from("orders").delete().eq("id",order.id);return res.status(500).json({error:ie.message});}
 res.json({orderId:order.id,orderNumber,total});
});

app.post("/api/payments/bkash/create",async(req,res)=>{
 const {orderId}=req.body;const {data:order,error}=await supabase.from("orders").select("*").eq("id",orderId).single();
 if(error||!order)return res.status(404).json({error:"Order not found."});
 try{const result=await bkash.create({amount:order.total,invoice:order.order_number,payerReference:order.phone,callbackURL:`${process.env.PUBLIC_BASE_URL}${process.env.BKASH_CALLBACK_PATH||"/api/payments/bkash/callback"}`});
   await supabase.from("orders").update({gateway_payment_id:result.paymentID,payment_status:"pending",updated_at:new Date().toISOString()}).eq("id",order.id);
   res.json({redirectURL:result.bkashURL,paymentID:result.paymentID});
 }catch(e){res.status(502).json({error:e.response?.data?.statusMessage||e.message});}
});

app.get("/api/payments/bkash/callback",async(req,res)=>{
 const paymentID=req.query.paymentID,status=req.query.status;
 const {data:order}=await supabase.from("orders").select("*").eq("gateway_payment_id",paymentID).single();
 if(!order)return res.status(404).send("Order not found");
 if(status==="cancel"||status==="failure"){await supabase.from("orders").update({payment_status:"failed",updated_at:new Date().toISOString()}).eq("id",order.id);return res.redirect(`${process.env.PUBLIC_BASE_URL}/?payment=failed&order=${order.order_number}`);}
 try{const result=await bkash.execute(paymentID);const paid=result?.transactionStatus==="Completed"||result?.statusCode==="0000";await supabase.from("orders").update({payment_status:paid?"paid":"failed",gateway_transaction_id:result?.trxID||null,updated_at:new Date().toISOString()}).eq("id",order.id);return res.redirect(`${process.env.PUBLIC_BASE_URL}/?payment=${paid?"success":"failed"}&order=${order.order_number}`);}catch{await supabase.from("orders").update({payment_status:"failed",updated_at:new Date().toISOString()}).eq("id",order.id);return res.redirect(`${process.env.PUBLIC_BASE_URL}/?payment=failed&order=${order.order_number}`);}
});

app.post("/api/payments/nagad/create",async(req,res)=>{
 try{const {orderId}=req.body;const {data:order}=await supabase.from("orders").select("*").eq("id",orderId).single();if(!order)return res.status(404).json({error:"Order not found"});const result=await nagad.create(order);res.json(result);}
 catch(e){res.status(501).json({error:e.message,code:e.code||"NAGAD_ERROR"});}
});

/* Admin */
app.post("/api/admin/login",(req,res)=>{
 const {email,password}=req.body;const token=loginAdmin(email,password);
 if(!token)return res.status(401).json({error:"Invalid admin credentials"});
 res.cookie("velora_admin",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",maxAge:12*60*60*1000});
 res.json({ok:true});
});
app.post("/api/admin/logout",(req,res)=>{res.clearCookie("velora_admin");res.json({ok:true})});
app.get("/api/admin/me",requireAdmin,(req,res)=>res.json({email:req.admin.email,role:"admin"}));

app.get("/api/admin/stats",requireAdmin,async(_req,res)=>{
 const [{count:orders},{count:products},{data:revenueRows}]=await Promise.all([
   supabase.from("orders").select("*",{count:"exact",head:true}),
   supabase.from("products").select("*",{count:"exact",head:true}),
   supabase.from("orders").select("total").eq("payment_status","paid")
 ]);
 const revenue=(revenueRows||[]).reduce((s,x)=>s+Number(x.total||0),0);
 res.json({orders:orders||0,products:products||0,revenue});
});
app.get("/api/admin/orders",requireAdmin,async(req,res)=>{
 const limit=Math.min(100,Math.max(1,Number(req.query.limit)||50));
 const {data,error}=await supabase.from("orders").select("*,order_items(*)").order("created_at",{ascending:false}).limit(limit);
 if(error)return res.status(500).json({error:error.message});res.json(data);
});
app.patch("/api/admin/orders/:id",requireAdmin,async(req,res)=>{
 const allowed=["order_status","payment_status","notes"];
 const patch={};for(const k of allowed)if(req.body[k]!==undefined)patch[k]=req.body[k];
 patch.updated_at=new Date().toISOString();
 const {data,error}=await supabase.from("orders").update(patch).eq("id",req.params.id).select().single();
 if(error)return res.status(400).json({error:error.message});res.json(data);
});
app.get("/api/admin/products",requireAdmin,async(_req,res)=>{
 const {data,error}=await supabase.from("products").select("*").order("created_at",{ascending:false});
 if(error)return res.status(500).json({error:error.message});res.json(data);
});
app.post("/api/admin/products",requireAdmin,async(req,res)=>{
 const {name,name_bn,category,price,stock,image_url,badge}=req.body;
 const {data,error}=await supabase.from("products").insert({name,name_bn,category,price,stock,image_url,badge,active:true}).select().single();
 if(error)return res.status(400).json({error:error.message});res.json(data);
});
app.patch("/api/admin/products/:id",requireAdmin,async(req,res)=>{
 const allowed=["name","name_bn","category","price","stock","image_url","badge","active"];
 const patch={};for(const k of allowed)if(req.body[k]!==undefined)patch[k]=req.body[k];
 patch.updated_at=new Date().toISOString();
 const {data,error}=await supabase.from("products").update(patch).eq("id",req.params.id).select().single();
 if(error)return res.status(400).json({error:error.message});res.json(data);
});

app.use(express.static(root));
app.use("/admin",express.static(path.join(path.resolve(__dirname,".."),"public","admin")));
app.use((req,res)=>{
 if(req.path.startsWith("/admin"))return res.sendFile(path.join(server,"public","admin","index.html"));
 res.sendFile(path.join(root,"index.html"));
});

const port=Number(process.env.PORT||3000);
if (process.env.VERCEL) {
  // Vercel invokes the Express app as a serverless function.
  export default app;
} else {
  app.listen(port,()=>console.log(`Velora production server on :${port}`));
}
