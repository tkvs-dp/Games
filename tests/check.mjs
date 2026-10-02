import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require('../../Zoo/node_modules/playwright'));}
const artifacts=new URL('./artifacts/',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1');
await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true});const checks=[],errors=[];
try{
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.TEST_URL||'http://127.0.0.1:5181/',{waitUntil:'networkidle'});
await page.waitForFunction(()=>typeof document.querySelector('#platform-game').getGameState==='function');
for(const width of [320,390,768,1440]){
 await page.setViewportSize({width,height:1000});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);
 const layout=await page.evaluate(()=>{const a=document.querySelector('#notes').getBoundingClientRect(),b=document.querySelector('#challenge').getBoundingClientRect();return {below:b.top>=a.bottom,width:b.width,notesWidth:a.width};});
 assert(layout.below);assert(Math.abs(layout.width-layout.notesWidth)<2);
}
checks.push('320/390/768/1440px: full-width game below notes; no horizontal overflow');
for(let i=0;i<5;i++){await page.locator('.cartridge').nth(i).click();assert.equal(await page.locator('.note-block').count(),4);}
await page.locator('.cartridge').first().click();
await page.locator('#challenge').scrollIntoViewIfNeeded();await page.waitForTimeout(250);
await page.screenshot({path:artifacts+'platformer-desktop.png',fullPage:true});
await page.locator('#challenge').screenshot({path:artifacts+'platformer-section.png'});
await page.setViewportSize({width:390,height:844});await page.locator('#challenge').scrollIntoViewIfNeeded();await page.screenshot({path:artifacts+'platformer-mobile.png',fullPage:true});
assert.equal(await page.locator('#mini-game').count(),0);assert.equal(await page.locator('#platform-game canvas').count(),1);
await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
assert.deepEqual(errors,[]);checks.push('Five collection entries, canvas renders, reduced motion, no JavaScript errors');
await writeFile(artifacts+'report.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
