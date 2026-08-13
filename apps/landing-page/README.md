# Invest4Fun landing page

This workspace contains the public website for `invest4.fun`. It is intentionally
separate from the authenticated React application at `app.invest4.fun`.

## Editing guide

- Edit page copy, links, metadata and product examples in `index.html`.
- Edit layout, colors and responsive behavior in `src/styles.css`.
- Edit the card stack and currency demo behavior in `src/main.ts`.
- Put local images and icons in `public/assets`.

Run the site from the repository root:

```bash
npm run dev:landing-page
```

The local URL is `http://localhost:4321`. Build the production bundle with
`npm run build -w @invest4fun/landing-page`.
