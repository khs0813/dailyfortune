import { readFile } from 'node:fs/promises';
const signs=JSON.parse(await readFile(new URL('../src/data/signs.json',import.meta.url),'utf8'));
const content=JSON.parse(await readFile(new URL('../src/data/fortune-content.json',import.meta.url),'utf8'));
const errors=[]; const keys=new Set();
if(signs.filter(x=>x.type==='zodiac').length!==12)errors.push('Need 12 zodiac signs');
if(signs.filter(x=>x.type==='horoscope').length!==12)errors.push('Need 12 horoscope signs');
for(const sign of signs){const key=`${sign.type}:${sign.slug}`;if(keys.has(key))errors.push(`Duplicate ${key}`);keys.add(key);for(const field of ['name','emoji','period','summary','strength','caution','relationship','work','money','condition'])if(!sign[field])errors.push(`${key} missing ${field}`);if(!Array.isArray(sign.keywords)||sign.keywords.length<3)errors.push(`${key} needs keywords`)}
for(const bank of ['overall','relationship','work','money','condition','action','caution','keywords','colors','times'])if(!Array.isArray(content[bank])||content[bank].length<8)errors.push(`Bank ${bank} is too small`);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log(`Validated ${signs.length} signs and ${Object.keys(content).length} content banks`);
