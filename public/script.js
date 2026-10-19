(function () {
  "use strict";
  var $ = function (i) { return document.getElementById(i); };
  var fm = function (v) { return "₦" + Number(v).toLocaleString("en-US"); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var items = {}, cart = {}, settings = { whatsapp: "2349032357438" };
  try { cart = JSON.parse(localStorage.getItem("bw_cart") || "{}"); } catch (e) { cart = {}; }

  fetch("api/menu").then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(init).catch(function () {
    $("menu").innerHTML = '<p class="note">The menu could not load right now. Please refresh, or message us on WhatsApp.</p>';
  });

  function t12(s) { var p = s.split(":"), h = +p[0]; return ((h + 11) % 12 + 1) + ":" + p[1] + " " + (h < 12 ? "AM" : "PM"); }
  function mins(s) { var p = s.split(":"); return +p[0] * 60 + +p[1]; }
  function hoursText(list, sep) { return list.map(function (r) { return r.label + " " + t12(r.open) + " – " + t12(r.close); }).join(sep); }
  function openRule(list, now) {
    try {
      var o = {};
      new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now || new Date()).forEach(function (p) { o[p.type] = p.value; });
      var d = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(o.weekday), m = +o.hour * 60 + +o.minute;
      for (var i = 0; i < list.length; i++) if (list[i].days.indexOf(d) > -1 && m >= mins(list[i].open) && m < mins(list[i].close)) return list[i];
    } catch (e) {}
    return null;
  }
  // end hours

  function init(data) {
    settings = data.settings || settings;
    var m = "", n = "", p = "";
    data.categories.forEach(function (c) {
      var lo = Infinity, hi = 0;
      m += '<section id="' + c.id + '"><h2>' + esc(c.name) + "</h2><ul>";
      c.items.forEach(function (x) {
        items[x.id] = x;
        lo = Math.min(lo, x.price); hi = Math.max(hi, x.price);
        m += '<li class="' + (x.available ? "" : "off") + '"><span>' + esc(x.name) + "</span><i></i><b>" + fm(x.price) + "</b>" +
          (x.available ? '<span class="q" data-k="' + x.id + '"></span>' : '<span class="so">Sold out</span>') + "</li>";
      });
      m += "</ul></section>";
      n += '<a href="#' + c.id + '">' + esc(c.name.replace(" (Dim Sum)", "")) + "</a>";
      p += '<a class="pc" href="#' + c.id + '"><h3>' + esc(c.name.replace(" (Dim Sum)", "")) + "</h3><strong>" +
        (lo === hi ? fm(lo) : fm(lo) + " – " + fm(hi)) + "</strong><small>" + c.items.length + (c.items.length === 1 ? " dish" : " dishes") + "</small></a>";
    });
    $("menu").innerHTML = m;
    $("menu-start").innerHTML = n + '<a href="#pricing">Pricing</a><a href="#faq">FAQ</a>';
    $("pricegrid").innerHTML = p;
    if (settings.address) $("faqaddr").textContent = settings.address + ".";
    if (Array.isArray(settings.hours) && settings.hours.length) {
      $("faqhours").textContent = hoursText(settings.hours, "; ") + ". Times are Nigerian time (WAT).";
      var r = openRule(settings.hours);
      $("openbadge").textContent = r ? "Open now · until " + t12(r.close) : "Closed right now · see our hours below";
      $("closednote").hidden = !!r;
    }
    if (Array.isArray(settings.hours) && settings.hours.length) $("fhours").textContent = "Hours: " + hoursText(settings.hours, " · ");
    draw();
  }

  function qh(k) {
    var q = cart[k] || 0, nm = esc(items[k] ? items[k].name : "");
    return q ? '<button type="button" data-a="-" data-k="' + k + '" aria-label="Remove one ' + nm + '">−</button><em aria-label="' + q + ' in order">' + q + '</em><button type="button" data-a="+" data-k="' + k + '" aria-label="Add one more ' + nm + '">+</button>'
      : '<button type="button" class="add" data-a="+" data-k="' + k + '" aria-label="Add ' + nm + ' to order">Add</button>';
  }

  function draw() {
    var cnt = 0, sum = 0, L = "";
    Object.keys(cart).forEach(function (k) {
      var q = cart[k], it = items[k];
      if (!(q > 0) || !it || !it.available) { delete cart[k]; return; }
      cnt += q; sum += q * it.price;
      L += '<div class="ln"><span>' + esc(it.name) + '</span><span class="q" data-k="' + k + '"></span><b>' + fm(q * it.price) + "</b></div>";
    });
    $("lines").innerHTML = L || '<p class="hint">Your order is empty.</p>';
    document.querySelectorAll(".q").forEach(function (e) { e.innerHTML = qh(e.dataset.k); });
    $("tot").textContent = fm(sum);
    var b = $("bar");
    b.className = "bar" + (cnt ? " on" : "");
    b.textContent = "View order · " + cnt + (cnt === 1 ? " item · " : " items · ") + fm(sum);
    if (!cnt && !$("frm").hidden) $("ov").className = "ov";
    try { localStorage.setItem("bw_cart", JSON.stringify(cart)); } catch (e) {}
  }

  var opener = null;
  function openSheet() { opener = document.activeElement; $("frm").hidden = false; $("done").hidden = true; $("ov").className = "ov on"; $("ot").focus(); }
  function closeSheet() { $("ov").className = "ov"; if (opener && opener.focus) opener.focus(); }
  document.addEventListener("keydown", function (e) {
    if ($("ov").className.indexOf("on") < 0) return;
    if (e.key === "Escape") { closeSheet(); return; }
    if (e.key !== "Tab") return;
    var f = [].slice.call($("ov").querySelectorAll("button,input,select,textarea,a[href]")).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === a || document.activeElement === $("ot"))) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  });

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.a) {
      var k = t.dataset.k;
      cart[k] = Math.min(50, Math.max(0, (cart[k] || 0) + (t.dataset.a === "+" ? 1 : -1)));
      draw();
    }
  });
  $("bar").onclick = openSheet;
  $("x").onclick = closeSheet;
  $("ov").onclick = function (e) { if (e.target === this) closeSheet(); };
  $("md").onchange = function () { $("adw").hidden = this.value !== "Delivery"; };

  $("frm").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = $("go"), er = $("er");
    var nm = $("nm").value.trim(), ph = $("ph").value.trim(), dl = $("md").value === "Delivery", ad = $("ad").value.trim(), nt = $("nt").value.trim();
    if (!nm || !ph) { er.textContent = "Please enter your name and phone number."; return; }
    if (dl && !ad) { er.textContent = "Please enter your delivery address."; return; }
    if (!$("cs").checked) { er.textContent = "Please tick the box to agree to the Privacy Policy."; return; }
    var lines = Object.keys(cart).map(function (k) { return { id: k, qty: cart[k] }; });
    if (!lines.length) { er.textContent = "Your order is empty."; return; }
    er.textContent = ""; btn.disabled = true; btn.textContent = "Sending…";
    var body = { name: nm, phone: ph, mode: dl ? "Delivery" : "Pickup", address: ad, notes: nt, consent: true, items: lines };

    fetch("api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok) { er.textContent = res.j.error || "Something went wrong. Please try again."; return; }
        finish(res.j.id, res.j.total, res.j.items, body);
      })
      .catch(function () {
        var local = lines.map(function (l) { return { name: items[l.id].name, qty: l.qty, price: items[l.id].price }; });
        var tot = local.reduce(function (s, x) { return s + x.qty * x.price; }, 0);
        finish(null, tot, local, body);
      })
      .then(function () { btn.disabled = false; btn.textContent = "Send order on WhatsApp"; });
  });

  function finish(id, total, list, b) {
    var t = "Hello Bruno’s Wok, I’d like to place an order" + (id ? " (" + id + ")" : "") + ":\n\n";
    list.forEach(function (x) { t += "• " + x.qty + " × " + x.name + " (" + fm(x.qty * x.price) + ")\n"; });
    t += "\nTotal: " + fm(total) + " (delivery not included)\nName: " + b.name + "\nPhone: " + b.phone + "\n" + (b.mode === "Delivery" ? "Delivery to: " + b.address : "Pickup");
    if (b.notes) t += "\nNotes: " + b.notes;
    var url = "https://wa.me/" + (settings.whatsapp || "2349032357438") + "?text=" + encodeURIComponent(t);
    cart = {}; draw(); $("cs").checked = false; $("nt").value = "";
    $("frm").hidden = true; $("done").hidden = false;
    $("donemsg").textContent = id ? "Order " + id + " received. Send the message in WhatsApp to confirm it with us." : "Almost done. Send the message in WhatsApp to place your order.";
    $("walink").href = url;
    $("ov").className = "ov on"; $("ot").focus();
    window.location.href = url;
  }
})();
