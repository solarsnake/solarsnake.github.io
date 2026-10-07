# justthetipp.com Refresh — Design Spec

**Date:** 2026-10-07
**Status:** Draft, awaiting owner review
**Source of truth for resume facts:** `~/Downloads/tippens_resume.pdf` (2-page PDF, ServiceNow 2025–present)

## 1. Goals

The site serves two equal purposes: a credible professional landing page (resume + AI work) and a blog.

1. **Accuracy.** Every fact about Timothy lives in one file and matches the current resume. No skills he hasn't used.
2. **AI-forward, honestly.** Position him as a cloud/DevOps engineer who builds AI-augmented operations tooling. Do not claim MLOps work he hasn't done.
3. **Blog as a real publication.** Each post gets its own URL with share previews, the site has an RSS feed, and new tech/AI writing is kept apart from the 2013–2016 personal essays.
4. **Owner never writes markup.** Posting stays in `/admin/`, and profile edits are a single JSON file.

### Non-goals

- Changing the terminal aesthetic or design system (Menlo, green-on-black, existing CSS tokens).
- Replacing the `/admin/` authentication model (GitHub PAT in sessionStorage).
- Adding analytics, comments, or a new homepage. The terminal stays the desktop homepage, and the mobile landing stays the mobile homepage.

## 2. Architecture

```
data/profile.json ──┐                     ┌─> _site/resume.html       (content prerendered)
posts/index.json ───┼─> scripts/build.mjs ┼─> _site/blog/<slug>/index.html (+OG tags)
                    │   (GitHub Actions)  ├─> _site/feed.xml, _site/sitemap.xml
/admin/ commits ────┘                     ├─> _site/data/build.json  (recent commits)
                                          └─> _site/** (static files copied as-is)
```

- The source files stay plain HTML/CSS/JS. The build runs only in CI (and locally on demand).
- The workflow runs `npm ci && npm test && npm run build`, then uploads `_site/` instead of `.`.
- `_site/`, `node_modules/` are gitignored. Generated output is never committed.
- **Copied to `_site/`:** `index.html`, `resume.html`, `contact.html`, `404.html`, `robots.txt`, `CNAME` (if present), `blog/index.html`, `admin/`, `posts/`, `data/`, and any asset directories.
- **Not copied:** `docs/`, `scripts/`, `test/`, `node_modules/`, `package*.json`, `.github/`, dotfiles. The copy list is an explicit allowlist in `build.mjs`.
- The static `sitemap.xml` in the repo is deleted; the build generates it.

## 3. Data model

### 3.1 `data/profile.json` (new)

```jsonc
{
  "name": "Timothy M. Tippens",
  "location": "San Diego, CA",
  "headline": "Cloud & DevOps Engineer — AI-augmented infrastructure",
  "summary": "…",                       // rewritten from PDF Qualifications; "16+ years"
  "years": "16+",
  "background": "Public Trust (SF-85P) at NASA JPL, 2017–2025 · Current DoD CAC holder",
  "contact": {
    "email": "solarsnake88@proton.me",
    "github": "https://github.com/solarsnake",
    "linkedin": "https://linkedin.com/in/timothytippens"
  },
  "highlights": [ { "title": "…", "text": "…" } ],   // the 4 resume "about cards"
  "skills": { "<Category>": ["…"] },                 // ordered object; see 3.1.1
  "experience": [                                     // newest first
    { "company": "…", "location": "…", "duration": "…",
      "roles": [ { "title": "…", "duration": "…", "note": "optional italic line",
                   "summary": "optional", "details": ["…"] } ] }
  ],
  "education": { "school": "…", "degree": "…", "year": "2010", "award": "…" },
  "ai": {
    "intro": "…",
    "featured": [
      { "title": "…", "context": "ServiceNow | Open source | This site",
        "text": "…", "tags": ["…"], "link": "optional URL" }
    ]
  }
}
```

**Privacy rule:** the public profile never includes phone numbers or the Gmail address from the PDF.

#### 3.1.1 Skills content

- **Cloud:** AWS (Commercial/GovCloud), Azure, GCP, vSphere, OpenStack
- **Containers & Orchestration:** Kubernetes, EKS, ECS, Helm, Rancher, Docker/dockerd, containerd, Kustomize, ArgoCD, Flux, Istio, Linkerd
- **IaC & Config:** Terraform, CloudFormation, Ansible, Puppet, Pulumi, HashiCorp Vault
- **CI/CD:** Jenkins, GitHub Actions, GitLab CI, CircleCI, JFrog, Digital.ai, SonarQube, Coverity
- **Observability:** Prometheus, Grafana, Datadog, ELK/Elasticsearch, OpenTelemetry, Sensu, Nagios, Zabbix
- **AI Tooling:** Claude Code, Claude skills, Codex, Gemini, Jupyter
- **Languages:** Bash, Python, Go, Groovy, PowerShell, TypeScript
- **Data:** PostgreSQL, MySQL, MongoDB, DynamoDB, Redis
- **Platforms & OS:** ServiceNow, Linux (RHEL, CentOS, Fedora, Ubuntu, Debian), Windows, macOS, VMware, DNS/DHCP, Jira

**Removed (never used):** MLflow, SageMaker, Vertex AI, Pinecone, Weaviate.

#### 3.1.2 Experience content

Experience is transcribed from the PDF, with these corrections relative to the current site:

- ServiceNow (San Diego, Flex), Senior Production Services Engineer, 2025–Present, is added with all 6 PDF bullets.
- JPL ends in **2025**, not "Present".
- JPL Senior Cloud Engineer gets `note: "Public Trust (SF-85P), 2017–2025"`.
- "CSET compliance" becomes "NIST compliance".
- NBCUniversal, ZEFR and Education stay as in the PDF.

#### 3.1.3 AI featured items (draft copy, owner to review)

1. **Agentic ops tooling** (ServiceNow): Builds Claude skills and supporting tooling that turn multi-step operational runbooks into agent-driven workflows. They cover certificate rotation, platform migrations, ticket triage, infrastructure deployments, and database maintenance across a 100k+ server fleet. Tags: Claude Code, Claude skills, automation.
2. **AI platform support** (ServiceNow): Tier-4 specialist support for ServiceNow's AI offerings in production customer environments. Tags: AI platforms, production support.
3. **kube-yaml-scrub** (Open source): Scrubs Kubernetes manifests of secrets and identifying data so they can be shared safely with public LLMs during diagnostics. Link: `https://github.com/solarsnake/kube-yaml-scrub`. Tags: Kubernetes, LLM safety.
4. **This site** (Meta): Built and maintained with Claude Code using a multi-agent workflow: a planner, scoped implementers, and an independent verifier. Link: `https://github.com/solarsnake/solarsnake.github.io`. Tags: Claude Code, agents.

AI items describe outcomes only and never ServiceNow internals.

### 3.2 `posts/index.json` (changed)

- New required field `section`, either `"tech"` or `"sheep"`.
- All 16 existing posts are migrated to `"sheep"`. Admin defaults new posts to `"tech"`.
- Other fields stay as they are: `slug`, `title`, `date` (YYYY-MM-DD), `excerpt`, `tags[]`, `content` (Markdown), `published`.

### 3.3 Validation rules (enforced by build; mirrored in admin)

**Profile:**
- `name`, `headline`, `contact.email`, `experience` (non-empty), and `skills` (non-empty) are required.
- Every `ai.featured[].link`, if present, starts with `https://`.

**Posts:**
- `slug` matches `^[a-z0-9]+(-[a-z0-9]+)*$` and is unique across all posts, drafts included.
- `title` is non-empty, and `date` is a valid YYYY-MM-DD.
- `section` ∈ {tech, sheep}, `tags` is an array of strings, and `published` is a boolean.

Any violation fails the build with a message naming the post slug (or the profile path) and the rule broken.

## 4. Pages

### 4.1 Shared navigation

The nav on `resume.html`, `contact.html`, `blog/index.html`, generated post pages, and `404.html` is `~/terminal · ~/resume · ~/ai · ~/blog · ~/contact`. `~/ai` points to `/resume.html#ai`. All nav links use root-relative paths (`/resume.html`) so they work from any depth.

### 4.2 `resume.html`

- The build replaces marker blocks (`<!-- build:about -->…<!-- /build -->` and so on) with HTML generated from `profile.json`. There are blocks for about, background, AI, skills, experience, and education.
- **New `// ai` section** (`id="ai"`), placed after About: the intro plus featured items rendered as cards with context label, text, tags, and an optional link.
- Client JS only adds behavior (skill filter, role expand/collapse) on top of the prerendered DOM.
- **Bug fix:** the skill filter escapes regex metacharacters, so "Digital.ai" matches only literally.
- The print stylesheet still expands all roles. The AI section prints too.

### 4.3 `index.html` (terminal + mobile landing)

- At init it fetches `/data/profile.json` and `/data/build.json`. If a fetch fails, commands that need the data print `profile unavailable — see /resume.html` instead of throwing.
- `about`, `skills`, `neofetch`, `social`, and the `about.txt`/`resume.md`/`contact.txt` virtual files are generated from the profile.
- **New `ai` command:** prints the AI intro and featured items, with links.
- **New `posts` command:** fetches `/posts/index.json` and lists the 3 latest published `tech` posts (falling back to any section if none are tech), each with a link to `/blog/<slug>/`.
- Both new commands go into `help`, `man`, and tab completion.
- The welcome banner adds a clickable shortcut row: `resume · ai · blog · contact`.
- `git log` prints the last 5 commits from `data/build.json` (short sha + subject). If the file is missing, it prints `git log: history unavailable`.
- **Mobile landing:**
  - The credits line shows "ServiceNow · NASA JPL · NBCUniversal".
  - The stack tags come from `profile.featuredSkills`.
  - A new `~/ai` nav card is added, plus a "// latest" list of the 3 newest tech posts.
- The Tailwind CDN script is removed, and its two body classes are replaced with existing CSS.
- OG descriptions on all pages are updated from "10+ years" to "16+ years" and the new headline.

## 5. Blog

### 5.1 Listing (`blog/index.html`)

- Header: "Writing" with subtitle.
- An optional `?tag=` preselects that tag filter.
- Two tabs, persisted in `?section=` so the URL can be shared:
  - **Tech & AI** (default)
  - **Learning to Count Sheep** (subtitle: "Personal essays, 2013–2016")
- Search and tag filters apply within the active tab, and only tags present in that tab are shown.
- Cards link to `/blog/<slug>/`. Inline expansion is removed.
- Data comes from same-origin `/posts/index.json`. The `raw.githubusercontent.com` fetch is removed.
- If the URL has `#<slug>` matching a post, it redirects with `location.replace('/blog/<slug>/')`.
- Empty Tech & AI tab: show "first post coming soon — meanwhile, browse the archive" with a link to the sheep tab.
- Tags are HTML-escaped (bug fix).

### 5.2 Post page (`/blog/<slug>/index.html`, generated)

- Same nav and CSS tokens as the listing. Styles are inlined or shared via `/blog/post.css`, copied by the build.
- Content:
  - title, formatted date, section label, tags (each links to `/blog/?section=<s>&tag=<t>`)
  - body rendered with `marked` at build time
  - prev/next within the same section
  - "← all posts" link
- Head:
  - `<title>`
  - `meta description` = excerpt
  - `link rel=canonical` = `https://justthetipp.com/blog/<slug>/`
  - `og:type=article`, `og:title`, `og:description`, `og:url`, `article:published_time`
  - `twitter:card=summary`
  - RSS `<link rel=alternate>`
- All metadata fields are HTML-escaped. The Markdown body may contain raw HTML because the owner is the only author.
- Drafts (`published: false`) produce no page and appear in no feed or listing.

### 5.3 Feeds

- `feed.xml`: RSS 2.0 of published `tech` posts, newest first, full content in `<content:encoded>` (CDATA), with absolute links.
- `sitemap.xml`: `/`, `/resume.html`, `/blog/`, `/contact.html`, plus every published post URL with `<lastmod>` = post date.
- `robots.txt` stays as it is (it already points at the sitemap and disallows `/admin/`).

### 5.4 Admin (`admin/index.html`)

- Adds a **Section** select (tech | sheep), which defaults to tech for new posts and shows the saved value when editing.
- Applies the validation rules from 3.3 before committing. Each violation is shown as a toast, and nothing is committed.
- Success toast: "Saved. Live at /blog/<slug>/ in ~2 min." Post list rows for published posts get a **view** link to the post URL.
- Post list rows show the section next to the date.
- CSP, PAT handling, and the GitHub Contents API flow are unchanged.

## 6. Build and deploy

### 6.1 `scripts/build.mjs`

- Node 22 LTS, ESM. (Node 20 reached end-of-life in April 2026.) Its only runtime dependency is `marked`, pinned exactly in `package.json` and locked in `package-lock.json`.
- Steps, in order:
  1. Load and validate both JSON files.
  2. Clean `_site/`.
  3. Copy the allowlist.
  4. Prerender `resume.html`.
  5. Generate post pages, `feed.xml`, `sitemap.xml`, and `data/build.json`.
- **Recent commits** come from `git log -5 --format=%h%x09%s`. The workflow checkout uses `fetch-depth: 10`. If git fails, `data/build.json` gets `{"commits": []}`.
- **Pure functions** (validate, escapeHtml, renderPostPage, renderFeed, renderSitemap, renderResumeBlocks) are exported for tests. The CLI entry calls them.
- Exits non-zero, with clear messages, on any validation or I/O error.

### 6.2 Workflow (`.github/workflows/terminal.yml`)

- Add `actions/setup-node@v4` (node 22, npm cache).
- Run `npm ci`, `npm test`, then `npm run build`.
- `upload-pages-artifact` path changes to `_site`.
- The trigger (push to `terminal` plus manual dispatch) is unchanged.
- **Failure behaviour:** a failing test or build stops the job before upload, so the live site keeps its previous version and GitHub notifies the owner.

### 6.3 Local workflow

- `npm run build` writes `_site/`, then `npx serve _site` (or `python3 -m http.server -d _site`) to preview.
- A short `README.md` section documents this and the admin posting flow, including fine-grained PAT setup: repository-scoped to `solarsnake.github.io`, Contents: Read & write.

## 7. Testing

- `npm test` runs `node --test test/` and covers:
  - **Validation:** each rule rejects a bad fixture and accepts the real data files.
  - **Escaping:** a title containing `<script>` is escaped in the post page, listing metadata, and feed.
  - **Post pages:** one page per published post, none for drafts, and the canonical URL plus OG tags are present and correct.
  - **Feed:** parses as XML, includes only published tech posts, and has absolute links.
  - **Sitemap:** includes every published post.
  - **Resume prerender:** ServiceNow appears, no "Present" on JPL, the AI section is present, and no phone numbers or Gmail appear anywhere in `_site/`.
  - **Allowlist:** `_site/` contains no `docs/`, `scripts/`, `node_modules/`, or `package.json`.
- **Manual/browser check at the end:**
  - terminal `about`, `skills`, `ai`, `posts`, `git log`
  - mobile landing at 390px width
  - resume skill filter with "Digital.ai"
  - blog tabs and an old `#slug` redirect
  - one post page's head tags
  - admin section dropdown (without committing)

## 8. Rollout

- Work happens on a feature branch off `terminal`. The owner reviews, then the branch is merged to `terminal`, which deploys.
- If the first CI deploy fails, the live site is untouched. Fix forward, or revert the merge.
- After deploy, check a post URL in LinkedIn's Post Inspector to confirm previews.
