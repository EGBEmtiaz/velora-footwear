const products=[
{id:1,name:"Velora Classic Heel",bn:"Velora Classic হিল",cat:"shoe",price:1290,icon:"👠",badge:"NEW"},
{id:2,name:"Rose Comfort Sandal",bn:"Rose Comfort স্যান্ডেল",cat:"sandal",price:890,icon:"👡",badge:"BEST"},
{id:3,name:"Elegant Bow Shoe",bn:"Elegant Bow জুতা",cat:"shoe",price:1190,icon:"🥿",badge:"NEW"},
{id:4,name:"Daily Comfort Sandal",bn:"Daily Comfort স্যান্ডেল",cat:"sandal",price:750,icon:"👡",badge:""},
{id:5,name:"Premium Party Heel",bn:"Premium Party হিল",cat:"shoe",price:1590,icon:"👠",badge:"PREMIUM"},
{id:6,name:"Soft Walk Sandal",bn:"Soft Walk স্যান্ডেল",cat:"sandal",price:990,icon:"🩴",badge:""},
{id:7,name:"Velora Fashion Shoe",bn:"Velora Fashion জুতা",cat:"shoe",price:1390,icon:"👟",badge:""},
{id:8,name:"Pearl Style Sandal",bn:"Pearl Style স্যান্ডেল",cat:"sandal",price:1090,icon:"👡",badge:"NEW"}
];
let lang=localStorage.getItem("veloraLang")||"en";
let cart=JSON.parse(localStorage.getItem("veloraCart")||"[]");
const money=n=>"৳"+n.toLocaleString("en-BD");

function save(){localStorage.setItem("veloraCart",JSON.stringify(cart));}
function renderProducts(filter="all"){
 const el=document.getElementById("products");
 el.innerHTML=products.filter(p=>filter==="all"||p.cat===filter).map(p=>`
 <article class="product">
  <div class="product-img">${p.badge?`<span class="badge">${p.badge}</span>`:""}${p.icon}</div>
  <div class="product-info">
   <h3>${lang==="bn"?p.bn:p.name}</h3>
   <p>${p.cat==="shoe"?(lang==="bn"?"স্টাইলিশ জুতা":"Stylish footwear"):(lang==="bn"?"আরামদায়ক স্যান্ডেল":"Comfortable sandal")}</p>
   <div class="price"><b>${money(p.price)}</b><button class="add" onclick="addCart(${p.id})">+ ${lang==="bn"?"কার্ট":"Cart"}</button></div>
  </div>
 </article>`).join("");
}
function addCart(id){
 const p=products.find(x=>x.id===id), found=cart.find(x=>x.id===id);
 if(found)found.qty++;else cart.push({...p,qty:1,size:""});
 save();renderCart();
}
function removeCart(id){cart=cart.filter(x=>x.id!==id);save();renderCart();}
function renderCart(){
 document.getElementById("cartCount").textContent=cart.reduce((s,p)=>s+p.qty,0);
 const el=document.getElementById("cartItems");
 el.innerHTML=cart.length?cart.map(p=>`<div class="cart-line"><div>${p.icon} <b>${lang==="bn"?p.bn:p.name}</b><small>${p.qty} × ${money(p.price)}</small></div><button class="remove" onclick="removeCart(${p.id})">Remove</button></div>`).join(""):`<p style="color:#888">${lang==="bn"?"কার্ট খালি।":"Your cart is empty."}</p>`;
 document.getElementById("cartTotal").textContent=money(cart.reduce((s,p)=>s+p.price*p.qty,0));
}
function applyLang(){
 document.documentElement.lang=lang;
 document.getElementById("langBtn").textContent=lang==="en"?"বাংলা":"English";
 document.querySelectorAll("[data-en]").forEach(e=>e.innerHTML=e.dataset[lang]);
 const active=document.querySelector(".filter.active");
 renderProducts(active?active.dataset.filter:"all");renderCart();
}
document.getElementById("langBtn").onclick=()=>{lang=lang==="en"?"bn":"en";localStorage.setItem("veloraLang",lang);fetch("/api/products").then(r=>r.ok?r.json():[]).then(remote=>{
 if(Array.isArray(remote)&&remote.length){
  products.length=0;
  remote.forEach(p=>products.push({id:p.id,name:p.name,bn:p.name_bn,cat:p.category,price:Number(p.price),icon:p.category==="shoe"?"👠":"👡",badge:p.badge||""}));
  applyLang();
 }
}).catch(()=>{});
applyLang();};
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderProducts(b.dataset.filter);});
const cartPanel=document.getElementById("cartPanel"),overlay=document.getElementById("overlay");
function openCart(){cartPanel.classList.add("open");overlay.classList.add("show")}
function closeCart(){cartPanel.classList.remove("open");overlay.classList.remove("show")}
document.getElementById("cartBtn").onclick=openCart;
document.getElementById("closeCart").onclick=closeCart;overlay.onclick=closeCart;

const modal=document.getElementById("checkoutModal");
function openCheckout(){
 if(!cart.length){alert(lang==="bn"?"আগে পণ্য কার্টে যোগ করুন।":"Add products to your cart first.");return;}
 document.getElementById("checkoutItems").innerHTML=cart.map(p=>`<div class="summary-line"><span>${lang==="bn"?p.bn:p.name} × ${p.qty}</span><b>${money(p.price*p.qty)}</b></div>`).join("");
 document.getElementById("checkoutTotal").textContent=money(cart.reduce((s,p)=>s+p.price*p.qty,0));
 modal.classList.add("show");closeCart();
}
document.getElementById("checkoutBtn").onclick=openCheckout;
document.getElementById("closeCheckout").onclick=()=>modal.classList.remove("show");
document.querySelector('[name="payment"]').onchange=e=>{
 const n=document.getElementById("paymentNote");
 n.textContent=e.target.value==="cod"
   ?(lang==="bn"?"পণ্য হাতে পাওয়ার সময় পেমেন্ট করবেন।":"Pay when the product is delivered.")
   :(lang==="bn"?"নিরাপদ hosted checkout-এর জন্য আপনাকে নির্বাচিত gateway-তে নিয়ে যাওয়া হবে।":"You will be redirected to the selected hosted payment gateway.");
};
document.getElementById("checkoutForm").onsubmit=async e=>{
 e.preventDefault();
 if(!cart.length){alert(lang==="bn"?"কার্ট খালি।":"Cart is empty.");return;}
 const fd=new FormData(e.target);
 const total=cart.reduce((s,p)=>s+p.price*p.qty,0);
 const payment=fd.get("payment");
 const payload={
   customer:{name:fd.get("name"),phone:fd.get("phone"),address:fd.get("address"),district:fd.get("district")},
   items:cart.map(p=>({id:p.id,name:p.name,qty:p.qty,price:p.price})),
   total,
   payment
 };
 try{
   const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const order=await r.json();
   if(!r.ok) throw new Error(order.error||"Order creation failed");
   if(payment==="bkash"){
     const p=await fetch("/api/payments/bkash/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:order.orderId})});
     const data=await p.json();
     if(!p.ok) throw new Error(data.error||"bKash payment could not start");
     window.location.href=data.redirectURL;
     return;
   }
   if(payment==="nagad"){
     const p=await fetch("/api/payments/nagad/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:order.orderId})});
     const data=await p.json();
     if(!p.ok) throw new Error(data.error||"Nagad payment is not configured yet");
     if(data.redirectURL) window.location.href=data.redirectURL;
     return;
   }
   cart=[];save();renderCart();modal.classList.remove("show");
   alert(lang==="bn"?`অর্ডার তৈরি হয়েছে। Order ID: ${order.orderId}`:`Order created. Order ID: ${order.orderId}`);
 }catch(err){
   alert((lang==="bn"?"পেমেন্ট/অর্ডার সমস্যা: ":"Payment/order error: ")+err.message);
 }
};
applyLang();
document.querySelector('[name="payment"]').dispatchEvent(new Event("change"));
