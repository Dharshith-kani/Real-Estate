const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname,'..');
let count = 0;
function check(directory) {
  for (const item of fs.readdirSync(directory, {withFileTypes:true})) {
    const file = path.join(directory,item.name);
    if (item.isDirectory()) check(file);
    else if (item.name.endsWith('.js')) {
      execFileSync(process.execPath, ['--check',file]);
      for (const match of fs.readFileSync(file,'utf8').matchAll(/from\s+["'](\.[^"']+)["']/g)) {
        if (!fs.existsSync(path.resolve(path.dirname(file),match[1]))) throw new Error(`Missing import: ${match[1]}`);
      }
      count++;
    }
  }
}
check(path.join(root,'assets','js'));
console.log(`${count} JavaScript modules passed syntax and import checks.`);
