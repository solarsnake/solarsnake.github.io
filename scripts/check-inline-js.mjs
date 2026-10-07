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
