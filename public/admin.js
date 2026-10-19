(function () {
  "use strict";
  var $ = function (i) { return document.getElementById(i); }, T = sessionStorage.getItem("bw_admin") || "", data = { orders: [], statuses: [] }, menu = null, timer = null;
  var fm = function (v) { return "₦" + Number(v).toLocaleString("en-US"); };
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") e.className = attrs[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    [].concat(kids == null ? [] : kids).forEach(function (c) { if (c != null) e.appendChild(typeof c === "object" ? c : document.createTextNode(c)); });
    return e;
  }
  function api(p, opt) {
    opt = opt || {}; opt.headers = Object.assign({ "Content-Type": "application/json", Authorization: "Bearer " + T }, opt.headers);
    return fetch(p, opt).then(function (r) { return r.json().then(function (j) { if (r.status === 401 && T) logout(); if (!r.ok) throw new Error(j.error || "Error"); return j; }); });
  }
  function logout() { T = ""; sessionStorage.removeItem("bw_admin"); clearInterval(timer); $("app").hidden = true; $("login").hidden = false; }
  function start() { $("login").hidden = true; $("app").hidden = false; loadOrders(); loadMenu(); clearInterval(timer); timer = setInterval(loadOrders, 30000); }

  $("lf").addEventListener("submit", function (e) {
    e.preventDefault(); $("le").textContent = "";
    fetch("api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: $("pw").value }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error); return j; }); })
      .then(function (j) { T = j.token; sessionStorage.setItem("bw_admin", T); $("pw").value = ""; start(); })
      .catch(function (er) { $("le").textContent = er.message || "Could not log in."; });
  });
  $("out").onclick = logout;
  function tab(n) { $("orders").hidden = n !== 1; $("menu").hidden = n !== 2; $("t1").setAttribute("aria-selected", n === 1); $("t2").setAttribute("aria-selected", n === 2); }
  $("t1").onclick = function () { tab(1); }; $("t2").onclick = function () { tab(2); };
  $("flt").onchange = renderOrders;

  function loadOrders() { api("api/admin/orders").then(function (j) { data = j; if (!$("flt").options.length) { ["all"].concat(j.statuses).forEach(function (s) { $("flt").appendChild(h("option", { value: s }, s)); }); } $("ret").textContent = "Orders are deleted automatically after " + j.retentionDays + " days."; renderOrders(); }).catch(function () {}); }
  function waNum(p) { var d = p.replace(/\D/g, ""); return d.charAt(0) === "0" && d.length === 11 ? "234" + d.slice(1) : d; }
  function renderOrders() {
    var f = $("flt").value || "all", L = data.orders.filter(function (o) { return f === "all" || o.status === f; }), box = $("olist");
    box.textContent = ""; $("cnt").textContent = L.length + " order" + (L.length === 1 ? "" : "s") + " · " + data.orders.filter(function (o) { return o.status === "new"; }).length + " new";
    if (!L.length) box.appendChild(h("p", { class: "muted" }, "No orders yet."));
    L.forEach(function (o) {
      var sel = h("select", { "aria-label": "Status for order " + o.id, onchange: function () { api("api/admin/orders/" + o.id, { method: "PATCH", body: JSON.stringify({ status: sel.value }) }).then(loadOrders).catch(function (e) { alert(e.message); }); } },
        data.statuses.map(function (s) { return h("option", { value: s, selected: s === o.status }, s); }));
      box.appendChild(h("article", { class: "card" + (o.status === "new" ? " new" : "") }, [
        h("h2", {}, [h("span", {}, o.id), h("span", {}, fm(o.total))]),
        h("div", { class: "muted" }, new Date(o.createdAt).toLocaleString("en-GB") + " · " + o.mode),
        h("div", {}, [h("strong", {}, o.name), " · ", h("a", { href: "tel:" + o.phone.replace(/[^\d+]/g, "") }, o.phone)]),
        o.address ? h("div", {}, "Deliver to: " + o.address) : null,
        h("ul", {}, o.items.map(function (i) { return h("li", {}, i.qty + " × " + i.name + " (" + fm(i.qty * i.price) + ")"); })),
        o.notes ? h("div", {}, "Notes: " + o.notes) : null,
        h("div", { class: "row" }, [sel,
          h("a", { href: "https://wa.me/" + waNum(o.phone) + "?text=" + encodeURIComponent("Hello " + o.name + ", this is Bruno’s Wok about your order " + o.id + "."), target: "_blank", rel: "noopener" }, "Reply on WhatsApp"),
          h("button", { type: "button", class: "del", "aria-label": "Delete order " + o.id, onclick: function () { if (confirm("Delete order " + o.id + " permanently?")) api("api/admin/orders/" + o.id, { method: "DELETE" }).then(loadOrders); } }, "Delete")])
      ]));
    });
  }
  function loadMenu() {
    fetch("api/menu").then(function (r) { return r.json(); }).then(function (m) {
      menu = m; var box = $("mlist"); box.textContent = "";
      m.categories.forEach(function (c) {
        box.appendChild(h("h2", { class: "cat" }, c.name));
        c.items.forEach(function (it) {
          var price = h("input", { type: "number", min: "0", step: "50", value: it.price, "aria-label": "Price for " + it.name }), av = h("input", { type: "checkbox", checked: it.available, "aria-label": it.name + " available" }), st = h("span", { class: "muted", "aria-live": "polite" });
          function save() { api("api/admin/items/" + it.id, { method: "PATCH", body: JSON.stringify({ price: price.value, available: av.checked }) }).then(function () { st.textContent = "Saved"; }).catch(function (e) { st.textContent = e.message; }); }
          price.addEventListener("change", save); av.addEventListener("change", save);
          box.appendChild(h("div", { class: "item" }, [h("span", {}, it.name), price, h("label", {}, [av, " Available"]), st]));
        });
      });
    });
  }
  if (T) { api("api/admin/orders").then(function (j) { data = j; start(); }).catch(logout); }
})();
