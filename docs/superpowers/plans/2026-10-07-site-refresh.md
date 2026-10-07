# justthetipp.com Refresh Implementation Plan

> **For agentic workers:** Execution method chosen by owner: **tim-team** (`/tim-team:delegate`). Each task below is one implementer brief. Its **VERIFY** line is the gate command. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site accurate (one profile data file), AI-forward, and give the blog real per-post pages, RSS, and sections. Owner workflow stays the same: edit JSON or use `/admin/`.

**Architecture:** Source stays hand-written static HTML. `scripts/build.mjs` runs in GitHub Actions and does four things:
- validates `data/profile.json` and `posts/index.json`
- prerenders `resume.html`
- generates `/blog/<slug>/` pages, `feed.xml`, `sitemap.xml`, `data/build.json`
- copies an allowlist into `_site/`, which is what gets deployed

Browser-side logic that needs tests lives in small UMD files under `assets/js/`. Node tests `require()` them, and pages load them with `<script src>`.

**Tech Stack:** Node 22 (ESM), `marked` (only runtime dep), `fast-xml-parser` (dev-only, tests), `node:test`, jQuery Terminal 2.44.1 (unchanged), GitHub Pages via Actions.

**Spec:** `docs/superpowers/specs/2026-10-07-site-refresh-design.md`

## Global Constraints

- **Repo and branch:** `/Users/tippens/solarcode/solarsnake.github.io`. All work happens on branch `site-refresh`, cut from `terminal`. Never push and never commit to `terminal`.
- **No build step for the owner:** source HTML stays plain. Generated files go only to `_site/` (already gitignored) and are never committed.
- **Node and deps:** Node 22 in CI. Runtime dependency is `marked` only. Dev dependency is `fast-xml-parser` only. Versions pinned exactly (`--save-exact`).
- **Privacy:** `919.491.5120`, `424.253.4307` and `timothy.tippens@gmail.com` must never appear in any file under `_site/` or `data/`.
- **Public contact:** `solarsnake88@proton.me`, `https://github.com/solarsnake`, `https://linkedin.com/in/timothytippens`.
- **Never list these skills:** MLflow, SageMaker, Vertex AI, Pinecone, Weaviate.
- **Clearance wording:** Public Trust is past tense (2017–2025). The DoD CAC is "Current DoD CAC holder" and is never called a clearance.
- **ServiceNow confidentiality:** AI copy describes outcomes only. No internal names or systems.
- **Design system:** Menlo/Monaco/Consolas stack, existing CSS tokens (`--green #00ff00`, `--cyan #00ffcc`, `--bg #000`, `--border #1a3a1a`, `--text #00cc00`, `--text-dim #008800`). No new fonts or frameworks.
- **Shared nav** on every non-terminal page, in this order: `~/terminal` → `/`, `~/resume` → `/resume.html`, `~/ai` → `/resume.html#ai`, `~/blog` → `/blog/`, `~/contact` → `/contact.html`. Links are root-relative.
- **Post sections:** `section` ∈ {`tech`, `sheep`}. Labels are `tech` = "Tech & AI" and `sheep` = "Learning to Count Sheep".
- **Escaping:** every post or profile field interpolated into HTML or XML goes through `escapeHtml`. Post Markdown bodies may contain raw HTML (single trusted author).
- **Site URL constant:** `https://justthetipp.com`.

## Review Focus

1. **A post title, excerpt or tag containing `<`, `&` or `"`.** It must render as literal text in the post page `<title>`, OG attributes, listing cards and RSS. It must never break markup or inject script. Pinned in Task 3 (`renderPostPage`/`renderFeed` escaping tests) and Task 7 (DOM `textContent` rendering).
2. **A draft post (`published: false`).** It must never be publicly reachable: no page, not in the feed or sitemap, and stripped from the deployed `_site/posts/index.json`. Pinned in Task 3 and Task 5 (build integration test).
3. **A post body containing `]]>`.** For example, a code sample about CDATA. `feed.xml` must stay well-formed XML. Pinned in Task 3.
4. **Skill names with regex metacharacters** (`Digital.ai`, `C++`), or a prefix of another word (`Docker` vs `Dockerd`). The resume filter must match literally on word-ish boundaries. Pinned in Task 4 (`skill-match` tests).
5. **`/data/profile.json`, `/data/build.json` or `/posts/index.json` fails to load** (offline or 404). Terminal commands print a friendly message instead of throwing. Pinned in Task 6 (`ProfileText.gitLogLines(null)`, `latestPosts(null)`).

---

## File Map

| Path | Status | Responsibility |
|---|---|---|
| `data/profile.json` | create | Single source of truth for all profile facts |
| `posts/index.json` | modify | Add `section` to every post |
| `package.json`, `package-lock.json` | create | Deps + `build` / `test` / `check:js` scripts |
| `.gitignore` | modify | Add `node_modules/` |
| `assets/js/post-rules.js` | create | UMD: post validation rules + section labels (used by build **and** admin) |
| `assets/js/skill-match.js` | create | UMD: literal skill matching + highlight splitting (resume page) |
| `assets/js/profile-text.js` | create | UMD: terminal text from profile/posts/build data |
| `assets/js/blog-filter.js` | create | UMD: blog listing filtering, params, hash redirect |
| `scripts/lib/util.mjs` | create | `SITE_URL`, `escapeHtml`, `formatDate`, `rfc822` |
| `scripts/lib/validate.mjs` | create | `validateProfile`, re-exports `validatePosts` |
| `scripts/lib/posts.mjs` | create | Post page, feed, sitemap renderers |
| `scripts/lib/resume.mjs` | create | Resume block renderers + marker injection |
| `scripts/build.mjs` | create | CLI: validate → copy allowlist → generate into `_site/` |
| `scripts/check-inline-js.mjs` | create | Syntax-check inline `<script>` blocks in HTML files |
| `blog/post.css` | create | Styles for generated post pages |
| `test/*.test.mjs` | create | `node:test` suites |
| `resume.html` | modify | Build markers, AI section, nav, behavior-only JS |
| `index.html` | modify | Profile-driven terminal, `ai`/`posts` commands, real `git log`, mobile landing, drop Tailwind |
| `blog/index.html` | modify | Tabs, link cards, same-origin data, hash redirect |
| `admin/index.html` | modify | Section field, shared validation, view links |
| `contact.html`, `404.html` | modify | Shared nav + copy |
| `.github/workflows/terminal.yml` | modify | Node setup, test, build, upload `_site` |
| `sitemap.xml` | delete | Now generated |
| `README.md` | modify | Local preview + posting docs |

---

### Task 0: Branch setup (orchestrator does this, not an implementer)

- [ ] **Step 1:** `git checkout -b site-refresh` (from `terminal`, clean tree aside from `docs/`).
- [ ] **Step 2:** `git add docs/superpowers && git commit -m "docs: site refresh spec and plan"`.

---

### Task 1: Profile data file + post sections

**Files:**
- Create: `data/profile.json`
- Modify: `posts/index.json` (add `"section": "sheep"` to all 16 posts)

**Interfaces:**
- Produces: `data/profile.json` with the exact shape below. Later tasks read these keys: `name`, `location`, `headline`, `tagline`, `years`, `summary`, `background`, `contact.{email,github,linkedin}`, `featuredSkills[]`, `highlights[].{title,text}`, `skills{category: string[]}`, `experience[].{company,location,duration,roles[].{title,duration,note?,summary?,details[]}}`, `education.{school,degree,year,award}`, `ai.{intro,featured[].{title,context,text,tags[],link?}}`.

- [ ] **Step 1: Create `data/profile.json` with exactly this content**

```json
{
  "name": "Timothy M. Tippens",
  "location": "San Diego, CA",
  "headline": "Cloud & DevOps Engineer — AI-augmented infrastructure",
  "tagline": "Cloud Native · Kubernetes · Terraform · Python · AI Agents",
  "years": "16+",
  "summary": "Cloud and DevOps engineer with 16+ years of experience building and running infrastructure for mission-critical environments — from NASA JPL flight software pipelines to ServiceNow's global cloud platform. I design highly available, self-healing, cost-optimized systems across AWS, Azure and GCP with Kubernetes, Terraform, Ansible and Python, and I build AI agent tooling that takes the toil out of operations.",
  "background": "Public Trust (SF-85P) at NASA JPL, 2017–2025 · Current DoD CAC holder",
  "contact": {
    "email": "solarsnake88@proton.me",
    "github": "https://github.com/solarsnake",
    "linkedin": "https://linkedin.com/in/timothytippens"
  },
  "featuredSkills": ["AWS", "Kubernetes", "Terraform", "Python", "Claude Code", "Azure", "GCP", "Ansible", "Go"],
  "highlights": [
    { "title": "Multi-Cloud at Scale", "text": "AWS (Commercial & GovCloud), Azure and GCP — securing and automating platforms spanning 100k+ servers." },
    { "title": "Infrastructure as Code", "text": "Terraform, CloudFormation, Ansible and Puppet — repeatable, compliant infrastructure with self-healing automation." },
    { "title": "AI-Augmented Operations", "text": "Claude skills and agent tooling that turn operational runbooks into automated, reviewable workflows." },
    { "title": "Mission-Critical Track Record", "text": "ServiceNow, NASA JPL (Europa Clipper), NBCUniversal and ZEFR — award-winning work across government and industry." }
  ],
  "skills": {
    "Cloud": ["AWS", "AWS GovCloud", "Azure", "GCP", "vSphere", "OpenStack"],
    "Containers & Orchestration": ["Kubernetes", "EKS", "ECS", "Helm", "Rancher", "Docker", "containerd", "Kustomize", "ArgoCD", "Flux", "Istio", "Linkerd"],
    "IaC & Config": ["Terraform", "CloudFormation", "Ansible", "Puppet", "Pulumi", "Vault"],
    "CI/CD": ["Jenkins", "GitHub Actions", "GitLab CI", "CircleCI", "JFrog", "Digital.ai", "SonarQube", "Coverity"],
    "Observability": ["Prometheus", "Grafana", "Datadog", "Elasticsearch", "OpenTelemetry", "Sensu", "Nagios", "Zabbix"],
    "AI Tooling": ["Claude Code", "Claude skills", "Codex", "Gemini", "Jupyter"],
    "Languages": ["Bash", "Python", "Go", "Groovy", "PowerShell", "TypeScript"],
    "Data": ["PostgreSQL", "MySQL", "MongoDB", "DynamoDB", "Redis"],
    "Platforms & OS": ["ServiceNow", "Linux", "Red Hat", "CentOS", "Fedora", "Ubuntu", "Debian", "Windows", "macOS", "VMware", "DNS/DHCP", "Jira"]
  },
  "experience": [
    {
      "company": "ServiceNow",
      "location": "San Diego, CA (Flex)",
      "duration": "2025 – Present",
      "roles": [
        {
          "title": "Senior Production Services Engineer",
          "duration": "2025 – Present",
          "summary": "Securing, automating and maintaining the backbone infrastructure that powers the ServiceNow cloud services platform.",
          "details": [
            "Developing automated solutions — including Claude skills and related tooling — for platform migrations, cert management, ticket management, system administration, infrastructure deployments and database management",
            "Provide Tier 4 customer support for platform deployments across hundreds of commercial industry clients",
            "Specialized support for ServiceNow's AI offerings",
            "Developing containerized services in the ServiceNow platform to migrate architecture to Kubernetes",
            "Secured platform environments for 100k+ servers across the ServiceNow cloud, Azure, GCP and AWS",
            "Maintain platform stability by providing P1 on-call coverage for infrastructure incidents"
          ]
        }
      ]
    },
    {
      "company": "NASA's Jet Propulsion Laboratory",
      "location": "Pasadena, CA (Remote)",
      "duration": "2017 – 2025",
      "roles": [
        {
          "title": "Senior Cloud Engineer",
          "duration": "2022 – 2025",
          "note": "Public Trust (SF-85P), 2017–2025",
          "summary": "Designed and integrated DevOps solutions for deploying, securing and testing mission-critical flight software, cloud infrastructure automation and COTS tooling.",
          "details": [
            "Operationalized flight software testing and deployment for Europa Clipper in the cloud",
            "Migrated 10+ COTS and internally developed applications from monolithic architecture to scalable EKS deployments",
            "Containerized hardware virtualization tooling for flight missions, enabling efficient, scalable simulation pipelines",
            "Awarded for individual contribution to cloud optimization through innovative software testing and architecture",
            "Developed and automated AWS infrastructure deployment and system maintenance using Ansible, Python and CloudFormation, achieving 30% cost reduction for Computer Aided Engineering cloud environments",
            "Architected and implemented automated patching and OS pipeline deployment for multi-AZ environments utilizing Ansible, CloudFormation and AWS Systems Manager, ensuring NIST compliance"
          ]
        },
        {
          "title": "System Architect",
          "duration": "2017 – 2022",
          "summary": "Led the design, implementation and maintenance of critical cloud-based IT infrastructure for NASA space and low Earth orbit (LEO) missions, ensuring high availability and performance.",
          "details": [
            "Implemented CI/CD pipeline for Computer Aided Engineering software suite deployment and testing",
            "Redesigned Desktop Engineering platform for Windows and Linux environments for high-availability/autoscaling",
            "Supported deployment, maintenance and security for 25+ unique applications serving 1600+ customers",
            "Interfaced with and guided customers on new technologies from interns through senior management",
            "Developed and released Puppet infrastructure for cloud orchestration and compliance",
            "Developed Elasticsearch-backed research application for detailed data analysis",
            "Automated application test suites for use across the lab, providing detailed documentation",
            "Engineered and deployed a Kubernetes-based CI solution for projects utilizing Jenkins and Jupyter Notebooks in AWS GovCloud"
          ]
        }
      ]
    },
    {
      "company": "NBCUniversal",
      "location": "Los Angeles, CA",
      "duration": "2014 – 2017",
      "roles": [
        {
          "title": "Linux Systems Administrator",
          "duration": "2015 – 2017",
          "summary": "Systems administration, integration and implementation across AWS, MSSQL, VMware, Docker, NetApp, macOS, Windows and Active Directory.",
          "details": [
            "Achieved $80k in license savings by migrating to a more cost-effective cloud backup solution",
            "Built bare-metal high-availability (HA) environment for corporate and production environments",
            "Administered and automated AWS infrastructure using Puppet, Terraform and the AWS CLI",
            "Developed Oracle/Solaris-backed Data Warehouse platform for Business Intelligence",
            "Implemented and evaluated open-source monitoring tools (Sensu, Nagios, Zabbix) for all environments",
            "Centralized change management using Bitbucket",
            "Built Quantum StorNext solution (CentOS-backed) for internal Production team",
            "Developed runbooks for the Network Operations Center (NOC), standardizing web development workflows"
          ]
        },
        {
          "title": "Software Engineer",
          "duration": "2014 – 2015",
          "summary": "Managed the Movieclips.com tech stack and NetApp storage administration with Terraform, Python, Redis, PostgreSQL and Ceph.",
          "details": [
            "Managed and optimized a high-volume publishing pipeline processing 500+ videos for web/YouTube",
            "Performed Python debugging and SQL scripting to increase production pipeline productivity",
            "Created an efficient workflow by bridging the gap between the tech and content sides of the company",
            "Managed relationships with multiple Hollywood studios"
          ]
        }
      ]
    },
    {
      "company": "ZEFR",
      "location": "Venice, CA",
      "duration": "2012 – 2014",
      "roles": [
        {
          "title": "IT Operations",
          "duration": "2012 – 2014",
          "summary": "Promoted to assist the IT Manager with developing DevOps processes and supporting offices in New York, Boston, Chicago, London and India.",
          "details": [
            "Won the Award of Excellence in 2014",
            "Saved $20k+ per year in AWS costs by building an on-premises virtualization cluster (OpenStack)",
            "Completed Linux server architecture and maintenance; conducted macOS and Windows administration",
            "Provided daily tech support to employees and executives, including PandoDaily fireside chats and TED talks"
          ]
        }
      ]
    }
  ],
  "education": {
    "school": "University of North Carolina at Chapel Hill",
    "degree": "BA in Communications · Minor in Creative Writing",
    "year": "2010",
    "award": "Outstanding Achievement in Scholarship & Rick Dees Production Fund Scholarship"
  },
  "ai": {
    "intro": "I use AI agents the way I use Terraform: to make operations repeatable, reviewable and fast. My AI work lives where infrastructure meets LLMs — agent skills that execute runbooks, guardrails that keep sensitive data out of prompts, and keeping AI platforms healthy for customers.",
    "featured": [
      {
        "title": "Agentic ops tooling",
        "context": "ServiceNow",
        "text": "Building Claude skills and supporting tooling that turn multi-step operational runbooks into agent-driven workflows — certificate rotation, platform migrations, ticket triage, infrastructure deployments and database maintenance across a 100k+ server fleet.",
        "tags": ["Claude Code", "Claude skills", "automation"]
      },
      {
        "title": "AI platform support",
        "context": "ServiceNow",
        "text": "Tier 4 specialist support for ServiceNow's AI offerings in production customer environments.",
        "tags": ["AI platforms", "production support"]
      },
      {
        "title": "kube-yaml-scrub",
        "context": "Open source",
        "text": "Scrubs Kubernetes manifests of secrets and identifying data so they can be shared safely with public LLMs during diagnostics.",
        "tags": ["Kubernetes", "LLM safety"],
        "link": "https://github.com/solarsnake/kube-yaml-scrub"
      },
      {
        "title": "This site",
        "context": "Meta",
        "text": "Built and maintained with Claude Code using a multi-agent workflow — a planner, tightly scoped implementers and an independent verifier.",
        "tags": ["Claude Code", "agents"],
        "link": "https://github.com/solarsnake/solarsnake.github.io"
      }
    ]
  }
}
```

- [ ] **Step 2: Add `section: "sheep"` to every post** (preserves order and other fields; 2-space indent like the original)

Run:
```bash
node -e '
const fs=require("fs");const f="posts/index.json";
const d=JSON.parse(fs.readFileSync(f,"utf8"));
d.posts=d.posts.map(p=>({...p,section:p.section||"sheep"}));
fs.writeFileSync(f,JSON.stringify(d,null,2)+"\n");'
```

- [ ] **Step 3: Verify**

Run VERIFY (below). Expected output: `ok 16 posts`.

- [ ] **Step 4: Commit**

```bash
git add data/profile.json posts/index.json
git commit -m "data: add profile.json and post sections"
```

**VERIFY:** `node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync("data/profile.json","utf8"));const d=JSON.parse(fs.readFileSync("posts/index.json","utf8"));const raw=fs.readFileSync("data/profile.json","utf8");if(/919\.491|424\.253|gmail/i.test(raw))throw "privacy";if(/SageMaker|MLflow|Vertex|Pinecone|Weaviate/.test(raw))throw "banned skill";if(p.experience[0].company!=="ServiceNow")throw "servicenow";if(!d.posts.every(x=>x.section==="sheep"))throw "section";console.log("ok",d.posts.length,"posts")'`

---

### Task 2: Build scaffold, shared post rules, validation

**Files:**
- Create: `package.json`, `package-lock.json` (via npm), `assets/js/post-rules.js`, `scripts/lib/util.mjs`, `scripts/lib/validate.mjs`, `scripts/check-inline-js.mjs`, `test/validate.test.mjs`, `test/util.test.mjs`
- Modify: `.gitignore` (append `node_modules/`)

**Interfaces:**
- Consumes: `data/profile.json`, `posts/index.json` from Task 1.
- Produces:
  - `assets/js/post-rules.js` → in Node via `require`, in browser as `window.PostRules`: `{ SLUG_RE: RegExp, SECTIONS: string[], SECTION_LABELS: {tech:string, sheep:string}, isValidDate(s:string): boolean, validatePosts(data:{posts:object[]}): string[] }`
  - `scripts/lib/util.mjs`: `SITE_URL: string`, `escapeHtml(s:any): string`, `formatDate(iso:string): string` (e.g. `"October 7, 2026"`), `rfc822(iso:string): string`
  - `scripts/lib/validate.mjs`: `validateProfile(p:object): string[]`, `validatePosts` (re-export)
  - npm scripts: `npm test`, `npm run build`, `npm run check:js -- <files>`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "justthetipp-site",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "build": "node scripts/build.mjs",
    "test": "node --test \"test/**/*.test.mjs\"",
    "check:js": "node scripts/check-inline-js.mjs"
  }
}
```

Then run `npm install --save-exact marked` and `npm install --save-exact --save-dev fast-xml-parser`. Append `node_modules/` to `.gitignore`.

- [ ] **Step 2: Write failing tests `test/util.test.mjs`**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, formatDate, rfc822, SITE_URL } from '../scripts/lib/util.mjs';

test('escapeHtml escapes all five characters and stringifies', () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(42), '42');
});

test('formatDate renders long US date without timezone drift', () => {
  assert.equal(formatDate('2026-10-07'), 'October 7, 2026');
  assert.equal(formatDate('2013-01-01'), 'January 1, 2013');
});

test('rfc822 produces a UTC date string', () => {
  assert.equal(rfc822('2026-10-07'), 'Wed, 07 Oct 2026 12:00:00 GMT');
});

test('SITE_URL has no trailing slash', () => {
  assert.equal(SITE_URL, 'https://justthetipp.com');
});
```

- [ ] **Step 3: Write failing tests `test/validate.test.mjs`**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateProfile, validatePosts } from '../scripts/lib/validate.mjs';

const profile = JSON.parse(readFileSync(new URL('../data/profile.json', import.meta.url)));
const posts = JSON.parse(readFileSync(new URL('../posts/index.json', import.meta.url)));
const good = { slug: 'ok-post', title: 'OK', date: '2026-10-07', excerpt: '', tags: [], content: 'x', published: true, section: 'tech' };

test('real data files are valid', () => {
  assert.deepEqual(validateProfile(profile), []);
  assert.deepEqual(validatePosts(posts), []);
});

test('profile: missing name, empty experience, bad link', () => {
  const p = structuredClone(profile);
  delete p.name; p.experience = []; p.ai.featured[0].link = 'http://insecure.example';
  const errs = validateProfile(p).join('\n');
  assert.match(errs, /name/);
  assert.match(errs, /experience/);
  assert.match(errs, /https:\/\//);
});

test('posts: top-level shape', () => {
  assert.match(validatePosts({}).join(), /posts/);
});

test('posts: each rule rejects and names the slug', () => {
  const cases = [
    [{ slug: 'Bad Slug' }, /slug/],
    [{ title: '  ' }, /title/],
    [{ date: '2026-02-30' }, /date/],
    [{ date: '10/07/2026' }, /date/],
    [{ section: 'blog' }, /section/],
    [{ published: 'yes' }, /published/],
    [{ tags: 'ai' }, /tags/],
    [{ tags: ['ok', 3] }, /tags/],
    [{ content: undefined }, /content/],
    [{ excerpt: 5 }, /excerpt/],
  ];
  for (const [patch, re] of cases) {
    const errs = validatePosts({ posts: [{ ...good, ...patch }] });
    assert.equal(errs.length, 1, `expected 1 error for ${JSON.stringify(patch)}, got ${errs}`);
    assert.match(errs[0], re);
  }
});

test('posts: duplicate slug across drafts is rejected', () => {
  const errs = validatePosts({ posts: [good, { ...good, published: false }] });
  assert.equal(errs.length, 1);
  assert.match(errs[0], /duplicate slug/);
  assert.match(errs[0], /ok-post/);
});
```

- [ ] **Step 4: Run `npm test`.** Expected: FAIL, because the modules aren't found.

- [ ] **Step 5: Create `assets/js/post-rules.js`**

```js
/* Post validation rules shared by scripts/build.mjs (Node require) and admin/index.html (window.PostRules). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PostRules = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const SECTIONS = ['tech', 'sheep'];
  const SECTION_LABELS = { tech: 'Tech & AI', sheep: 'Learning to Count Sheep' };

  function isValidDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(s + 'T00:00:00Z');
    return !isNaN(d) && d.toISOString().slice(0, 10) === s;
  }

  function validatePosts(data) {
    if (!data || !Array.isArray(data.posts)) return ['posts/index.json: top-level "posts" array is required'];
    const errors = [];
    const seen = new Set();
    data.posts.forEach((p, i) => {
      p = p || {};
      const id = `post[${i}] (${typeof p.slug === 'string' ? p.slug : 'no slug'})`;
      if (typeof p.slug !== 'string' || !SLUG_RE.test(p.slug)) errors.push(`${id}: slug must be lowercase words joined by hyphens`);
      else if (seen.has(p.slug)) errors.push(`${id}: duplicate slug "${p.slug}"`);
      else seen.add(p.slug);
      if (typeof p.title !== 'string' || !p.title.trim()) errors.push(`${id}: title is required`);
      if (!isValidDate(p.date)) errors.push(`${id}: date must be a valid YYYY-MM-DD`);
      if (!SECTIONS.includes(p.section)) errors.push(`${id}: section must be one of ${SECTIONS.join(', ')}`);
      if (!Array.isArray(p.tags) || !p.tags.every(t => typeof t === 'string')) errors.push(`${id}: tags must be an array of strings`);
      if (typeof p.published !== 'boolean') errors.push(`${id}: published must be true or false`);
      if (typeof p.content !== 'string') errors.push(`${id}: content must be a string`);
      if (typeof p.excerpt !== 'string') errors.push(`${id}: excerpt must be a string`);
    });
    return errors;
  }

  return { SLUG_RE, SECTIONS, SECTION_LABELS, isValidDate, validatePosts };
});
```

- [ ] **Step 6: Create `scripts/lib/util.mjs`**

```js
export const SITE_URL = 'https://justthetipp.com';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function rfc822(iso) {
  return new Date(`${iso}T12:00:00Z`).toUTCString();
}
```

- [ ] **Step 7: Create `scripts/lib/validate.mjs`**

```js
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const { validatePosts } = require('../../assets/js/post-rules.js');

const nonEmpty = v => typeof v === 'string' && v.trim() !== '';

export function validateProfile(p) {
  if (!p || typeof p !== 'object') return ['data/profile.json: must be an object'];
  const errors = [];
  if (!nonEmpty(p.name)) errors.push('data/profile.json: name is required');
  if (!nonEmpty(p.headline)) errors.push('data/profile.json: headline is required');
  if (!nonEmpty(p.contact?.email)) errors.push('data/profile.json: contact.email is required');
  if (!Array.isArray(p.experience) || p.experience.length === 0) errors.push('data/profile.json: experience must be a non-empty array');
  if (!p.skills || typeof p.skills !== 'object' || Object.keys(p.skills).length === 0) errors.push('data/profile.json: skills must be a non-empty object');
  (p.ai?.featured || []).forEach((f, i) => {
    if (f.link !== undefined && !/^https:\/\//.test(f.link)) errors.push(`data/profile.json: ai.featured[${i}].link must start with https://`);
  });
  return errors;
}
```

- [ ] **Step 8: Create `scripts/check-inline-js.mjs`** (syntax-checks inline scripts without running them)

```js
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

let failed = false;
for (const file of process.argv.slice(2)) {
  const html = readFileSync(file, 'utf8');
  const re = /<script(?![^>]*\bsrc=)(?![^>]*type="application\/(?:ld\+)?json")[^>]*>([\s\S]*?)<\/script>/gi;
  let m; let n = 0;
  while ((m = re.exec(html))) {
    n++;
    try { new vm.Script(m[1], { filename: `${file}#script${n}` }); }
    catch (e) { failed = true; console.error(`${file} inline script ${n}: ${e.message}`); }
  }
  console.log(`${file}: ${n} inline script(s) checked`);
}
process.exit(failed ? 1 : 0);
```

- [ ] **Step 9: Run `npm test`.** Expected: all PASS. Run `npm run check:js -- index.html resume.html blog/index.html admin/index.html`. Expected: exit 0.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json .gitignore assets/js/post-rules.js scripts test
git commit -m "build: scaffold node tooling, shared post rules, validation"
```

**VERIFY:** `npm test && npm run check:js -- index.html resume.html blog/index.html admin/index.html`

---

### Task 3: Post pages, RSS feed, sitemap renderers

**Files:**
- Create: `scripts/lib/posts.mjs`, `blog/post.css`, `test/posts.test.mjs`

**Interfaces:**
- Consumes: `escapeHtml`, `formatDate`, `rfc822`, `SITE_URL` from `scripts/lib/util.mjs`. Also `SECTION_LABELS` from `assets/js/post-rules.js` (via `createRequire`).
- Produces (`scripts/lib/posts.mjs`):
  - `publishedPosts(posts: object[]): object[]` — published only, newest first (tie → slug asc)
  - `postUrl(slug: string): string` — `https://justthetipp.com/blog/<slug>/`
  - `neighbors(published: object[], post: object): { newer: object|null, older: object|null }` — same section only
  - `renderPostPage(post: object, nb: {newer, older}): string`
  - `renderFeed(published: object[]): string` — RSS 2.0, `tech` only
  - `renderSitemap(published: object[]): string`

- [ ] **Step 1: Write failing tests `test/posts.test.mjs`**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { XMLValidator } from 'fast-xml-parser';
import { publishedPosts, neighbors, renderPostPage, renderFeed, renderSitemap, postUrl } from '../scripts/lib/posts.mjs';

const fixture = [
  { slug: 'old-tech', title: 'Old Tech', date: '2026-01-01', excerpt: 'old', tags: [], content: 'old body', published: true, section: 'tech' },
  { slug: 'essay', title: 'Essay', date: '2015-01-01', excerpt: 'essay', tags: ['philosophy'], content: 'essay body', published: true, section: 'sheep' },
  { slug: 'new-tech', title: 'New <script>alert(1)</script> & "Stuff"', date: '2026-10-01', excerpt: 'He said "hi" & <b>left</b>', tags: ['ai', '<x>'], content: '# Hello\n\n<div>a ]]> b</div>\n', published: true, section: 'tech' },
  { slug: 'secret-draft', title: 'Draft', date: '2026-10-05', excerpt: 'draft', tags: [], content: 'draft body', published: false, section: 'tech' },
];
const published = publishedPosts(fixture);
const newTech = published.find(p => p.slug === 'new-tech');

test('publishedPosts drops drafts and sorts newest first', () => {
  assert.deepEqual(published.map(p => p.slug), ['new-tech', 'old-tech', 'essay']);
});

test('neighbors stay within the section', () => {
  assert.deepEqual(neighbors(published, newTech), { newer: null, older: published[1] });
  const essay = published.find(p => p.slug === 'essay');
  assert.deepEqual(neighbors(published, essay), { newer: null, older: null });
});

test('postUrl is absolute with trailing slash', () => {
  assert.equal(postUrl('a-b'), 'https://justthetipp.com/blog/a-b/');
});

test('renderPostPage escapes metadata and renders markdown', () => {
  const html = renderPostPage(newTech, neighbors(published, newTech));
  assert.ok(!html.includes('<script>alert(1)</script>'), 'raw script tag leaked');
  assert.ok(html.includes('New &lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;Stuff&quot;'));
  assert.ok(html.includes('content="He said &quot;hi&quot; &amp; &lt;b&gt;left&lt;/b&gt;"'));
  assert.ok(html.includes('#&lt;x&gt;'));
  assert.ok(html.includes('<link rel="canonical" href="https://justthetipp.com/blog/new-tech/">'));
  assert.ok(html.includes('<meta property="og:type" content="article">'));
  assert.ok(html.includes('<meta property="og:url" content="https://justthetipp.com/blog/new-tech/">'));
  assert.ok(html.includes('<meta property="article:published_time" content="2026-10-01">'));
  assert.ok(html.includes('<meta name="twitter:card" content="summary">'));
  assert.ok(html.includes('<link rel="stylesheet" href="/blog/post.css">'));
  assert.match(html, /<h1[^>]*>Hello<\/h1>/);
  assert.ok(html.includes('href="/blog/old-tech/"'), 'older link missing');
  assert.ok(html.includes('Tech &amp; AI'));
  assert.ok(html.includes('href="/resume.html#ai"'), 'shared nav missing ~/ai');
});

test('renderFeed is well-formed, tech-only, absolute links, survives ]]>', () => {
  const xml = renderFeed(published);
  assert.equal(XMLValidator.validate(xml), true);
  assert.ok(xml.includes('<link>https://justthetipp.com/blog/new-tech/</link>'));
  assert.ok(xml.includes('<link>https://justthetipp.com/blog/old-tech/</link>'));
  assert.ok(!xml.includes('/blog/essay/'));
  assert.ok(!xml.includes('secret-draft'));
  assert.ok(xml.includes('<pubDate>Thu, 01 Oct 2026 12:00:00 GMT</pubDate>'));
});

test('renderFeed with no posts is still valid', () => {
  assert.equal(XMLValidator.validate(renderFeed([])), true);
});

test('renderSitemap lists static pages and every published post', () => {
  const xml = renderSitemap(published);
  assert.equal(XMLValidator.validate(xml), true);
  for (const u of ['/', '/resume.html', '/blog/', '/contact.html']) assert.ok(xml.includes(`<loc>https://justthetipp.com${u}</loc>`));
  for (const p of published) assert.ok(xml.includes(`<loc>${postUrl(p.slug)}</loc>`));
  assert.ok(!xml.includes('secret-draft'));
});
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL (`posts.mjs` not found).

- [ ] **Step 3: Create `scripts/lib/posts.mjs`**

```js
import { createRequire } from 'node:module';
import { marked } from 'marked';
import { SITE_URL, escapeHtml, formatDate, rfc822 } from './util.mjs';

const require = createRequire(import.meta.url);
const { SECTION_LABELS } = require('../../assets/js/post-rules.js');

const NAV_LINKS = [
  ['/', '~/terminal'],
  ['/resume.html', '~/resume'],
  ['/resume.html#ai', '~/ai'],
  ['/blog/', '~/blog'],
  ['/contact.html', '~/contact'],
];

export function publishedPosts(posts) {
  return posts
    .filter(p => p.published === true)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function postUrl(slug) {
  return `${SITE_URL}/blog/${slug}/`;
}

export function neighbors(published, post) {
  const same = published.filter(p => p.section === post.section);
  const i = same.findIndex(p => p.slug === post.slug);
  return {
    newer: i > 0 ? same[i - 1] : null,
    older: i >= 0 && i < same.length - 1 ? same[i + 1] : null,
  };
}

function navHtml() {
  const links = NAV_LINKS.map(([href, label]) =>
    `<li><a href="${href}"${href === '/blog/' ? ' class="active"' : ''}>${label}</a></li>`).join('\n        ');
  return `<nav class="site-nav">
    <div class="brand">tippens@portfolio<span>:/blog</span>$</div>
    <ul class="nav-links">
        ${links}
    </ul>
</nav>`;
}

export function renderPostPage(post, { newer = null, older = null } = {}) {
  const t = escapeHtml(post.title);
  const ex = escapeHtml(post.excerpt);
  const url = postUrl(post.slug);
  const label = escapeHtml(SECTION_LABELS[post.section]);
  const section = encodeURIComponent(post.section);
  const tags = (post.tags || []).map(tag =>
    `<a class="post-tag" href="/blog/?section=${section}&amp;tag=${encodeURIComponent(tag)}">#${escapeHtml(tag)}</a>`).join(' ');
  const pager = [
    newer ? `<a class="pager-newer" href="/blog/${escapeHtml(newer.slug)}/">← ${escapeHtml(newer.title)}</a>` : '<span></span>',
    older ? `<a class="pager-older" href="/blog/${escapeHtml(older.slug)}/">${escapeHtml(older.title)} →</a>` : '<span></span>',
  ].join('\n        ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t} — tippens@portfolio</title>
    <meta name="description" content="${ex}">
    <link rel="canonical" href="${url}">
    <link rel="alternate" type="application/rss+xml" title="tippens@portfolio — Tech &amp; AI" href="/feed.xml">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${t}">
    <meta property="og:description" content="${ex}">
    <meta property="og:url" content="${url}">
    <meta property="og:site_name" content="tippens@portfolio">
    <meta property="article:published_time" content="${escapeHtml(post.date)}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${t}">
    <meta name="twitter:description" content="${ex}">
    <link rel="stylesheet" href="/blog/post.css">
</head>
<body>
${navHtml()}
<main class="post-wrap">
    <a class="back-link" href="/blog/?section=${section}">← all posts</a>
    <header class="post-header">
        <div class="post-meta">${escapeHtml(formatDate(post.date))} · <span class="section-label">${label}</span></div>
        <h1 class="post-title">${t}</h1>
        <div class="post-tags">${tags}</div>
    </header>
    <article class="md-content">
${marked.parse(post.content || '')}
    </article>
    <nav class="post-pager">
        ${pager}
    </nav>
</main>
</body>
</html>
`;
}

function cdataSafe(s) {
  return s.replace(/]]>/g, ']]]]><![CDATA[>');
}

export function renderFeed(published) {
  const items = published.filter(p => p.section === 'tech').map(p => `    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${postUrl(p.slug)}</link>
      <guid isPermaLink="true">${postUrl(p.slug)}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <description>${escapeHtml(p.excerpt)}</description>
      <content:encoded><![CDATA[${cdataSafe(marked.parse(p.content || ''))}]]></content:encoded>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>tippens@portfolio — Tech &amp; AI</title>
    <link>${SITE_URL}/blog/</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Writing on cloud infrastructure, DevOps and AI by Timothy Tippens.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>
`;
}

export function renderSitemap(published) {
  const staticUrls = ['/', '/resume.html', '/blog/', '/contact.html']
    .map(u => `  <url><loc>${SITE_URL}${u}</loc></url>`);
  const postUrls = published.map(p => `  <url><loc>${postUrl(p.slug)}</loc><lastmod>${p.date}</lastmod></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...postUrls].join('\n')}
</urlset>
`;
}
```

- [ ] **Step 4: Create `blog/post.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
    --green: #00ff00;
    --green-muted: #008800;
    --green-dark: #004400;
    --cyan: #00ffcc;
    --bg: #000000;
    --bg-card: #0d0d0d;
    --bg-nav: #0a0a0a;
    --border: #1a3a1a;
    --text: #00cc00;
    --text-dim: #008800;
    --font-mono: 'Menlo', 'Monaco', 'Consolas', 'Courier New', monospace;
}

body { font-family: var(--font-mono); background: var(--bg); color: var(--text); min-height: 100vh; line-height: 1.6; }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #000; }
::-webkit-scrollbar-thumb { background: var(--green-muted); border-radius: 3px; }

.site-nav {
    position: sticky; top: 0; z-index: 100;
    background: var(--bg-nav); border-bottom: 1px solid var(--border);
    padding: 0.75rem 1.5rem;
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
}
.site-nav .brand { color: var(--green); font-size: 0.85rem; letter-spacing: 0.05em; }
.site-nav .brand span { color: var(--text-dim); }
.nav-links { display: flex; gap: 1.25rem; list-style: none; flex-wrap: wrap; }
.nav-links a { color: var(--text-dim); text-decoration: none; font-size: 0.8rem; transition: color 0.15s; }
.nav-links a:hover, .nav-links a.active { color: var(--green); }

.post-wrap { max-width: 760px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
.back-link { display: inline-block; color: var(--text-dim); font-size: 0.78rem; text-decoration: none; margin-bottom: 1.5rem; }
.back-link:hover { color: var(--green); }

.post-header { border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.75rem; }
.post-meta { font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.5rem; }
.section-label { color: var(--cyan); }
.post-title { font-size: clamp(1.3rem, 4vw, 1.9rem); color: var(--green); line-height: 1.3; margin-bottom: 0.6rem; }
.post-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.post-tag { font-size: 0.7rem; color: var(--green-muted); border: 1px solid var(--green-dark); padding: 0.1rem 0.4rem; text-decoration: none; }
.post-tag:hover { color: var(--green); border-color: var(--green-muted); }

.md-content { font-size: 0.88rem; line-height: 1.8; }
.md-content p { margin-bottom: 1rem; }
.md-content h1, .md-content h2, .md-content h3 { color: var(--green); margin: 1.5rem 0 0.6rem; line-height: 1.3; }
.md-content strong { color: var(--green); }
.md-content em { color: #39ff14; }
.md-content a { color: var(--cyan); }
.md-content ul, .md-content ol { margin: 0.5rem 0 1rem 1.4rem; }
.md-content li { margin-bottom: 0.3rem; }
.md-content blockquote { border-left: 3px solid var(--green-muted); padding-left: 0.9rem; margin: 1rem 0; color: var(--text-dim); font-style: italic; }
.md-content code { background: #0a0a0a; border: 1px solid var(--border); padding: 0.1rem 0.35rem; font-size: 0.85em; }
.md-content pre { background: #0a0a0a; border: 1px solid var(--border); padding: 0.85rem; overflow-x: auto; margin-bottom: 1rem; }
.md-content pre code { border: none; padding: 0; }
.md-content img { max-width: 100%; height: auto; }

.post-pager { display: flex; justify-content: space-between; gap: 1rem; margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--border); font-size: 0.78rem; }
.post-pager a { color: var(--cyan); text-decoration: none; max-width: 48%; }
.post-pager a:hover { text-decoration: underline; }
.pager-older { margin-left: auto; text-align: right; }

@media (max-width: 600px) {
    .site-nav { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
    .nav-links { gap: 0.9rem; }
    .nav-links a { font-size: 0.85rem; padding: 0.2rem 0; }
    .post-wrap { padding: 1.5rem 1rem 3rem; }
    .post-pager { flex-direction: column; }
    .post-pager a { max-width: 100%; }
}
```

- [ ] **Step 5: Run `npm test`.** Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/posts.mjs blog/post.css test/posts.test.mjs
git commit -m "build: post page, RSS feed and sitemap renderers"
```

**VERIFY:** `npm test`

---

### Task 4: Resume prerender + AI section + literal skill filter

**Files:**
- Create: `scripts/lib/resume.mjs`, `assets/js/skill-match.js`, `test/resume.test.mjs`, `test/skill-match.test.mjs`
- Modify: `resume.html` (head OG copy, nav, CSS additions, body markers, script)

**Interfaces:**
- Consumes: `escapeHtml` from `scripts/lib/util.mjs`, and `data/profile.json` shape (Task 1).
- Produces:
  - `scripts/lib/resume.mjs`: `BLOCK_NAMES = ['about','ai','skills','experience','education']`, `renderResumeBlocks(profile): {about, ai, skills, experience, education}` (HTML strings), `injectBlocks(html: string, blocks: object): string` (throws `Error('missing build marker: <name>')`)
  - `assets/js/skill-match.js` → `window.SkillMatch` / `require`: `escapeRegExp(s)`, `matches(text, skill): boolean`, `highlightParts(text, skill): {text:string, match:boolean}[]`
  - Marker syntax in `resume.html`: `<!-- build:NAME -->…<!-- /build:NAME -->`

- [ ] **Step 1: Write failing tests `test/skill-match.test.mjs`**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { matches, highlightParts, escapeRegExp } = createRequire(import.meta.url)('../assets/js/skill-match.js');

test('metacharacters match literally', () => {
  assert.equal(matches('Released via Digital.ai pipelines', 'Digital.ai'), true);
  assert.equal(matches('Released via Digitalxai pipelines', 'Digital.ai'), false);
  assert.equal(matches('Wrote C++ services', 'C++'), true);
  assert.equal(escapeRegExp('a.b*c'), 'a\\.b\\*c');
});

test('no partial-word matches, case-insensitive', () => {
  assert.equal(matches('Ran Dockerd daemons', 'Docker'), false);
  assert.equal(matches('Ran docker containers', 'Docker'), true);
  assert.equal(matches('AWS Systems Manager', 'AWS'), true);
  assert.equal(matches('LAWSON', 'AWS'), false);
});

test('highlightParts splits around every match', () => {
  assert.deepEqual(highlightParts('Use AWS and aws.', 'AWS'), [
    { text: 'Use ', match: false },
    { text: 'AWS', match: true },
    { text: ' and ', match: false },
    { text: 'aws', match: true },
    { text: '.', match: false },
  ]);
});
```

- [ ] **Step 2: Write failing tests `test/resume.test.mjs`**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderResumeBlocks, injectBlocks, BLOCK_NAMES } from '../scripts/lib/resume.mjs';

const profile = JSON.parse(readFileSync(new URL('../data/profile.json', import.meta.url)));
const resumeHtml = readFileSync(new URL('../resume.html', import.meta.url), 'utf8');
const blocks = renderResumeBlocks(profile);

test('renders every block', () => {
  assert.deepEqual(Object.keys(blocks).sort(), [...BLOCK_NAMES].sort());
});

test('content reflects the current resume', () => {
  assert.ok(blocks.experience.includes('ServiceNow'));
  assert.ok(blocks.experience.includes('Senior Production Services Engineer'));
  assert.ok(blocks.experience.includes('2017 – 2025'));
  assert.ok(!blocks.experience.includes('2017 – Present'));
  assert.ok(blocks.experience.includes('NIST compliance'));
  assert.ok(blocks.about.includes('16+'));
  assert.ok(blocks.about.includes('Current DoD CAC holder'));
  assert.ok(blocks.ai.includes('kube-yaml-scrub'));
  assert.ok(blocks.ai.includes('href="https://github.com/solarsnake/kube-yaml-scrub"'));
  assert.ok(!/SageMaker|MLflow|Vertex|Pinecone|Weaviate/.test(Object.values(blocks).join('')));
  assert.ok(blocks.skills.includes('data-skill="Digital.ai"'));
});

test('escapes profile values', () => {
  const p = structuredClone(profile);
  p.headline = '<img src=x onerror=alert(1)>';
  p.skills = { 'A&B': ['x"y'] };
  const b = renderResumeBlocks(p);
  assert.ok(b.about.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(b.skills.includes('A&amp;B'));
  assert.ok(b.skills.includes('data-skill="x&quot;y"'));
});

test('injectBlocks replaces between markers and keeps them', () => {
  const html = 'a<!-- build:about -->OLD<!-- /build:about -->b';
  assert.equal(injectBlocks(html, { about: 'NEW' }), 'a<!-- build:about -->NEW<!-- /build:about -->b');
  assert.throws(() => injectBlocks('nothing here', { about: 'x' }), /missing build marker: about/);
});

test('injectBlocks handles $ in content literally', () => {
  const html = '<!-- build:about -->x<!-- /build:about -->';
  assert.equal(injectBlocks(html, { about: 'cost $& $1' }), '<!-- build:about -->cost $& $1<!-- /build:about -->');
});

test('real resume.html has every marker and no placeholder after injection', () => {
  const out = injectBlocks(resumeHtml, blocks);
  for (const name of BLOCK_NAMES) assert.ok(out.includes(`<!-- build:${name} -->`));
  assert.ok(!out.includes('build-placeholder'));
  assert.ok(out.includes('id="ai"'));
});
```

- [ ] **Step 3: Run `npm test`.** Expected: FAIL (modules missing).

- [ ] **Step 4: Create `assets/js/skill-match.js`**

```js
/* Literal, word-boundary skill matching for the resume skill filter (window.SkillMatch; Node require in tests). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SkillMatch = api;
})(typeof self !== 'undefined' ? self : this, function () {
  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function pattern(skill, flags) {
    return new RegExp(`(?<![\\w])(${escapeRegExp(skill)})(?![\\w])`, flags);
  }

  function matches(text, skill) {
    return pattern(skill, 'i').test(String(text));
  }

  function highlightParts(text, skill) {
    return String(text).split(pattern(skill, 'gi'))
      .map((part, i) => ({ text: part, match: i % 2 === 1 }))
      .filter(part => part.text !== '');
  }

  return { escapeRegExp, matches, highlightParts };
});
```

- [ ] **Step 5: Create `scripts/lib/resume.mjs`**

```js
import { escapeHtml as e } from './util.mjs';

export const BLOCK_NAMES = ['about', 'ai', 'skills', 'experience', 'education'];

function about(p) {
  const cards = (p.highlights || []).map(h =>
    `<div class="about-card"><h3>${e(h.title)}</h3><p>${e(h.text)}</p></div>`).join('\n');
  return `<p class="about-headline">${e(p.headline)}</p>
<p class="about-background">${e(p.background)}</p>
<p class="about-summary">${e(p.summary)}</p>
<div class="about-cards">
${cards}
</div>`;
}

function ai(p) {
  const cards = (p.ai?.featured || []).map(f => {
    const tags = (f.tags || []).map(t => `<span>#${e(t)}</span>`).join(' ');
    const link = f.link
      ? `<a class="ai-link" href="${e(f.link)}" target="_blank" rel="noopener">${e(f.link.replace(/^https:\/\//, ''))} ↗</a>`
      : '';
    return `<article class="ai-card">
  <div class="ai-context">${e(f.context)}</div>
  <h3>${e(f.title)}</h3>
  <p>${e(f.text)}</p>
  <div class="ai-tags">${tags}</div>
  ${link}
</article>`;
  }).join('\n');
  return `<p class="ai-intro">${e(p.ai?.intro)}</p>
<div class="ai-grid">
${cards}
</div>`;
}

function skills(p) {
  return Object.entries(p.skills).map(([cat, list]) => {
    const tags = list.map(s =>
      `<button class="skill-tag" type="button" data-skill="${e(s)}">${e(s)}</button>`).join('');
    return `<div class="skill-category"><div class="skill-category-name">${e(cat)}</div><div class="skill-tags">${tags}</div></div>`;
  }).join('\n');
}

function experience(p) {
  return p.experience.map(exp => {
    const roles = exp.roles.map(role => {
      const summary = role.summary ? `<li class="role-summary">${e(role.summary)}</li>` : '';
      const details = role.details.map(d => `<li class="experience-detail">${e(d)}</li>`).join('');
      const note = role.note ? `<div class="role-note">${e(role.note)}</div>` : '';
      return `<div class="role-item">
  <div class="role-header" role="button" tabindex="0" aria-expanded="false">
    <div><div class="role-title">${e(role.title)}</div><div class="role-duration">${e(role.duration)}</div>${note}</div>
    <span class="role-chevron">▾</span>
  </div>
  <div class="role-content"><ul class="role-details">${summary}${details}</ul></div>
</div>`;
    }).join('\n');
    return `<div class="timeline-company">
<div class="company-name">${e(exp.company)}</div>
<div class="company-meta">${e(exp.location)} · ${e(exp.duration)}</div>
${roles}
</div>`;
  }).join('\n');
}

function education(p) {
  const ed = p.education;
  return `<div class="education-card">
  <h3>${e(ed.school)}</h3>
  <p class="degree">${e(ed.degree)} · ${e(ed.year)}</p>
  <p class="award">${e(ed.award)}</p>
</div>`;
}

export function renderResumeBlocks(p) {
  return { about: about(p), ai: ai(p), skills: skills(p), experience: experience(p), education: education(p) };
}

export function injectBlocks(html, blocks) {
  let out = html;
  for (const [name, content] of Object.entries(blocks)) {
    const re = new RegExp(`(<!-- build:${name} -->)[\\s\\S]*?(<!-- /build:${name} -->)`);
    if (!re.test(out)) throw new Error(`missing build marker: ${name}`);
    out = out.replace(re, (_m, open, close) => `${open}${content}${close}`);
  }
  return out;
}
```

- [ ] **Step 6: Edit `resume.html` head (lines 8–16).** Replace the OG/Twitter descriptions:
  - `og:title` → `Timothy Tippens — Cloud & DevOps Engineer · AI-augmented infrastructure`
  - `og:description` → `16+ years building mission-critical cloud infrastructure at ServiceNow, NASA JPL and NBCUniversal — plus AI agent tooling for operations.`
  - `twitter:description` → `Cloud & DevOps Engineer — 16+ years at ServiceNow, NASA JPL and NBCUniversal. AI-augmented infrastructure.`

- [ ] **Step 7: Edit `resume.html` CSS.** Add these rules before the `@media (max-width: 640px)` block (line 347):

```css
        /* ── Background line ── */
        .about-background {
            font-size: 0.74rem;
            color: var(--cyan);
            margin-bottom: 0.9rem;
        }

        /* ── AI ── */
        .ai-intro { font-size: 0.82rem; color: var(--text-dim); max-width: 680px; margin-bottom: 1.25rem; line-height: 1.7; }
        .ai-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem; }
        .ai-card { background: var(--bg-card); border: 1px solid var(--border); padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.45rem; transition: border-color 0.15s; }
        .ai-card:hover { border-color: var(--border-active); }
        .ai-context { font-size: 0.66rem; color: var(--cyan); letter-spacing: 0.08em; text-transform: uppercase; }
        .ai-card h3 { font-size: 0.86rem; color: var(--green); }
        .ai-card p { font-size: 0.76rem; color: var(--text-dim); line-height: 1.55; }
        .ai-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; font-size: 0.66rem; color: var(--green-muted); }
        .ai-link { font-size: 0.74rem; color: var(--cyan); text-decoration: none; margin-top: auto; }
        .ai-link:hover { text-decoration: underline; }

        /* ── Role extras ── */
        .role-note { font-size: 0.68rem; color: var(--cyan); font-style: italic; margin-top: 0.1rem; }
        .role-summary { font-size: 0.78rem; color: var(--text); padding: 0.2rem 0 0.4rem; line-height: 1.55; }
```

Inside `@media (max-width: 640px)`, add `.ai-grid { grid-template-columns: 1fr; }`. Inside `@media print`, add:

```css
            .about-background { color: #000; }
            .ai-intro, .ai-card p, .role-summary { color: #333; }
            .ai-card { border: 1px solid #000; break-inside: avoid; }
            .ai-card h3, .ai-context, .ai-tags, .ai-link, .role-note { color: #000; }
```

- [ ] **Step 8: Edit `resume.html` nav (lines 431–453).** Replace with:

```html
<nav class="site-nav">
    <div class="brand">tippens@portfolio<span>:/resume</span>$</div>
    <ul class="nav-links">
        <li><a href="/">~/terminal</a></li>
        <li><a href="/resume.html" class="active">~/resume</a></li>
        <li><a href="#ai">~/ai</a></li>
        <li><a href="/blog/">~/blog</a></li>
        <li><a href="/contact.html">~/contact</a></li>
    </ul>
    <div class="nav-mobile">
        <select id="mobile-nav" aria-label="Navigate">
            <option value="#about">about</option>
            <option value="#ai">ai</option>
            <option value="#skills">skills</option>
            <option value="#experience">experience</option>
            <option value="#education">education</option>
            <option value="/">~/terminal</option>
            <option value="/blog/">~/blog</option>
            <option value="/contact.html">~/contact</option>
        </select>
    </div>
</nav>
```

- [ ] **Step 9: Edit `resume.html` body (lines 455–534).** Replace the `<div class="page-wrap">…</div>` and footer with:

```html
<div class="page-wrap">

    <section id="about">
        <div class="section-header"><h2>// about</h2></div>
        <!-- build:about --><p class="build-placeholder">run npm run build</p><!-- /build:about -->
    </section>

    <section id="ai">
        <div class="section-header">
            <h2>// ai</h2>
            <p>Where infrastructure meets LLMs</p>
        </div>
        <!-- build:ai --><p class="build-placeholder">run npm run build</p><!-- /build:ai -->
    </section>

    <section id="skills">
        <div class="section-header">
            <h2>// skills</h2>
            <p>Click any skill to filter the experience timeline</p>
        </div>
        <div id="filter-banner">
            <span id="filter-label"></span>
            <button id="clear-filter">[ clear filter ]</button>
        </div>
        <div id="skills-container"><!-- build:skills --><p class="build-placeholder">run npm run build</p><!-- /build:skills --></div>
    </section>

    <section id="experience">
        <div class="section-header">
            <h2>// experience</h2>
            <p>Click a role to expand details</p>
        </div>
        <div class="timeline" id="experience-container"><!-- build:experience --><p class="build-placeholder">run npm run build</p><!-- /build:experience --></div>
    </section>

    <section id="education">
        <div class="section-header"><h2>// education</h2></div>
        <!-- build:education --><p class="build-placeholder">run npm run build</p><!-- /build:education -->
    </section>

</div>

<footer>
    Timothy M. Tippens &nbsp;·&nbsp; San Diego, CA
    <br><br>
    <a href="mailto:solarsnake88@proton.me">solarsnake88@proton.me</a>
    <span class="sep">|</span>
    <a href="https://github.com/solarsnake" target="_blank" rel="noopener">github.com/solarsnake</a>
    <span class="sep">|</span>
    <a href="https://linkedin.com/in/timothytippens" target="_blank" rel="noopener">linkedin.com/in/timothytippens</a>
</footer>
```

- [ ] **Step 10: Replace the entire inline `<script>` (lines 536–811)** with a script tag for the helper plus behavior-only JS:

```html
<script src="/assets/js/skill-match.js"></script>
<script>
    let activeSkill = null;

    // ── Role expand/collapse ──────────────────────────────────────────
    document.querySelectorAll('.role-header').forEach(header => {
        const content = header.nextElementSibling;
        const chevron = header.querySelector('.role-chevron');
        const toggle = () => {
            const open = content.classList.toggle('open');
            chevron.classList.toggle('open', open);
            header.setAttribute('aria-expanded', String(open));
        };
        header.addEventListener('click', toggle);
        header.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
    });

    document.querySelectorAll('.experience-detail').forEach(li => {
        li.dataset.originalContent = li.textContent;
    });

    // ── Skill filter ──────────────────────────────────────────────────
    function skillButton(skill) {
        return Array.from(document.querySelectorAll('.skill-tag')).find(b => b.dataset.skill === skill);
    }

    function toggleSkillFilter(skill) {
        if (activeSkill) skillButton(activeSkill).classList.remove('active');
        activeSkill = activeSkill === skill ? null : skill;
        if (activeSkill) skillButton(activeSkill).classList.add('active');
        applyFilter();
    }

    function applyFilter() {
        const banner = document.getElementById('filter-banner');
        document.getElementById('filter-label').textContent = activeSkill ? `filtering by: ${activeSkill}` : '';
        banner.classList.toggle('visible', !!activeSkill);

        document.querySelectorAll('.role-header').forEach(header => {
            header.nextElementSibling.classList.toggle('open', !!activeSkill);
            header.querySelector('.role-chevron').classList.toggle('open', !!activeSkill);
            header.setAttribute('aria-expanded', String(!!activeSkill));
        });

        document.querySelectorAll('.experience-detail').forEach(li => {
            const text = li.dataset.originalContent;
            li.textContent = '';
            if (!activeSkill) { li.textContent = text; li.style.display = ''; return; }
            if (!SkillMatch.matches(text, activeSkill)) { li.textContent = text; li.style.display = 'none'; return; }
            SkillMatch.highlightParts(text, activeSkill).forEach(part => {
                if (part.match) {
                    const span = document.createElement('span');
                    span.className = 'highlight';
                    span.textContent = part.text;
                    li.appendChild(span);
                } else {
                    li.appendChild(document.createTextNode(part.text));
                }
            });
            li.style.display = '';
        });
    }

    document.querySelectorAll('.skill-tag').forEach(btn => {
        btn.addEventListener('click', () => toggleSkillFilter(btn.dataset.skill));
    });

    document.getElementById('clear-filter').addEventListener('click', () => {
        if (activeSkill) skillButton(activeSkill).classList.remove('active');
        activeSkill = null;
        applyFilter();
    });

    // ── Mobile nav ────────────────────────────────────────────────────
    document.getElementById('mobile-nav').addEventListener('change', e => {
        const val = e.target.value;
        if (val.startsWith('#')) {
            const el = document.querySelector(val);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.location.href = val;
        }
    });
</script>
```

- [ ] **Step 11: Run `npm test && npm run check:js -- resume.html`.** Expected: all PASS.

- [ ] **Step 12: Commit**

```bash
git add scripts/lib/resume.mjs assets/js/skill-match.js test/resume.test.mjs test/skill-match.test.mjs resume.html
git commit -m "resume: prerender from profile.json, add AI section, literal skill filter"
```

**VERIFY:** `npm test && npm run check:js -- resume.html && grep -q 'build:ai' resume.html && ! grep -q 'experienceData' resume.html`

---

### Task 5: Build CLI, deploy workflow, docs

**Files:**
- Create: `scripts/build.mjs`, `test/build.test.mjs`
- Modify: `.github/workflows/terminal.yml`, `README.md`
- Delete: `sitemap.xml`

**Interfaces:**
- Consumes: `validateProfile`, `validatePosts` (Task 2); `publishedPosts`, `neighbors`, `renderPostPage`, `renderFeed`, `renderSitemap` (Task 3); `renderResumeBlocks`, `injectBlocks` (Task 4).
- Produces:
  - `scripts/build.mjs` exports `COPY_ALLOWLIST: string[]` and `build({ root: string, out: string }): Promise<{ posts: number }>`. Running `node scripts/build.mjs` builds `./` into `./_site`.
  - Output: `_site/data/build.json` = `{ "builtAt": ISOString, "commits": [{ "sha": string, "subject": string }] }`. Task 6 reads this.
  - Output: `_site/posts/index.json` contains published posts only.

- [ ] **Step 1: Write failing test `test/build.test.mjs`**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../scripts/build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function walk(dir) {
  const out = [];
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}

test('full build of the real repo', async (t) => {
  const out = await mkdtemp(path.join(tmpdir(), 'site-'));
  t.after(() => rm(out, { recursive: true, force: true }));
  const result = await build({ root, out });

  const source = JSON.parse(await readFile(path.join(root, 'posts/index.json'), 'utf8')).posts;
  const published = source.filter(p => p.published === true);
  assert.equal(result.posts, published.length);
  for (const p of published) assert.ok(existsSync(path.join(out, 'blog', p.slug, 'index.html')), `missing page ${p.slug}`);
  for (const p of source.filter(p => p.published !== true)) assert.ok(!existsSync(path.join(out, 'blog', p.slug)), `draft page ${p.slug}`);

  const deployedPosts = JSON.parse(await readFile(path.join(out, 'posts/index.json'), 'utf8')).posts;
  assert.ok(deployedPosts.every(p => p.published === true), 'draft leaked into deployed posts/index.json');
  assert.equal(deployedPosts.length, published.length);

  for (const f of ['index.html', 'resume.html', 'contact.html', '404.html', 'robots.txt', 'feed.xml', 'sitemap.xml',
    'blog/index.html', 'blog/post.css', 'admin/index.html', 'data/profile.json', 'data/build.json',
    'assets/js/post-rules.js', 'assets/js/skill-match.js']) {
    assert.ok(existsSync(path.join(out, f)), `missing ${f}`);
  }
  for (const f of ['docs', 'scripts', 'test', 'node_modules', 'package.json', 'package-lock.json', '.github', 'README.md']) {
    assert.ok(!existsSync(path.join(out, f)), `should not deploy ${f}`);
  }

  const resume = await readFile(path.join(out, 'resume.html'), 'utf8');
  assert.ok(resume.includes('Senior Production Services Engineer'));
  assert.ok(!resume.includes('build-placeholder'));

  const buildInfo = JSON.parse(await readFile(path.join(out, 'data/build.json'), 'utf8'));
  assert.ok(Array.isArray(buildInfo.commits));
  assert.ok(typeof buildInfo.builtAt === 'string');

  for (const f of await walk(out)) {
    const text = await readFile(f, 'utf8').catch(() => '');
    assert.ok(!/919\.491|424\.253|timothy\.tippens@gmail/i.test(text), `private contact info in ${f}`);
  }
});

test('invalid posts fail the build and name the slug', async (t) => {
  const tmpRoot = await mkdtemp(path.join(tmpdir(), 'root-'));
  const out = path.join(tmpRoot, '_site');
  t.after(() => rm(tmpRoot, { recursive: true, force: true }));
  await cp(path.join(root, 'data'), path.join(tmpRoot, 'data'), { recursive: true });
  await cp(path.join(root, 'resume.html'), path.join(tmpRoot, 'resume.html'));
  await cp(path.join(root, 'assets'), path.join(tmpRoot, 'assets'), { recursive: true });
  await mkdir(path.join(tmpRoot, 'posts'));
  const p = { slug: 'dupe', title: 'T', date: '2026-10-07', excerpt: '', tags: [], content: 'x', published: true, section: 'tech' };
  await writeFile(path.join(tmpRoot, 'posts/index.json'), JSON.stringify({ posts: [p, p] }));
  await assert.rejects(build({ root: tmpRoot, out }), /duplicate slug "dupe"/);
  assert.ok(!existsSync(path.join(out, 'index.html')), 'nothing should be written on validation failure');
});

test('malformed JSON names the file', async (t) => {
  const tmpRoot = await mkdtemp(path.join(tmpdir(), 'root-'));
  t.after(() => rm(tmpRoot, { recursive: true, force: true }));
  await mkdir(path.join(tmpRoot, 'data'));
  await mkdir(path.join(tmpRoot, 'posts'));
  await writeFile(path.join(tmpRoot, 'data/profile.json'), '{ nope');
  await writeFile(path.join(tmpRoot, 'posts/index.json'), '{"posts":[]}');
  await assert.rejects(build({ root: tmpRoot, out: path.join(tmpRoot, '_site') }), /data\/profile\.json/);
});
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL (`build.mjs` missing).

- [ ] **Step 3: Create `scripts/build.mjs`**

```js
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProfile, validatePosts } from './lib/validate.mjs';
import { publishedPosts, neighbors, renderPostPage, renderFeed, renderSitemap } from './lib/posts.mjs';
import { renderResumeBlocks, injectBlocks } from './lib/resume.mjs';

// Everything deployed must be listed here. resume.html and posts/index.json are written separately.
export const COPY_ALLOWLIST = [
  'index.html', 'contact.html', '404.html', 'robots.txt', 'CNAME',
  'blog/index.html', 'blog/post.css', 'admin', 'data', 'assets',
];

async function readJson(root, rel) {
  const text = await readFile(path.join(root, rel), 'utf8');
  try { return JSON.parse(text); }
  catch (err) { throw new Error(`${rel}: invalid JSON (${err.message})`); }
}

function recentCommits(root) {
  try {
    const log = execFileSync('git', ['log', '-5', '--format=%h%x09%s'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return log.trim().split('\n').filter(Boolean).map(line => {
      const [sha, ...rest] = line.split('\t');
      return { sha, subject: rest.join('\t') };
    });
  } catch {
    return [];
  }
}

async function write(out, rel, content) {
  const file = path.join(out, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}

export async function build({ root, out }) {
  const profile = await readJson(root, 'data/profile.json');
  const postsData = await readJson(root, 'posts/index.json');
  const errors = [...validateProfile(profile), ...validatePosts(postsData)];
  if (errors.length) throw new Error(`validation failed:\n  ${errors.join('\n  ')}`);

  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  for (const rel of COPY_ALLOWLIST) {
    const src = path.join(root, rel);
    if (!existsSync(src)) continue;
    await mkdir(path.dirname(path.join(out, rel)), { recursive: true });
    await cp(src, path.join(out, rel), { recursive: true });
  }

  const resume = await readFile(path.join(root, 'resume.html'), 'utf8');
  await write(out, 'resume.html', injectBlocks(resume, renderResumeBlocks(profile)));

  const published = publishedPosts(postsData.posts);
  for (const post of published) {
    await write(out, `blog/${post.slug}/index.html`, renderPostPage(post, neighbors(published, post)));
  }
  await write(out, 'posts/index.json', JSON.stringify({ posts: published }, null, 2) + '\n');
  await write(out, 'feed.xml', renderFeed(published));
  await write(out, 'sitemap.xml', renderSitemap(published));
  await write(out, 'data/build.json', JSON.stringify({ builtAt: new Date().toISOString(), commits: recentCommits(root) }, null, 2) + '\n');

  return { posts: published.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  build({ root, out: path.join(root, '_site') })
    .then(({ posts }) => console.log(`built _site/ with ${posts} published posts`))
    .catch(err => { console.error(`build failed: ${err.message}`); process.exit(1); });
}
```

- [ ] **Step 4: Run `npm test && npm run build`.** Expected: tests PASS. Build prints `built _site/ with 16 published posts`, or whatever number of posts in the file are published.

- [ ] **Step 5: Replace `.github/workflows/terminal.yml` steps** (keep `name`, `on`, `permissions`, `concurrency`, and the job header unchanged):

```yaml
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 10
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - name: Install
        run: npm ci
      - name: Test
        run: npm test
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '_site'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 6: `git rm sitemap.xml`**

- [ ] **Step 7: Write `README.md`**

````markdown
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
````

- [ ] **Step 8: Run VERIFY.** Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add scripts/build.mjs test/build.test.mjs .github/workflows/terminal.yml README.md
git commit -m "build: site generator CLI, deploy _site from Actions, docs"
```

**VERIFY:** `npm test && npm run build && test -f _site/feed.xml && test -f _site/data/build.json && test ! -e sitemap.xml && grep -q "path: '_site'" .github/workflows/terminal.yml`

---

### Task 6: Terminal and mobile landing driven by profile data

**Files:**
- Create: `assets/js/profile-text.js`, `test/profile-text.test.mjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: `data/profile.json` shape (Task 1), `data/build.json` shape `{commits:[{sha,subject}]}` (Task 5), `posts/index.json` with `section` (Task 1).
- Produces: `assets/js/profile-text.js`, available as `window.ProfileText` in the browser and via `require` in Node:
  - `escapeBrackets(s): string`
  - `aboutText(p): string`
  - `resumeMarkdown(p): string`
  - `contactText(p): string`
  - `skillsLines(p): string[]`
  - `aiLines(p): string[]`
  - `neofetchInfo(p, {host, uptime}): string[]`
  - `latestPosts(postsData, n = 3): {title, date, slug}[]`
  - `gitLogLines(buildInfo): string[]`
  - The `*Lines` functions return jQuery Terminal–formatted strings.

- [ ] **Step 1: Write failing tests `test/profile-text.test.mjs`**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const PT = createRequire(import.meta.url)('../assets/js/profile-text.js');
const profile = JSON.parse(readFileSync(new URL('../data/profile.json', import.meta.url)));

test('escapeBrackets neutralizes jQuery Terminal formatting', () => {
  assert.equal(PT.escapeBrackets('[[b;red;]x]'), '&#91;&#91;b;red;&#93;x&#93;');
  assert.equal(PT.escapeBrackets(null), '');
});

test('aboutText reflects current profile', () => {
  const t = PT.aboutText(profile);
  assert.ok(t.includes(profile.headline));
  assert.ok(t.includes('16+'));
  assert.ok(t.includes('Current DoD CAC holder'));
  assert.ok(t.includes("Type 'ai'"));
});

test('skillsLines lists every category and no banned skills', () => {
  const t = PT.skillsLines(profile).join('\n');
  for (const cat of Object.keys(profile.skills)) assert.ok(t.includes(PT.escapeBrackets(cat)));
  assert.ok(!/SageMaker|MLflow|Vertex|Pinecone|Weaviate/.test(t));
});

test('aiLines includes featured items with links', () => {
  const t = PT.aiLines(profile).join('\n');
  assert.ok(t.includes('kube-yaml-scrub'));
  assert.ok(t.includes('[[!;;;;https://github.com/solarsnake/kube-yaml-scrub]'));
  assert.ok(t.includes('/resume.html#ai'));
});

test('neofetchInfo uses headline and AI tooling', () => {
  const t = PT.neofetchInfo(profile, { host: 'justthetipp.com', uptime: '5s' }).join('\n');
  assert.ok(t.includes(profile.headline));
  assert.ok(t.includes('Claude Code'));
  assert.ok(t.includes('justthetipp.com'));
  assert.ok(t.includes('5s'));
});

test('resumeMarkdown and contactText', () => {
  assert.ok(PT.resumeMarkdown(profile).includes('ServiceNow'));
  assert.ok(PT.contactText(profile).includes('solarsnake88@proton.me'));
});

test('latestPosts prefers tech, falls back, skips drafts, handles bad input', () => {
  const posts = { posts: [
    { slug: 'a', title: 'A', date: '2015-01-01', section: 'sheep', published: true },
    { slug: 'b', title: 'B', date: '2026-01-01', section: 'tech', published: true },
    { slug: 'c', title: 'C', date: '2026-02-01', section: 'tech', published: false },
  ] };
  assert.deepEqual(PT.latestPosts(posts), [{ title: 'B', date: '2026-01-01', slug: 'b' }]);
  const sheepOnly = { posts: [posts.posts[0]] };
  assert.deepEqual(PT.latestPosts(sheepOnly).map(p => p.slug), ['a']);
  assert.deepEqual(PT.latestPosts(null), []);
  assert.deepEqual(PT.latestPosts({}), []);
});

test('gitLogLines formats commits and degrades gracefully', () => {
  assert.deepEqual(PT.gitLogLines({ commits: [{ sha: 'abc1234', subject: 'fix [thing]' }] }),
    ['commit abc1234  [[;#008800;]fix &#91;thing&#93;]']);
  assert.deepEqual(PT.gitLogLines(null), ['git log: history unavailable']);
  assert.deepEqual(PT.gitLogLines({ commits: [] }), ['git log: history unavailable']);
});
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL (module missing).

- [ ] **Step 3: Create `assets/js/profile-text.js`**

```js
/* Terminal text built from data/profile.json, posts and build info (window.ProfileText; Node require in tests). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ProfileText = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const RULE = '─';

  function escapeBrackets(s) {
    return String(s ?? '').replace(/\[/g, '&#91;').replace(/\]/g, '&#93;');
  }

  function aboutText(p) {
    return [
      `${p.name} — ${p.headline}`,
      RULE.repeat(55),
      '',
      p.summary,
      '',
      p.background,
      '',
      'Highlights',
      ...(p.highlights || []).map(h => `  • ${h.title} — ${h.text}`),
      '',
      "Type 'skills' for the full skill matrix.",
      "Type 'ai'     for AI work.",
      "Type 'resume' to open the interactive resume.",
    ].join('\n');
  }

  function resumeMarkdown(p) {
    const roles = p.experience.flatMap(exp =>
      exp.roles.map(r => `- **${exp.company}** — ${r.title} (${r.duration})`));
    return [
      `# ${p.name} — Resume`,
      '',
      "> Type 'resume' for the full interactive resume.",
      '',
      '## Summary',
      p.summary,
      '',
      '## Experience',
      ...roles,
      '',
      '## Background',
      p.background,
      '',
    ].join('\n');
  }

  function contactText(p) {
    return [
      'Contact',
      RULE.repeat(30),
      `Email     ${p.contact.email}`,
      `GitHub    ${p.contact.github.replace(/^https:\/\//, '')}`,
      `LinkedIn  ${p.contact.linkedin.replace(/^https:\/\//, '')}`,
      '',
      'Open to opportunities, collaboration, or just connecting.',
    ].join('\n');
  }

  function skillsLines(p) {
    const lines = [`[[b;#00FF00;]${escapeBrackets(p.name)} — Skill Matrix]`, `[[;#555;]${RULE.repeat(40)}]`];
    Object.entries(p.skills).forEach(([cat, items]) => {
      lines.push('', `  [[b;#00FFCC;]${escapeBrackets(cat)}]`);
      lines.push(`    ${items.map(escapeBrackets).join(' [[;#006600;]·] ')}`);
    });
    lines.push('');
    return lines;
  }

  function aiLines(p) {
    const lines = [`[[b;#00FF00;]AI work]`, `[[;#555;]${RULE.repeat(40)}]`, escapeBrackets(p.ai.intro)];
    p.ai.featured.forEach(f => {
      lines.push('', `  [[b;#00FFCC;]${escapeBrackets(f.title)}]  [[;#008800;]${escapeBrackets(f.context)}]`);
      lines.push(`  ${escapeBrackets(f.text)}`);
      if (f.tags && f.tags.length) lines.push(`  [[;#006600;]${f.tags.map(t => '#' + escapeBrackets(t)).join(' ')}]`);
      if (f.link) lines.push(`  [[!;;;;${f.link}]${escapeBrackets(f.link)}]`);
    });
    lines.push('', `  More: [[!;;;;/resume.html#ai]/resume.html#ai]`, '');
    return lines;
  }

  function neofetchInfo(p, { host, uptime }) {
    const kv = (k, v) => `[[b;#00FF00;]${k}][[;#aaa;]:] ${escapeBrackets(v)}`;
    return [
      `[[b;#00FF00;]tippens][[;#AAAAAA;]@][[b;#00FF00;]portfolio]`,
      `[[;#444;]${RULE.repeat(22)}]`,
      kv('OS', 'Cloud Native Linux'),
      kv('Host', host),
      kv('Role', p.headline),
      kv('Shell', 'jQuery Terminal 2.44.1'),
      kv('Stack', (p.featuredSkills || []).slice(0, 5).join(' · ')),
      kv('AI', (p.skills['AI Tooling'] || []).join(' · ')),
      kv('Languages', (p.skills.Languages || []).join(' · ')),
      kv('Uptime', uptime),
      '',
      `[[b;#000;#00FF00;]   ][[b;#000;#00CC00;]   ][[b;#000;#009900;]   ][[b;#000;#006600;]   ][[b;#000;#003300;]   ]`,
    ];
  }

  function latestPosts(data, n = 3) {
    if (!data || !Array.isArray(data.posts)) return [];
    const pub = data.posts.filter(x => x.published === true)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const tech = pub.filter(x => x.section === 'tech');
    return (tech.length ? tech : pub).slice(0, n).map(({ title, date, slug }) => ({ title, date, slug }));
  }

  function gitLogLines(build) {
    if (!build || !Array.isArray(build.commits) || build.commits.length === 0) return ['git log: history unavailable'];
    return build.commits.map(c => `commit ${escapeBrackets(c.sha)}  [[;#008800;]${escapeBrackets(c.subject)}]`);
  }

  return { escapeBrackets, aboutText, resumeMarkdown, contactText, skillsLines, aiLines, neofetchInfo, latestPosts, gitLogLines };
});
```

- [ ] **Step 4: Run `npm test`.** Expected: PASS.

- [ ] **Step 5: Edit `index.html` head.**
  - Delete line 17 (`<script src="https://cdn.tailwindcss.com"></script>`).
  - After the marked.js script (line 21), add `<script src="/assets/js/profile-text.js"></script>`.
  - Change `<body class="bg-black text-green-400">` (line 387) to `<body>`.
  - `og:title` → `tippens@portfolio — Cloud & DevOps Engineer · AI-augmented infrastructure`
  - `og:description` → `Interactive terminal portfolio for Timothy Tippens — 16+ years of cloud and DevOps at ServiceNow, NASA JPL and NBCUniversal, now building AI agent tooling for operations.`
  - `twitter:description` → `Interactive terminal portfolio — Cloud & DevOps Engineer building AI-augmented infrastructure.`

- [ ] **Step 6: Edit the mobile landing markup (lines 399–430).**
  - The role line becomes `<p class="ml-role">Cloud &amp; DevOps Engineer — AI-augmented infrastructure</p>`.
  - The credits line becomes `<p class="ml-credits">ServiceNow &nbsp;·&nbsp; NASA JPL &nbsp;·&nbsp; NBCUniversal</p>`.
  - In `.ml-nav-grid`, insert an AI card as the second item, between resume and blog:

```html
                    <a href="/resume.html#ai" class="ml-navcard">
                        <span class="ml-navcard-cmd">~/ai</span>
                        <span class="ml-navcard-desc">agents &amp; AI work</span>
                    </a>
```

  - Change the existing nav card hrefs to root-relative (`/resume.html`, `/blog/`, `/contact.html`).
  - Delete the CSS rule pair that makes the last card span two columns (lines 322–324). With 4 cards the 2×2 grid is even.
  - Give the stack tag container an id so JS can fill it: `<div class="ml-tags" id="ml-tags">`. Keep the existing static `<span>`s as no-JS fallback, but replace `AI/ML` with `Claude Code`.
  - After the `// stack` block, add:

```html
            <div id="ml-latest-wrap" hidden>
                <div class="ml-section-hdr">// latest</div>
                <div class="ml-contacts" id="ml-latest"></div>
            </div>
```

- [ ] **Step 7: Replace the simulated filesystem and add data loading.** Replace lines 472–531 (`const filesystem = {…};`) with:

```js
            const PT = window.ProfileText;
            let profile = null;
            let buildInfo = null;
            const UNAVAILABLE = 'profile unavailable — see /resume.html';

            const getJson = url => fetch(url, { cache: 'no-cache' })
                .then(r => (r.ok ? r.json() : null))
                .catch(() => null);

            const dataReady = Promise.all([getJson('/data/profile.json'), getJson('/data/build.json')])
                .then(([p, b]) => { profile = p; buildInfo = b; });

            function withProfile(term, fn) {
                term.pause();
                dataReady.then(() => {
                    term.resume();
                    if (!profile) { term.error(UNAVAILABLE); return; }
                    fn(profile);
                });
            }

            // Simulated filesystem — file contents are generated from data/profile.json
            const filesystem = {
                '/': { type: 'dir', content: ['about.txt', 'resume.md', 'contact.txt', 'blog', 'projects'] },
                '/blog': { type: 'dir', content: ['index.html'] },
                '/projects': { type: 'dir', content: [] },
                '/about.txt':   { type: 'file', get content() { return profile ? PT.aboutText(profile) : UNAVAILABLE; } },
                '/resume.md':   { type: 'file', get content() { return profile ? PT.resumeMarkdown(profile) : UNAVAILABLE; } },
                '/contact.txt': { type: 'file', get content() { return profile ? PT.contactText(profile) : UNAVAILABLE; } },
                '/blog/index.html': { type: 'file', content: '(web page — type "blog" to open)' },
            };
```

- [ ] **Step 8: Update `helpItems` and `manPages`.**
  - In `helpItems`, add `{ cmd: 'ai', desc: 'AI work & agent tooling.' }` after `about`, and `{ cmd: 'posts', desc: 'Latest blog posts.' }` after `neofetch`.
  - In `manPages`, add:

```js
                ai:      'ai - show AI work\n\nUsage: ai\n\nLists featured AI and agent-tooling work, with links.\nFull details: /resume.html#ai',
                posts:   'posts - list latest blog posts\n\nUsage: posts\n\nShows the three most recent Tech & AI posts with links.',
```

- [ ] **Step 9: Replace these command branches in the interpreter.**

The `about` branch (lines 729–731):

```js
                } else if (cmd === 'about') {
                    withProfile(term, p => term.echo(PT.escapeBrackets(PT.aboutText(p))));

                } else if (cmd === 'ai') {
                    withProfile(term, p => PT.aiLines(p).forEach(l => term.echo(l)));

                } else if (cmd === 'posts') {
                    term.pause();
                    getJson('/posts/index.json').then(data => {
                        term.resume();
                        const latest = PT.latestPosts(data, 3);
                        if (!latest.length) { term.error('posts: could not load posts — see /blog/'); return; }
                        term.echo('[[b;#00FF00;]Latest posts]');
                        latest.forEach(post => {
                            term.echo(`  [[;#008800;]${PT.escapeBrackets(post.date)}]  [[!;;;;/blog/${post.slug}/]${PT.escapeBrackets(post.title)}]`);
                        });
                        term.echo('  [[;#555;]all posts:] [[!;;;;/blog/]/blog/]');
                    });
```

In the `cat` branch (lines 683–687), escape plain-text files: `term.echo(PT.escapeBrackets(file.content));` in the non-`.md` path.

The `neofetch` branch: keep the `logo` array, and replace the `info` array (lines 765–778) with:

```js
                    withProfile(term, p => {
                        const info = PT.neofetchInfo(p, { host: window.location.hostname, uptime: getUptime() });
                        const rows = Math.max(logo.length, info.length);
                        for (let i = 0; i < rows; i++) {
                            const l = (logo[i] || '                   ');
                            const r = info[i] || '';
                            term.echo(`  [[b;#00FF00;]${l}]  ${r}`, { raw: true });
                        }
                    });
```

Delete the old `rows` loop that followed (lines 780–785).

The `skills` branch (lines 787–808):

```js
                } else if (cmd === 'skills') {
                    withProfile(term, p => PT.skillsLines(p).forEach(l => term.echo(l)));
```

The `social` branch: use `profile` when available, otherwise `siteConfig`. Leave it as-is, because `siteConfig` already holds the proton address and links.

The `git log` sub-branch (lines 954–958):

```js
                    if (sub === 'log') {
                        PT.gitLogLines(buildInfo).forEach(l => term.echo(l));
```

- [ ] **Step 10: Welcome message waits for data and adds shortcuts.**
  - In the terminal options, change `onInit` to:

```js
                onInit: function(term) {
                    term.pause();
                    dataReady.then(() => {
                        term.resume();
                        welcomeMessage(term);
                        term.focus(true);
                    });
                },
```

  - In `welcomeMessage`, replace the two lines after the banner (lines 1055–1056) with:

```js
                const headline = profile ? profile.headline : 'Cloud & DevOps Engineer';
                const tagline = profile ? profile.tagline : 'Cloud Native · Kubernetes · Terraform · Python · AI Agents';
                termInstance.echo(`  [[b;#00FF00;]Timothy Tippens] — ${PT.escapeBrackets(headline)}`);
                termInstance.echo(`  [[;#555;]${PT.escapeBrackets(tagline)}]`);
                termInstance.echo('');
                termInstance.echo('  <a href="/resume.html">resume</a> <span style="color:#335533">·</span> <a href="/resume.html#ai">ai</a> <span style="color:#335533">·</span> <a href="/blog/">blog</a> <span style="color:#335533">·</span> <a href="/contact.html">contact</a>', { raw: true });
```

- [ ] **Step 11: Fill the mobile landing from data.** Add this just before the `// Mobile landing — "open terminal" escape hatch` IIFE:

```js
            // Mobile landing — stack tags and latest posts from data
            dataReady.then(() => {
                if (profile && Array.isArray(profile.featuredSkills)) {
                    const tags = document.getElementById('ml-tags');
                    tags.textContent = '';
                    profile.featuredSkills.forEach(s => {
                        const span = document.createElement('span');
                        span.textContent = s;
                        tags.appendChild(span);
                    });
                }
            });
            getJson('/posts/index.json').then(data => {
                const latest = PT.latestPosts(data, 3);
                if (!latest.length) return;
                const list = document.getElementById('ml-latest');
                latest.forEach(post => {
                    const a = document.createElement('a');
                    a.className = 'ml-contact-row';
                    a.href = `/blog/${post.slug}/`;
                    const lbl = document.createElement('span');
                    lbl.className = 'ml-contact-lbl';
                    lbl.textContent = post.date.slice(0, 4);
                    const title = document.createElement('span');
                    title.textContent = post.title;
                    a.append(lbl, title);
                    list.appendChild(a);
                });
                document.getElementById('ml-latest-wrap').hidden = false;
            });
```

- [ ] **Step 12: Update `completion`'s `extraCmds`.** No change is needed, because `ai` and `posts` come from `helpItems`. Confirm `man` completion includes `ai` and `posts` (it uses `Object.keys(manPages)`).

- [ ] **Step 13: Run VERIFY.** Expected: PASS.

- [ ] **Step 14: Commit**

```bash
git add assets/js/profile-text.js test/profile-text.test.mjs index.html
git commit -m "terminal: profile-driven content, ai/posts commands, real git log, mobile latest posts"
```

**VERIFY:** `npm test && npm run check:js -- index.html && ! grep -q 'cdn.tailwindcss.com' index.html && ! grep -q 'SageMaker' index.html && grep -q "cmd === 'ai'" index.html && grep -q "cmd === 'posts'" index.html && grep -q 'profile-text.js' index.html`

---

### Task 7: Blog listing — sections, link cards, redirects

**Files:**
- Create: `assets/js/blog-filter.js`, `test/blog-filter.test.mjs`
- Modify: `blog/index.html`

**Interfaces:**
- Consumes: `posts/index.json` (deployed copy has published posts only) with `section`; post pages at `/blog/<slug>/` (Task 3/5).
- Produces: `assets/js/blog-filter.js`, available as `window.BlogFilter` in the browser and via `require` in Node:
  - `SECTIONS`
  - `parseListingParams(search: string): {section, tag}`
  - `tagsFor(posts, section): string[]`
  - `filterPosts(posts, {section, tag, query}): object[]`
  - `hashRedirect(hash: string, posts): string|null`

- [ ] **Step 1: Write failing tests `test/blog-filter.test.mjs`**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const BF = createRequire(import.meta.url)('../assets/js/blog-filter.js');
const posts = [
  { slug: 't1', title: 'Agents in Ops', date: '2026-09-01', excerpt: 'claude skills', content: 'body', tags: ['ai', 'devops'], section: 'tech', published: true },
  { slug: 't2', title: 'Terraform Tips', date: '2026-10-01', excerpt: 'iac', content: 'modules', tags: ['iac'], section: 'tech', published: true },
  { slug: 's1', title: 'Freedom', date: '2016-03-02', excerpt: 'poem', content: 'empty', tags: ['philosophy'], section: 'sheep', published: true },
  { slug: 'd1', title: 'Draft', date: '2026-10-05', excerpt: '', content: '', tags: ['ai'], section: 'tech', published: false },
];

test('parseListingParams defaults and validates', () => {
  assert.deepEqual(BF.parseListingParams(''), { section: 'tech', tag: 'all' });
  assert.deepEqual(BF.parseListingParams('?section=sheep&tag=philosophy'), { section: 'sheep', tag: 'philosophy' });
  assert.deepEqual(BF.parseListingParams('?section=bogus'), { section: 'tech', tag: 'all' });
});

test('filterPosts scopes to section, drops drafts, sorts newest first', () => {
  assert.deepEqual(BF.filterPosts(posts, { section: 'tech' }).map(p => p.slug), ['t2', 't1']);
  assert.deepEqual(BF.filterPosts(posts, { section: 'sheep' }).map(p => p.slug), ['s1']);
});

test('filterPosts by tag and case-insensitive query across fields', () => {
  assert.deepEqual(BF.filterPosts(posts, { section: 'tech', tag: 'ai' }).map(p => p.slug), ['t1']);
  assert.deepEqual(BF.filterPosts(posts, { section: 'tech', query: 'MODULES' }).map(p => p.slug), ['t2']);
  assert.deepEqual(BF.filterPosts(posts, { section: 'tech', query: 'devops' }).map(p => p.slug), ['t1']);
  assert.deepEqual(BF.filterPosts(posts, { section: 'tech', query: 'nothing-matches' }), []);
});

test('tagsFor only returns tags from published posts in the section', () => {
  assert.deepEqual(BF.tagsFor(posts, 'tech'), ['ai', 'devops', 'iac']);
  assert.deepEqual(BF.tagsFor(posts, 'sheep'), ['philosophy']);
});

test('hashRedirect maps legacy #slug links', () => {
  assert.equal(BF.hashRedirect('#s1', posts), '/blog/s1/');
  assert.equal(BF.hashRedirect('#d1', posts), null);
  assert.equal(BF.hashRedirect('#nope', posts), null);
  assert.equal(BF.hashRedirect('', posts), null);
});
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL.

- [ ] **Step 3: Create `assets/js/blog-filter.js`**

```js
/* Blog listing filtering helpers (window.BlogFilter; Node require in tests). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BlogFilter = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const SECTIONS = ['tech', 'sheep'];

  function parseListingParams(search) {
    const q = new URLSearchParams(search || '');
    const section = q.get('section');
    return { section: SECTIONS.includes(section) ? section : 'tech', tag: q.get('tag') || 'all' };
  }

  function inSection(posts, section) {
    return posts.filter(p => p.published === true && p.section === section);
  }

  function tagsFor(posts, section) {
    const tags = new Set();
    inSection(posts, section).forEach(p => (p.tags || []).forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }

  function filterPosts(posts, { section, tag = 'all', query = '' }) {
    const q = query.trim().toLowerCase();
    return inSection(posts, section)
      .filter(p => tag === 'all' || (p.tags || []).includes(tag))
      .filter(p => !q || [p.title, p.excerpt, p.content, ...(p.tags || [])]
        .some(f => String(f || '').toLowerCase().includes(q)))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function hashRedirect(hash, posts) {
    const slug = String(hash || '').replace(/^#/, '');
    if (!slug) return null;
    return posts.some(p => p.slug === slug && p.published === true) ? `/blog/${slug}/` : null;
  }

  return { SECTIONS, parseListingParams, tagsFor, filterPosts, hashRedirect };
});
```

- [ ] **Step 4: Run `npm test`.** Expected: PASS.

- [ ] **Step 5: Edit `blog/index.html` head.**
  - Remove the marked.js `<script>` (line 17).
  - Add `<link rel="alternate" type="application/rss+xml" title="tippens@portfolio — Tech &amp; AI" href="/feed.xml">`.
  - `og:url` → `https://justthetipp.com/blog/`.
  - `og:description` / `twitter:description` → `Writing on cloud infrastructure, DevOps and AI by Timothy Tippens — plus an archive of personal essays.`
  - In CSS, delete the now-unused `.post-full`, `.md-content*`, `.close-post` and `.read-btn*` rules, including their mobile overrides.
  - Add:

```css
        .post-card { text-decoration: none; color: inherit; }
        .section-tabs { display: flex; gap: 0; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border); }
        .section-tab {
            background: none; border: none; border-bottom: 2px solid transparent;
            color: var(--text-dim); font-family: var(--font-mono); font-size: 0.82rem;
            padding: 0.55rem 1rem; cursor: pointer; margin-bottom: -1px;
        }
        .section-tab:hover { color: var(--green); }
        .section-tab.active { color: var(--green); border-bottom-color: var(--green); }
        .section-sub { font-size: 0.75rem; color: var(--text-dim); margin: -0.5rem 0 1.25rem; }
        .rss-link { color: var(--cyan); font-size: 0.75rem; text-decoration: none; margin-left: 0.75rem; }
        .rss-link:hover { text-decoration: underline; }
        .card-footer { padding: 0.6rem 1.1rem 0.8rem; border-top: 1px solid var(--border); margin-top: auto; display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-dim); }
        .post-card:hover .read-more { color: var(--green); }
        .no-results a { color: var(--cyan); }
        @media (max-width: 600px) { .section-tab { flex: 1; min-height: 40px; } }
```

- [ ] **Step 6: Replace `blog/index.html` nav and header/controls markup (lines 420–449)** with:

```html
<nav class="site-nav">
    <div class="brand">tippens@portfolio<span>:/blog</span>$</div>
    <ul class="nav-links">
        <li><a href="/">~/terminal</a></li>
        <li><a href="/resume.html">~/resume</a></li>
        <li><a href="/resume.html#ai">~/ai</a></li>
        <li><a href="/blog/" class="active">~/blog</a></li>
        <li><a href="/contact.html">~/contact</a></li>
    </ul>
</nav>

<div class="page-wrap">
    <header class="blog-header">
        <h1>Writing <span>// blog</span></h1>
        <p>Notes on cloud infrastructure, DevOps and AI — plus an archive of personal essays.
            <a class="rss-link" href="/feed.xml">rss</a></p>
    </header>

    <div class="section-tabs" role="tablist">
        <button class="section-tab" role="tab" data-section="tech">Tech &amp; AI</button>
        <button class="section-tab" role="tab" data-section="sheep">Learning to Count Sheep</button>
    </div>
    <p class="section-sub" id="section-sub"></p>

    <div class="controls">
        <div class="search-wrap">
            <input type="text" class="search-input" id="search" placeholder="search posts..." autocomplete="off" spellcheck="false">
        </div>
        <div class="tag-filters" id="tag-filters"></div>
    </div>

    <div class="post-count" id="post-count"></div>

    <div id="posts-container">
        <div class="status-msg"><span class="blink">_</span> loading posts...</div>
    </div>
</div>
```

- [ ] **Step 7: Replace the inline `<script>` (lines 454–658)** with:

```html
<script src="/assets/js/blog-filter.js"></script>
<script>
    const SUBTITLES = {
        tech: 'Cloud, DevOps and AI — what I\'m building and learning.',
        sheep: 'Personal essays, 2013–2016.',
    };

    let allPosts = [];
    let state = { ...BlogFilter.parseListingParams(location.search), query: '' };

    function formatDate(iso) {
        const [y, m, d] = iso.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function syncUrl() {
        const q = new URLSearchParams();
        q.set('section', state.section);
        if (state.tag !== 'all') q.set('tag', state.tag);
        history.replaceState(null, '', `${location.pathname}?${q}`);
    }

    function renderTabs() {
        document.querySelectorAll('.section-tab').forEach(btn => {
            const active = btn.dataset.section === state.section;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', String(active));
        });
        document.getElementById('section-sub').textContent = SUBTITLES[state.section];
    }

    function renderTags() {
        const container = document.getElementById('tag-filters');
        container.textContent = '';
        const tags = BlogFilter.tagsFor(allPosts, state.section);
        if (state.tag !== 'all' && !tags.includes(state.tag)) state.tag = 'all';
        ['all', ...tags].forEach(tag => {
            const btn = el('button', 'tag-btn' + (tag === state.tag ? ' active' : ''), '#' + tag);
            btn.addEventListener('click', () => { state.tag = tag; syncUrl(); renderTags(); renderPosts(); });
            container.appendChild(btn);
        });
    }

    function createCard(post) {
        const card = el('a', 'post-card');
        card.href = `/blog/${post.slug}/`;
        const header = el('div', 'card-header');
        header.appendChild(el('div', 'card-meta')).appendChild(el('span', 'post-date', formatDate(post.date)));
        const tags = header.appendChild(el('div', 'post-tags'));
        tags.style.marginBottom = '0.5rem';
        (post.tags || []).forEach(t => tags.appendChild(el('span', 'post-tag', '#' + t)));
        header.appendChild(el('h2', 'post-title', post.title));
        header.appendChild(el('p', 'post-excerpt', post.excerpt));
        const footer = el('div', 'card-footer');
        footer.appendChild(el('span', 'read-more', '[ read ]'));
        footer.appendChild(el('span', '', `${(post.content || '').split(/\s+/).filter(Boolean).length} words`));
        card.append(header, footer);
        return card;
    }

    function renderPosts() {
        const filtered = BlogFilter.filterPosts(allPosts, state);
        const container = document.getElementById('posts-container');
        document.getElementById('post-count').textContent = `${filtered.length} post${filtered.length !== 1 ? 's' : ''} found`;
        container.textContent = '';
        const grid = el('div', 'posts-grid');
        if (filtered.length === 0) {
            const empty = el('div', 'no-results');
            const sectionEmpty = BlogFilter.filterPosts(allPosts, { section: state.section }).length === 0;
            if (sectionEmpty && state.section === 'tech') {
                empty.append('first post coming soon — meanwhile, ');
                const a = el('a', '', 'browse the archive');
                a.href = '?section=sheep';
                empty.appendChild(a);
            } else {
                empty.textContent = 'no posts match your query. try a different search or tag.';
            }
            grid.appendChild(empty);
        } else {
            filtered.forEach(post => grid.appendChild(createCard(post)));
        }
        container.appendChild(grid);
    }

    document.querySelectorAll('.section-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            state.section = btn.dataset.section;
            state.tag = 'all';
            syncUrl(); renderTabs(); renderTags(); renderPosts();
        });
    });

    let searchTimer;
    document.getElementById('search').addEventListener('input', e => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => { state.query = e.target.value; renderPosts(); }, 200);
    });

    const backTop = document.getElementById('back-top');
    window.addEventListener('scroll', () => backTop.classList.toggle('visible', window.scrollY > 400));

    (async () => {
        try {
            const res = await fetch('/posts/index.json', { cache: 'no-cache' });
            if (!res.ok) throw new Error(res.status);
            allPosts = (await res.json()).posts || [];
        } catch (e) {
            document.getElementById('posts-container').innerHTML =
                '<div class="status-msg">error loading posts. check back soon.</div>';
            return;
        }
        const redirect = BlogFilter.hashRedirect(location.hash, allPosts);
        if (redirect) { location.replace(redirect); return; }
        renderTabs(); renderTags(); renderPosts();
    })();
</script>
```

- [ ] **Step 8: Run VERIFY.** Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add assets/js/blog-filter.js test/blog-filter.test.mjs blog/index.html
git commit -m "blog: section tabs, link cards to post pages, legacy hash redirects"
```

**VERIFY:** `npm test && npm run check:js -- blog/index.html && ! grep -q 'raw.githubusercontent.com' blog/index.html && ! grep -q 'marked.min.js' blog/index.html && grep -q 'blog-filter.js' blog/index.html`

---

### Task 8: Admin — section field, shared validation, view links

**Files:**
- Modify: `admin/index.html`

**Interfaces:**
- Consumes: `window.PostRules` from `/assets/js/post-rules.js` (Task 2): `validatePosts({posts})`, `SECTION_LABELS`.
- Produces: posts saved with a `section` field.

- [ ] **Step 1: Allow same-origin scripts in CSP.** In the CSP meta (line 16), change `script-src 'unsafe-inline' https://unpkg.com;` to `script-src 'self' 'unsafe-inline' https://unpkg.com;`. After the EasyMDE `<script>` (line 32), add `<script src="/assets/js/post-rules.js"></script>`.

- [ ] **Step 2: Add the section select.** In the metadata sidebar, after the Date form-group (line 465), add:

```html
                        <div class="form-group">
                            <label for="post-section">Section</label>
                            <select id="post-section">
                                <option value="tech">Tech &amp; AI</option>
                                <option value="sheep">Learning to Count Sheep</option>
                            </select>
                        </div>
```

- [ ] **Step 3: Set the section in `startNewPost` and `editPost`.**
  - In `startNewPost()`, add `document.getElementById('post-section').value = 'tech';`.
  - In `editPost(slug)`, add `document.getElementById('post-section').value = post.section || 'tech';`.

- [ ] **Step 4: Validate before committing.** In `savePost()`:
  - Read `const section = document.getElementById('post-section').value;`.
  - Build the post as `const post = { slug, title, date, excerpt: finalExcerpt, tags, content, published, section };`.
  - Replace everything from `if (editingSlug) {` through the `allPosts.unshift(post); }` block (lines 824–838) with:

```js
        const candidate = editingSlug
            ? allPosts.map(p => (p.slug === editingSlug ? post : p))
            : [post, ...allPosts];
        if (editingSlug && !allPosts.some(p => p.slug === editingSlug)) candidate.unshift(post);

        const errors = PostRules.validatePosts({ posts: candidate });
        if (errors.length) {
            toast(errors[0].replace(/^post\[\d+\] /, ''), 'error');
            return;
        }
        const previous = allPosts;
        allPosts = candidate;
```

  - Replace the remainder of `savePost()` (from `const action = …` to the end of the function) with:

```js
        const action = editingSlug ? 'Update' : 'Add';
        const ok = await savePosts(`Blog: ${action} "${title}"`);
        if (!ok) { allPosts = previous; return; }

        toast(post.published
            ? `Saved. Live at /blog/${slug}/ in ~2 min.`
            : 'Draft saved (not published).', 'success');
        editingSlug = null;
        renderPostList();
        showView('list');
    }
```

  - Fix the excerpt fallback so it can't crash on content with no plain-text line. Replace line 820 with:

```js
        const firstLine = content.replace(/[#*`>\[\]]/g, '').split('\n').find(l => l.trim()) || title;
        const finalExcerpt = excerpt || firstLine.trim().substring(0, 180) + (firstLine.length > 180 ? '...' : '');
```

- [ ] **Step 5: Show the section and a view link in the post list.** In `renderPostList()`:
  - Change the meta text to ``metaEl.textContent = `${post.date || ''} · ${PostRules.SECTION_LABELS[post.section] || 'no section'} · ${tagsText}`;``.
  - Before `actions.appendChild(editBtn);`, add:

```js
            if (post.published) {
                const viewLink = document.createElement('a');
                viewLink.className = 'btn btn-sm';
                viewLink.href = `/blog/${post.slug}/`;
                viewLink.target = '_blank';
                viewLink.rel = 'noopener';
                viewLink.textContent = 'view';
                actions.appendChild(viewLink);
            }
```

  Add `a.btn { text-decoration: none; }` to the CSS.

- [ ] **Step 6: Update the deployment sidebar note** (lines 489–492) to: `Saving commits posts/index.json to GitHub. The site rebuilds and deploys in ~2 minutes — each post gets its own page at /blog/&lt;slug&gt;/. Drafts are never published.`

- [ ] **Step 7: Run VERIFY.** Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add admin/index.html
git commit -m "admin: section field, shared post validation, view links"
```

**VERIFY:** `npm run check:js -- admin/index.html && grep -q "script-src 'self'" admin/index.html && grep -q '/assets/js/post-rules.js' admin/index.html && grep -q 'id="post-section"' admin/index.html && grep -q 'PostRules.validatePosts' admin/index.html`

---

### Task 9: Contact and 404 — shared nav and copy

**Files:**
- Modify: `contact.html`, `404.html`

**Interfaces:**
- Consumes: shared nav order from Global Constraints.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Update `contact.html`.**
  - Replace the nav `<ul class="nav-links">` (lines 163–168) with:

```html
    <ul class="nav-links">
        <li><a href="/">~/terminal</a></li>
        <li><a href="/resume.html">~/resume</a></li>
        <li><a href="/resume.html#ai">~/ai</a></li>
        <li><a href="/blog/">~/blog</a></li>
        <li><a href="/contact.html" class="active">~/contact</a></li>
    </ul>
```

  - Add `flex-wrap: wrap;` to `.nav-links`.
  - Footer text (lines 198–199) becomes `Cloud &amp; DevOps Engineer — 16+ years building mission-critical<br>infrastructure, now with AI agents in the loop.`
  - `og:description` → `Get in touch — Cloud & DevOps Engineer building AI-augmented infrastructure. Open to opportunities and collaboration.`
  - `twitter:description` → `Cloud & DevOps Engineer — AI-augmented infrastructure. Open to opportunities and collaboration.`

- [ ] **Step 2: Update `404.html` links** (lines 122–125):

```html
        <a href="/">~/terminal</a>
        <a href="/resume.html">~/resume</a>
        <a href="/resume.html#ai">~/ai</a>
        <a href="/blog/">~/blog</a>
        <a href="/contact.html">~/contact</a>
```

- [ ] **Step 3: Run VERIFY.** Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add contact.html 404.html
git commit -m "contact, 404: shared nav with ~/ai, updated copy"
```

**VERIFY:** `npm run check:js -- contact.html 404.html && grep -q 'href="/resume.html#ai"' contact.html && grep -q 'href="/resume.html#ai"' 404.html && ! grep -q '10+ years' contact.html`

---

### Task 10: Final verification (orchestrator, not an implementer)

- [ ] `npm ci && npm test && npm run build`. All pass.
- [ ] `grep -rn "10+ years\|2017 – Present\|SageMaker\|cdn.tailwindcss" --include=*.html . | grep -v node_modules | grep -v _site` returns nothing.
- [ ] `npx serve _site`, then in a browser:
  - **Terminal:** `about`, `skills`, `ai`, `posts`, `neofetch`, `git log`, `cat about.txt`.
  - **Mobile landing** at 390px width shows the `~/ai` card, featured skills and the latest list.
  - **Resume:**
    - the AI section renders
    - clicking `Digital.ai` filters to the JPL/CI lines only, or shows none, without errors
    - roles expand and collapse
    - the print preview expands everything
  - **Blog:**
    - the Tech tab shows the "coming soon" empty state
    - the Sheep tab lists 16 posts
    - `/blog/#freedom` redirects to `/blog/freedom/`
    - a post page shows prev/next and its OG tags in the source
  - **Feeds:** `/feed.xml` and `/sitemap.xml` load.
  - **Admin:** the section dropdown is present (don't save).
- [ ] Hand off to the owner for review. Merging `site-refresh` into `terminal` is the owner's call.
