"use strict";
/* Bruno's Wok backend: zero dependencies, Node 18+.
   Serves /public, a public menu API, an order API, and a password-protected admin API. */
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");

/* Minimal .env loader (works on any Node 18+, no packages). Real environment variables win. */
try {
  fs.readFileSync(path.join(__dirname, ".env"), "utf8").split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, "$2");
  });
} catch (e) { /* no .env file: fine */ }

const PORT = +process.env.PORT || 3000;
const DATA = path.resolve(process.env.DATA_DIR || path.join(__dirname, "data"));
const PUB = path.join(__dirname, "public");
const RETENTION_DAYS = +process.env.RETENTION_DAYS || 90;
const TRUST_PROXY = process.env.TRUST_PROXY === "1";
const STATUSES = ["new", "confirmed", "preparing", "ready", "delivered", "cancelled"];

let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  ADMIN_PASSWORD = crypto.randomBytes(8).toString("hex");
  console.log("ADMIN_PASSWORD not set. Temporary admin password for this run: " + ADMIN_PASSWORD);
}
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

fs.mkdirSync(DATA, { recursive: true });
const MENU_FILE = path.join(DATA, "menu.json"), ORDERS_FILE = path.join(DATA, "orders.json");
if (!fs.existsSync(MENU_FILE)) fs.copyFileSync(path.join(__dirname, "data", "menu.json"), MENU_FILE);
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "[]");

const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const write = (f, d) => { const t = f + ".tmp"; fs.writeFileSync(t, JSON.stringify(d, null, 2)); fs.renameSync(t, f); };

/* ---------- helpers ---------- */
const ip = (req) => (TRUST_PROXY && req.headers["x-forwarded-for"] ? String(req.headers["x-forwarded-for"]).split(",")[0].trim() : req.socket.remoteAddress) || "?";
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now(), arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(key, arr);
  return arr.length > max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 3600e3)) hits.delete(k); }, 600e3).unref();

function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}
function body(req) {
  return new Promise((ok, no) => {
    let n = 0; const chunks = [];
    req.on("data", (c) => { n += c.length; if (n > 20000) { no({ code: 413, msg: "Request too large." }); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { ok(JSON.parse(Buffer.concat(chunks).toString() || "{}")); } catch (e) { no({ code: 400, msg: "Invalid JSON." }); } });
    req.on("error", () => no({ code: 400, msg: "Bad request." }));
  });
}
const sha = (s) => crypto.createHash("sha256").update(String(s)).digest();
const safeEq = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
function sign(p) { const b = Buffer.from(JSON.stringify(p)).toString("base64url"); return b + "." + crypto.createHmac("sha256", SECRET).update(b).digest("base64url"); }
function verify(tok) {
  const [b, s] = String(tok || "").split(".");
  if (!b || !s) return false;
  const good = crypto.createHmac("sha256", SECRET).update(b).digest("base64url");
  if (s.length !== good.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return false;
  try { return JSON.parse(Buffer.from(b, "base64url").toString()).exp > Date.now(); } catch (e) { return false; }
}
const authed = (req) => verify((req.headers.authorization || "").replace(/^Bearer /, ""));
const clean = (s, max) => String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);

/* ---------- orders ---------- */
function nextId(orders) {
  const d = new Date(), day = d.toISOString().slice(2, 10).replace(/-/g, "");
  const n = orders.filter((o) => o.id.startsWith("BW-" + day)).length + 1;
  return "BW-" + day + "-" + String(n).padStart(3, "0");
}
function purge() {
  const cut = Date.now() - RETENTION_DAYS * 864e5, all = read(ORDERS_FILE), keep = all.filter((o) => Date.parse(o.createdAt) > cut);
  if (keep.length !== all.length) { write(ORDERS_FILE, keep); console.log("Purged " + (all.length - keep.length) + " order(s) older than " + RETENTION_DAYS + " days."); }
}
purge(); setInterval(purge, 864e5).unref();

async function createOrder(req, res) {
  if (limited("o:" + ip(req), 8, 600e3)) return send(res, 429, { error: "Too many orders from this connection. Please wait a few minutes." });
  let b; try { b = await body(req); } catch (e) { return send(res, e.code, { error: e.msg }); }
  const name = clean(b.name, 80), phone = clean(b.phone, 20), notes = clean(b.notes, 300);
  const mode = b.mode === "Delivery" ? "Delivery" : "Pickup", address = mode === "Delivery" ? clean(b.address, 200) : "";
  if (b.consent !== true) return send(res, 400, { error: "Please tick the box to agree to the Privacy Policy." });
  if (!name) return send(res, 400, { error: "Please enter your name." });
  if (!/^[+\d][\d\s\-()+]{6,19}$/.test(phone)) return send(res, 400, { error: "Please enter a valid phone number." });
  if (mode === "Delivery" && !address) return send(res, 400, { error: "Please enter your delivery address." });
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 30) return send(res, 400, { error: "Your order is empty or too large." });

  const menu = read(MENU_FILE), idx = {};
  menu.categories.forEach((c) => c.items.forEach((i) => (idx[i.id] = i)));
  const lines = [], seen = new Set(); let total = 0;
  for (const l of b.items) {
    const it = idx[l && l.id], qty = Math.floor(Number(l && l.qty));
    if (!it || seen.has(it.id) || !(qty >= 1 && qty <= 50)) return send(res, 400, { error: "One of the items in your order is not valid. Please refresh and try again." });
    if (!it.available) return send(res, 400, { error: it.name + " is sold out. Please remove it and try again." });
    seen.add(it.id); total += qty * it.price;
    lines.push({ id: it.id, name: it.name, price: it.price, qty });
  }
  const orders = read(ORDERS_FILE), id = nextId(orders);
  orders.push({ id, createdAt: new Date().toISOString(), status: "new", name, phone, mode, address, notes, items: lines, total, consentAt: new Date().toISOString() });
  write(ORDERS_FILE, orders);
  send(res, 201, { id, total, items: lines });
}

/* ---------- admin ---------- */
async function admin(req, res, url) {
  if (url.pathname === "/api/admin/login" && req.method === "POST") {
    if (limited("l:" + ip(req), 10, 900e3)) return send(res, 429, { error: "Too many attempts. Try again later." });
    let b; try { b = await body(req); } catch (e) { return send(res, e.code, { error: e.msg }); }
    if (!safeEq(b.password || "", ADMIN_PASSWORD)) return send(res, 401, { error: "Wrong password." });
    return send(res, 200, { token: sign({ exp: Date.now() + 12 * 3600e3 }) });
  }
  if (!authed(req)) return send(res, 401, { error: "Please log in." });
  const p = url.pathname;
  if (p === "/api/admin/orders" && req.method === "GET") return send(res, 200, { orders: read(ORDERS_FILE).reverse(), statuses: STATUSES, retentionDays: RETENTION_DAYS });
  let m = p.match(/^\/api\/admin\/orders\/([\w-]+)$/);
  if (m && (req.method === "PATCH" || req.method === "DELETE")) {
    const orders = read(ORDERS_FILE), i = orders.findIndex((o) => o.id === m[1]);
    if (i < 0) return send(res, 404, { error: "Order not found." });
    if (req.method === "DELETE") { orders.splice(i, 1); write(ORDERS_FILE, orders); return send(res, 200, { ok: true }); }
    let b; try { b = await body(req); } catch (e) { return send(res, e.code, { error: e.msg }); }
    if (!STATUSES.includes(b.status)) return send(res, 400, { error: "Invalid status." });
    orders[i].status = b.status; write(ORDERS_FILE, orders);
    return send(res, 200, orders[i]);
  }
  m = p.match(/^\/api\/admin\/items\/([\w-]+)$/);
  if (m && req.method === "PATCH") {
    let b; try { b = await body(req); } catch (e) { return send(res, e.code, { error: e.msg }); }
    const menu = read(MENU_FILE); let item = null;
    menu.categories.forEach((c) => c.items.forEach((x) => { if (x.id === m[1]) item = x; }));
    if (!item) return send(res, 404, { error: "Item not found." });
    if (b.price !== undefined) { const v = Math.round(Number(b.price)); if (!(v >= 0 && v <= 1e7)) return send(res, 400, { error: "Invalid price." }); item.price = v; }
    if (b.available !== undefined) item.available = !!b.available;
    write(MENU_FILE, menu); return send(res, 200, item);
  }
  send(res, 404, { error: "Not found." });
}

/* ---------- static files ---------- */
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8" };
const HEADERS = {
  "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
};
function serve(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === "/") p = "/index.html"; else if (p === "/admin") p = "/admin.html"; else if (!path.extname(p) && fs.existsSync(path.join(PUB, p + ".html"))) p += ".html";
  const file = path.normalize(path.join(PUB, p));
  if (!file.startsWith(PUB + path.sep)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("Not found"); }
    const ext = path.extname(file);
    res.writeHead(200, Object.assign({ "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": ext === ".jpg" ? "public, max-age=86400" : "no-cache" }, HEADERS));
    res.end(data);
  });
}

/* ---------- server ---------- */
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/healthz") return send(res, 200, { ok: true });
    if (url.pathname === "/api/menu" && req.method === "GET") return send(res, 200, read(MENU_FILE));
    if (url.pathname === "/api/orders" && req.method === "POST") return createOrder(req, res);
    if (url.pathname.startsWith("/api/admin/")) return admin(req, res, url);
    if (url.pathname.startsWith("/api/")) return send(res, 404, { error: "Not found." });
    if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end(); }
    serve(req, res, url);
  } catch (e) { console.error(e); if (!res.headersSent) send(res, 500, { error: "Server error." }); }
}).listen(PORT, () => console.log("Bruno’s Wok running on http://localhost:" + PORT + "  (admin: /admin)"));
