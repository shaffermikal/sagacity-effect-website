# Sagacity Effect LLC — Website

Static HTML site, no build step. Ready to deploy.

## Files

```
website/
├── index.html          # Home
├── about.html          # About
├── capabilities.html   # Capabilities / NAICS lanes
├── vendors.html        # Vendor application page
├── contact.html        # Contact
├── styles.css          # Shared stylesheet
├── script.js           # Mobile nav toggle (vanilla JS)
└── README.md           # This file
```

## Local preview

Open `index.html` in any browser. No server, no build step.

## Deployment

### Option A — Netlify Drop (free, ~5 min, easiest)

1. Go to https://app.netlify.com/drop
2. Drag the entire `website/` folder onto the page
3. Netlify gives you a random URL like `sagacity-effect-xyz.netlify.app`
4. After buying `sagacityeffect.com`:
   - In Netlify: **Site settings → Domain management → Add custom domain**
   - Enter `sagacityeffect.com`
   - Netlify shows DNS records to add at your registrar (Cloudflare Registrar):
     - `A` record: `@` → `75.2.60.5`
     - `CNAME` record: `www` → `<your-site>.netlify.app`
   - Add those at Cloudflare → site is live within minutes
   - Netlify auto-issues free SSL

### Option B — Carrd Pro ($49/yr, polished UX for non-tech edits)

If you want to edit content yourself later without touching code:
1. Buy Carrd Pro ($49/yr) at https://pro.carrd.co
2. Recreate the 5 pages in Carrd's editor using the same content
3. Point domain

We recommend Option A. Carrd is nice but adds a dependency.

### Option C — GitHub Pages (free, requires GitHub account)

1. Push `website/` to a GitHub repo
2. Settings → Pages → Deploy from branch `main`
3. Free hosting on `username.github.io/repo-name`
4. Custom domain in Pages settings

## Email setup

After domain is registered, set up `vendors@sagacityeffect.com` etc:

1. **Google Workspace** ($7/user/mo) — full Gmail + Calendar + Drive
2. **Forward-only** (free) — set up email forwarders at Cloudflare Registrar

Forward-only is fine for the first 90 days. Upgrade to Google Workspace when contracts start arriving.

## After launch checklist

- [ ] Submit site URL to Google Search Console
- [ ] Add Google Analytics (optional)
- [ ] Set up `vendors@sagacityeffect.com` email forwarding
- [ ] Update SAM.gov profile with website URL
- [ ] Add to LinkedIn company page

## Customization

- **Logo:** currently text-only. Add an SVG `<img>` tag in the `.brand` element in each header.
- **Colors:** edit `:root` CSS variables at the top of `styles.css`.
- **Content:** edit HTML directly. No framework, no build step.

## Browser support

Tested layout:
- Chrome, Edge, Firefox, Safari (current versions)
- iOS Safari 14+
- Android Chrome 90+

## License

Internal use only — Sagacity Effect LLC, 2026.