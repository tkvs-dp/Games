import { chromium } from '../../Zoo/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1200,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const state=()=>page.evaluate(()=>document.querySelector('#platform-game').getGameState());
try{
await page.goto('http://127.0.0.1:5181/');await page.locator('#challenge').scrollIntoViewIfNeeded();await page.locator('.pg-primary').click();await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);assert((await state()).player.x>110);await page.keyboard.press('Space');await page.waitForTimeout(160);assert((await state()).player.y<380);await page.keyboard.press('Space');await page.waitForTimeout(80);assert.equal((await state()).player.jumps,2);await page.keyboard.press('Shift');assert((await state()).player.dashCooldown>0);await page.keyboard.up('ArrowRight');await page.keyboard.press('p');assert.equal((await state()).status,'paused');const t=(await state()).simulationTime;await page.waitForTimeout(200);assert.equal((await state()).simulationTime,t);await page.locator('.pg-primary').click();
await page.locator('.pg-restart').click();
// Traverse using only keyboard input and observed position. Jump before each ground hazard.
const triggers=[300,475,785,950,1310,1460,1805,1980,2260];let next=0;await page.keyboard.down('ArrowRight');
for(let n=0;n<420;n++){
 const s=await state();if(s.status==='won')break;assert.equal(s.status,'running',JSON.stringify(s));
 if(next<triggers.length&&s.player.x>=triggers[next]){await page.keyboard.press('Space');next++;}
 await page.waitForTimeout(40);
}
await page.keyboard.up('ArrowRight');console.log('TRAVERSAL',JSON.stringify(await state()));assert.equal((await state()).status,'won');assert.equal((await state()).checkpoint,2);
await page.locator('.pg-primary').click();for(let life=2;life>=0;life--){await page.keyboard.down('ArrowRight');await page.waitForFunction(l=>document.querySelector('#platform-game').getGameState().lives===l,life,{timeout:7000});await page.keyboard.up('ArrowRight');}assert.equal((await state()).status,'gameover');await page.locator('.pg-primary').click();assert.equal((await state()).lives,3);
await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await state()).status,'paused');
await page.setViewportSize({width:390,height:844});await page.locator('#platform-game').scrollIntoViewIfNeeded();await page.locator('.pg-primary').click();
const right=await page.locator('[data-action=right]').boundingBox(),jump=await page.locator('[data-action=jump]').boundingBox();const cdp=await page.context().newCDPSession(page);const a={x:right.x+right.width/2,y:right.y+right.height/2,id:1},b={x:jump.x+jump.width/2,y:jump.y+jump.height/2,id:2};
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});await page.waitForTimeout(150);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a,b]});await page.waitForTimeout(160);assert((await state()).player.y<380);assert((await state()).player.x>100);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(350);assert(Math.abs((await state()).player.vx)<6);await page.locator('#challenge').screenshot({path:'tests/artifacts/platformer-mobile-playing.png'});
assert.deepEqual(errors,[]);console.log('PASS movement, double jump, dash, pause, full traversal, checkpoints, damage, gameover, replay, blur, simultaneous touch and release');
}finally{await browser.close()}
