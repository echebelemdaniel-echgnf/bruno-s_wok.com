var M=[["Starters (Dim Sum)",[["Vegetable Springrolls (3)",3000],["Sesame Prawn Toast",4000],["Pork & Shrimp Springrolls (3)",4500],["Crispy Fried Wings",6000],["Dumplings (5)",6000],["BBQ Wings",6500],["Pork Ribs (Cantonese Style)",10000]]],
["Soups",[["Egg Drop Soup",4000],["Chicken Sweetcorn Soup",4500],["Peking Hot & Sour Soup",4500]]],
["Noodles",[["Singapore-Style Chilli Beef",8000],["Singapore-Style Chilli Chicken",6000],["Chicken Chow Mein",7500],["Shrimp Chow Mein",8000]]],
["Rice",[["Steamed White Rice",3500],["Egg Fried Rice",5000],["Chicken Fried Rice",5500],["Pork Fried Rice",5600],["Beef Fried Rice",5500],["Special Fried Rice",8500]]],
["Chicken",[["Chicken with Cashewnuts",6850],["Chicken in Chilli Sauce",6850],["Garlic Chicken",6850],["Chicken Katsu Curry",7000],["Chicken Sweet & Sour",7000]]],
["Beef",[["Shredded Beef in Oyster Sauce",7000],["Beef in Chilli Sauce",7000],["Beef Katsu Curry",7000],["Beef and Broccoli",7000]]],
["Pork",[["Pork in Chilli Sauce",6850],["Pork with Vegetables",6850],["Pork Katsu Curry",7000],["Pork Sweet & Sour",7000]]],
["Fish",[["Fish Fillet in Oyster Sauce",8500],["Fish Fillet in Chilli Sauce",8500],["Fish Fillet with Ginger & Scallion",9000],["Fish Fillet Sweet & Sour",9000]]],
["Drinks",[["Water 500",1000],["Coca Cola",1000],["Fanta",1000],["Sprite",1000]]]];
var m="",n="",items=[],cart={},$=function(i){return document.getElementById(i)};
var fm=function(v){return"₦"+v.toLocaleString("en-US")};
try{cart=JSON.parse(localStorage.getItem("bw_cart")||"{}")}catch(e){cart={}}
M.forEach(function(c,i){var id="c"+i;n+='<a href="#'+id+'">'+c[0].replace(" (Dim Sum)","")+'</a>';
m+='<section id="'+id+'"><h2>'+c[0]+'</h2><ul>'+c[1].map(function(x){var k=items.length;items.push({n:x[0],p:x[1]});return'<li><span>'+x[0].replace(/&/g,"&amp;")+'</span><i></i><b>'+fm(x[1])+'</b><span class="q" data-k="'+k+'"></span></li>'}).join("")+'</ul></section>'});
document.getElementById("menu").innerHTML=m;document.getElementById("menu-start").innerHTML=n;

function qh(k){var q=cart[k]||0;return q?'<button type="button" data-a="-" data-k="'+k+'" aria-label="Remove one">−</button><em>'+q+'</em><button type="button" data-a="+" data-k="'+k+'" aria-label="Add one">+</button>':'<button type="button" class="add" data-a="+" data-k="'+k+'">Add</button>'}
function draw(){var cnt=0,sum=0,L="";
Object.keys(cart).forEach(function(k){var q=cart[k];if(!(q>0)||!items[k]){delete cart[k];return}cnt+=q;sum+=q*items[k].p;L+='<div class="ln"><span>'+items[k].n.replace(/&/g,"&amp;")+'</span><span class="q" data-k="'+k+'"></span><b>'+fm(q*items[k].p)+'</b></div>'});
$("lines").innerHTML=L||'<p class="hint">Your order is empty.</p>';
document.querySelectorAll(".q").forEach(function(e){e.innerHTML=qh(e.dataset.k)});
$("tot").textContent=fm(sum);var b=$("bar");b.className="bar"+(cnt?" on":"");b.textContent="View order · "+cnt+(cnt==1?" item · ":" items · ")+fm(sum);
if(!cnt)$("ov").className="ov";
try{localStorage.setItem("bw_cart",JSON.stringify(cart))}catch(e){}}
document.addEventListener("click",function(e){var t=e.target;if(t.dataset&&t.dataset.a){var k=t.dataset.k;cart[k]=Math.max(0,(cart[k]||0)+(t.dataset.a=="+"?1:-1));draw()}});
$("bar").onclick=function(){$("ov").className="ov on"};
$("x").onclick=function(){$("ov").className="ov"};
$("ov").onclick=function(e){if(e.target==this)this.className="ov"};
$("md").onchange=function(){$("adw").hidden=this.value!="Delivery"};
$("go").onclick=function(){var nm=$("nm").value.trim(),ph=$("ph").value.trim(),dl=$("md").value=="Delivery",ad=$("ad").value.trim(),er=$("er");
if(!nm||!ph){er.textContent="Please enter your name and phone number.";return}
if(dl&&!ad){er.textContent="Please enter your delivery address.";return}
er.textContent="";var s=0,t="Hello Bruno’s Wok, I’d like to place an order:\n\n";
Object.keys(cart).forEach(function(k){var q=cart[k];s+=q*items[k].p;t+="• "+q+" × "+items[k].n+" ("+fm(q*items[k].p)+")\n"});
t+="\nTotal: "+fm(s)+" (delivery not included)\nName: "+nm+"\nPhone: "+ph+"\n"+(dl?"Delivery to: "+ad:"Pickup");
if($("nt").value.trim())t+="\nNotes: "+$("nt").value.trim();
var a=document.createElement("a");a.href="https://wa.me/2349032357438?text="+encodeURIComponent(t);a.target="_blank";a.rel="noopener";document.body.appendChild(a);a.click();a.remove()};
draw();