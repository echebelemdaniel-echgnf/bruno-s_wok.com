# Bruno’s Wok Chinese Takeaway Website

A one-page website for Bruno’s Wok Chinese Takeaway, New GRA, Port Harcourt. Customers browse the menu, build an order, and send it to the restaurant on WhatsApp.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure: hero, featured photo, menu, footer, order sheet |
| `style.css` | All styling, including automatic light and dark mode |
| `script.js` | Menu data, cart, and WhatsApp checkout |
| `logo.jpg` | Brand logo |
| `food.jpg` | Rice and Small Chops photo |

Keep all five files in the same folder. `index.html` loads the others by name.

## Features

- Full menu in 9 categories with prices in naira (₦)
- Add, remove and change quantities on every item
- Order total updates live; the cart survives a page refresh
- Checkout form: name, phone, pickup or delivery, address, notes
- Sends a ready-written order message to WhatsApp (+234 903 235 7438)
- Call and Instagram (@brunos_wok) buttons
- Works on phones and desktops

## Run it locally

Unzip the folder, then double-click `index.html` to open it in a browser. No installation is needed.

## Put it online

Upload the whole folder so that `index.html` sits at the top level. Any static host works, for example Netlify, Vercel, GitHub Pages, Cloudflare Pages, or regular cPanel hosting (upload into `public_html`).

## Common edits

**Change a price or menu item.** Open `script.js` and find the list at the top. Each item looks like `["Egg Fried Rice",5000]`. Edit the name or the number, or add a new line in the same format. Categories are the outer groups, such as `["Rice",[ ... ]]`.

**Change the phone number.** Search for `2349032357438` in `index.html` and `script.js` (WhatsApp links) and for `+2349032357438` in `index.html` (call links). Use the international format with no spaces or plus sign in WhatsApp links. Also update the visible text `0903 235 7438` and `+234 903 235 7438`.

**Change the Instagram handle.** Search for `brunos_wok` in `index.html`.

**Change the address.** Search for `Sani Abacha Road` in `index.html`.

**Change colours.** Edit the variables at the top of `style.css` (`--red`, `--gold`, `--bg`, and so on). The dark mode values are in the `prefers-color-scheme: dark` block just below.

**Replace the logo or photo.** Overwrite `logo.jpg` or `food.jpg` with a new image of the same name. A square logo and a landscape or square photo work best.

## Notes

- The fonts (Rammetto One and Nunito Sans) load from Google Fonts. Without internet the site falls back to system fonts.
- Orders are sent through WhatsApp only. Nothing is stored on a server, and online payment and delivery fees are not built in. Delivery fees and payment are agreed with the customer in the WhatsApp chat.
- Opening hours are not listed on the site because only Saturday hours (11:00 AM to 9:00 PM) were available. Add the full hours to the footer in `index.html` when you have them.
-
