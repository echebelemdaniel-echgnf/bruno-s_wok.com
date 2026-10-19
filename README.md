# Bruno’s Wok Chinese Takeaway: Website and Order Backend

A one-page ordering website with a Node.js backend. Customers browse the menu, build an order and send it on WhatsApp. Orders are also saved on the server, and an admin page lets the restaurant manage them, change prices and mark dishes as sold out.

There are **no packages to install**. You only need Node.js.

## 1. Install Node.js

1. Go to https://nodejs.org and download the **LTS** version (Node 18 or newer).
2. Install it, then open a terminal (Command Prompt or PowerShell on Windows, Terminal on Mac or Linux) and check:

```bash
node -v
```

It should print `v18` or higher.

## 2. Set up the project

Unzip `brunos-wok-site.zip`, open a terminal inside the `brunos-wok-site` folder, and create your settings file:

```bash
# Mac / Linux
cp .env.example .env

# Windows (Command Prompt)
copy .env.example .env
```

Open `.env` in any text editor and change at least these two lines:

```
ADMIN_PASSWORD=choose-a-long-password-here
SESSION_SECRET=any-long-random-text-like-k39dj2nx8slq0
```

## 3. Start the server

```bash
npm start
```

You should see: `Bruno’s Wok running on http://localhost:3000`

- Website: http://localhost:3000
- Admin page: http://localhost:3000/admin (log in with your `ADMIN_PASSWORD`)

Stop the server with `Ctrl + C`.

If you skip step 2, the server still starts, but it uses a random admin password that is printed in the terminal and changes every time you restart.

### Trying it from your phone on the same Wi-Fi

Find your computer’s local IP address (for example `192.168.1.20`) and open `http://192.168.1.20:3000` on the phone.

## 4. Put it online (keep it running)

Your site must run on a host that supports Node.js and has a disk that is not wiped on restart. Good options are a small VPS, Render, Railway, Fly.io (with a volume), or cPanel hosting with “Setup Node.js App”.

On a VPS or any server you control:

```bash
npm install -g pm2          # keeps the app running and restarts it after crashes
pm2 start server.js --name brunos-wok
pm2 save
pm2 startup                 # follow the command it prints, so it starts on reboot
```

Then put it behind HTTPS (for example with Caddy or nginx and a free Let’s Encrypt certificate) and point your domain at the server. If you use a proxy, set `TRUST_PROXY=1` in `.env`. On hosts like Render or Railway, set the settings below as environment variables in their dashboard instead of using a `.env` file. Use `npm start` as the start command.

Plain static hosts such as Netlify or GitHub Pages cannot run this backend.

## Settings

Set these in `.env` (or as environment variables on your host).

| Variable | Default | Meaning |
|----------|---------|---------|
| `ADMIN_PASSWORD` | random each start | Admin login password |
| `SESSION_SECRET` | random each start | Signs admin logins. Set it so you stay logged in after restarts |
| `PORT` | 3000 | Port to listen on (most hosts set this for you) |
| `DATA_DIR` | `./data` | Folder for `menu.json` and `orders.json`. Point it at a persistent disk on your host |
| `RETENTION_DAYS` | 90 | Orders older than this are deleted automatically. Keep the Privacy Policy wording in sync |
| `TRUST_PROXY` | 0 | Set to 1 only when behind a proxy or host that sets `X-Forwarded-For` |

Write each setting on its own line as `NAME=value`, with no comments after the value. Real environment variables override `.env`.

## Using the admin page (`/admin`)

- **Orders:** new orders are outlined in red. Change the status (new, confirmed, preparing, ready, delivered, cancelled), reply to the customer on WhatsApp, or delete an order if a customer asks you to erase their data. The list refreshes every 30 seconds.
- **Menu:** change any price or tick or untick Available. Changes go live immediately.

## Folder layout

| Path | Purpose |
|------|---------|
| `server.js` | The backend: static files, menu API, order API, admin API |
| `package.json` | Defines `npm start` |
| `.env.example` | Template for your settings |
| `public/` | The website: `index.html`, `style.css`, `script.js`, admin files, legal pages, `logo.jpg`, `food.jpg` |
| `data/menu.json` | Menu, prices, hours and business details |
| `data/orders.json` | Saved orders (created automatically) |
| `COMPLIANCE.md` | Launch checklist and what you still need to do |

## Backend API

| Endpoint | Auth | What it does |
|----------|------|--------------|
| `GET /api/menu` | none | Menu and settings |
| `POST /api/orders` | none | Place an order. Prices are recalculated on the server, so customers cannot change them |
| `POST /api/admin/login` | password | Returns a token valid for 12 hours |
| `GET /api/admin/orders` | token | List orders |
| `PATCH /api/admin/orders/:id` | token | Update status |
| `DELETE /api/admin/orders/:id` | token | Delete an order |
| `PATCH /api/admin/items/:id` | token | Change price or availability |
| `GET /healthz` | none | Health check (use it for host uptime checks) |

Built-in protections: server-side validation and pricing, request size limit, rate limits on orders and logins, constant-time password check, signed expiring admin tokens, atomic file writes, path-traversal protection, and strict security headers including a Content-Security-Policy.

## Common edits

- **Prices and availability:** use the admin Menu tab, or edit `data/menu.json` and restart.
- **Opening hours, address, phone, Instagram:** `settings` in `data/menu.json`. The phone number and Instagram links in `public/index.html` and the legal pages are written in the HTML, so update them there too.
- **Colours:** variables at the top of `public/style.css`.
- **Logo and photo:** replace `public/logo.jpg` and `public/food.jpg`.

## Backups

Everything the business creates lives in the `data/` folder. Copy `data/menu.json` and `data/orders.json` somewhere safe regularly. Orders are deleted automatically after the retention period, so download anything you need for your own records before then.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `node` is not recognised | Install Node.js, then open a new terminal window |
| `EADDRINUSE` (port already in use) | Another program uses that port. Set a different `PORT` in `.env` |
| Menu says it could not load | Open the site through the server (http://localhost:3000), not by double-clicking `index.html` |
| Forgot the admin password | Change `ADMIN_PASSWORD` in `.env` and restart |
| Kicked out of admin after every restart | Set a fixed `SESSION_SECRET` |
| Orders disappear after a redeploy | Your host wipes the disk. Set `DATA_DIR` to a persistent volume |
| Too many orders / login attempts message | Built-in rate limit. Wait a few minutes |
