# justthetipp.com

Terminal-style portfolio and blog. Plain HTML/CSS/JS source; a small Node build runs in GitHub Actions on every push to `terminal` and deploys `_site/` to GitHub Pages.

## Edit your profile

All resume/terminal facts live in `data/profile.json`. Edit it (on github.com or locally), push to `terminal`, and the site redeploys in ~2 minutes. If the file is invalid, the deploy fails and the live site is left untouched — check the Actions tab for the error.

## Write a blog post

1. Create a fine-grained token at https://github.com/settings/personal-access-tokens/new — **Repository access:** only `solarsnake/solarsnake.github.io`; **Permissions → Contents:** Read and write.
2. Open https://justthetipp.com/admin/, paste the token (kept in this browser tab only).
3. Write in Markdown, pick a section (**Tech & AI** or **Learning to Count Sheep**), save. The post is live at `/blog/<slug>/` in ~2 minutes.

## Local preview

```bash
npm ci
npm test
npm run build
npx serve _site   # or: python3 -m http.server -d _site
```

## Layout

- `data/profile.json`: profile facts (resume, terminal, mobile landing)
- `posts/index.json`: all posts, including drafts. Drafts are never deployed.
- `scripts/build.mjs`: validates both files, prerenders the resume, generates post pages, `feed.xml` and `sitemap.xml`
- `assets/js/`: small shared browser helpers, unit-tested in `test/`
