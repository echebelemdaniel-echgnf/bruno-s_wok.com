# Launch checklist

Based on the “vibecoded site” checklist video. Status is what is done in the code. **Owner action** is what only you can do.

The legal pages are sensible templates written for a Nigerian takeaway, but they are not legal advice. Have a Nigerian lawyer review them, and make sure the refund and cancellation terms match how you really operate.

| Checklist item | Status | Owner action |
|---|---|---|
| Privacy policy page | Done: `privacy.html`, written around the Nigeria Data Protection Act 2023 | Lawyer review |
| T&Cs page | Done: `terms.html` | Lawyer review |
| Refund policy | Done: `refunds.html` (same-day problem reports, remake, replace or refund) | Confirm these terms are what you actually do, then edit the page |
| Cookies policy | Done: `cookies.html`. Site sets no cookies; basket is kept in local storage | None |
| Check for cookie consent | No banner needed because there are no non-essential cookies or trackers | If you add analytics, Facebook Pixel or similar later, add a consent banner first |
| Form consent | Done: required checkbox at checkout; consent time is saved with each order | None |
| Only collect necessary data | Done: name and phone only; address only for delivery; notes optional; no accounts, no card data, IPs not stored | None |
| Data retention and deletion | Done: auto-delete after 90 days; admin can delete an order on request | Reply to erasure requests promptly |
| Check 3rd party embeds | Done: Google Fonts removed, system fonts used. No third-party scripts, fonts or embeds. Strict CSP enforces this | None |
| Check tracking | Done: none | None |
| Fix accessibility | Done: skip link, landmarks, labelled form fields, focus handling in the order dialog (Esc closes, focus trapped), reduced-motion respected, 40px buttons | Test with a screen reader on your phone |
| Check colour contrast | Done: every text and background pair in light and dark mode measured at 4.5:1 or better | Re-check if you change colours |
| Alt text on images | Done: logo and food photo | Add alt text to any new images |
| Clear button labels | Done: every Add, plus, minus and Delete button names the dish or order | None |
| Keyboard-friendly forms | Done: real form, Enter submits, tab order works, correct autocomplete and phone keypad | None |
| Add real business details | Done: trading name, address, phone, WhatsApp, Instagram and opening hours (Tue–Sun 11 AM–9 PM, Mon 12–5 PM) | The business is not registered yet, so the site uses the trading name only and shows no CAC number. Once registered, add the registered name and RC/BN number to the footer and the Contact section of each legal page. Update `settings.hours` in `data/menu.json` if hours change |
| Remove fake reviews | None on the site | Only add real customer reviews, with permission |
| Check copyright on images | Logo and food photo come from your own WhatsApp Business profile. No stock or menu-image photos used | Confirm you own the rights to both photos (the photographer, if someone else took it) |
| Check local laws | Written for Nigeria: NDPA 2023, consumer protection | Register the business name with the Corporate Affairs Commission (CAC), which is generally expected for anyone trading under a business name. Also check whether you must register with the Nigeria Data Protection Commission, and get any food-business or health permits your state requires. Ask a lawyer or accountant to confirm what applies to you |
| Remove unsupported claims | Done: removed the cutlery claim and softened delivery and pricing wording. No “best”, “fastest” or similar claims | Do not add claims you cannot prove |
