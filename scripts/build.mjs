import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProfile, validatePosts } from './lib/validate.mjs';
import { publishedPosts, neighbors, renderPostPage, renderFeed, renderSitemap } from './lib/posts.mjs';
import { jsonLdScript, personJsonLd } from './lib/seo.mjs';
import { renderResumeBlocks, injectBlocks } from './lib/resume.mjs';

// Everything deployed must be listed here. index.html, resume.html and posts/index.json are written separately.
export const COPY_ALLOWLIST = [
  'contact.html', '404.html', 'robots.txt', 'CNAME',
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
  const jsonld = { jsonld: jsonLdScript(personJsonLd(profile)) };
  const home = await readFile(path.join(root, 'index.html'), 'utf8');
  await write(out, 'index.html', injectBlocks(home, jsonld));
  await write(out, 'resume.html', injectBlocks(injectBlocks(resume, renderResumeBlocks(profile)), jsonld));

  const published = publishedPosts(postsData.posts);
  for (const post of published) {
    await write(out, `blog/${post.slug}/index.html`, renderPostPage(post, neighbors(published, post), { authorName: profile.name }));
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
