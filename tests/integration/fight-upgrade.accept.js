// Headless acceptance harness for design/gdd/fight-upgrade.md, sections 3.1-3.7.
// Usage: node fight_accept.js    (modelled on shot_repo.js; exposes game globals via window.__T)
const fs=require('fs'),{chromium}=require('playwright');const REPO='/home/claude/rosie-vs-the-hose-2';
const HOOK=`window.__T={R,J,Hot,Lass,rope,tryBite,tryDash,doBite,startBooga,endBooga,freeLass,lassTap,burn,hurt,moveWeak,
 get state(){return state},get level(){return level},set level(v){level=v},get power(){return power},set power(v){power=v},
 get hoseHP(){return hoseHP},set hoseHP(v){hoseHP=v},get booga(){return booga},get weak(){return weak},set weak(v){weak=v},
 get attacks(){return attacks},set attacks(v){attacks=v},get score(){return score},get dmgTaken(){return dmgTaken},
 get calls(){return renderer.info.render.calls},get tris(){return renderer.info.render.triangles},get elapsed(){return elapsed},
 atkMult,leapsFor,unitDmg,
 K:{N,DZ,POWER_MAX,LASSO_TAPS,LASSO_MAX,LASSO_TICK,LASSO_TOSS,DASH_MAX,DASH_REGEN,HOT_WARN,HOT_DMG,LASSO_R,BITE_W,WIND_GRANT,WHIFF_COST}};
requestAnimationFrame(frame);
})();`;
const res=[];const ok=(n,c,d='')=>{res.push([c?'PASS':'FAIL',n,d]);console.log((c?'PASS  ':'FAIL  ')+n+(d?'  ['+d+']':''));};
const near=(a,b,e)=>Math.abs(a-b)<=e;
(async()=>{
let h=fs.readFileSync(REPO+'/src/index.html','utf8');
h=h.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','file://'+__dirname+'/node_modules/three/build/three.min.js');
h=h.replace("requestAnimationFrame(frame);\n})();",HOOK);
fs.writeFileSync(__dirname+'/accept_test.html',h);
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|Failed to load resource/.test(m.text()))errs.push(m.text().slice(0,160));});
await p.goto('file://'+__dirname+'/accept_test.html');await p.waitForTimeout(1500);
await p.click('#playBtn');await p.waitForTimeout(600);
const E=f=>p.evaluate(f);const W=ms=>p.waitForTimeout(ms);
const calm=()=>E(()=>{const T=window.__T;T.attacks=[];T.R.hp=100;T.R.iframe=0;T.Hot.ph='off';T.Hot.cd=999;T.Lass.ph='off';T.Lass.cd=999;T.R.held=false;});
const nurse=setInterval(()=>{},1e6);

/* ---- 11/3.3: the window no longer extends itself; damage weights 1 : 1.4 : 2.4 ---- */
await calm();
const bite=await E(()=>{const T=window.__T;T.level=5;T.J.hits=0;T.J.winded=5;const o=[];
  for(let s=1;s<=3;s++){const h0=T.hoseHP;T.doBite(T.weak);o.push({dmg:h0-T.hoseHP,win:T.J.winded});}
  return {o,unit:100/(28+4*5)};});
ok('AC11 bite window never extends itself (grant 0.42 then 0.30, never max())',
   near(bite.o[0].win,.42,.001)&&near(bite.o[1].win,.30,.001)&&bite.o[2].win===0,
   'winded after each bite: '+bite.o.map(x=>x.win.toFixed(3)).join(' / ')+' (pre-set to 5)');
ok('AC11 hose damage ratio 1 : 1.4 : 2.4',
   near(bite.o[0].dmg,bite.unit,.01)&&near(bite.o[1].dmg,bite.unit*1.4,.01)&&near(bite.o[2].dmg,bite.unit*2.4,.01),
   bite.o.map(x=>x.dmg.toFixed(3)).join(' / ')+'  unit='+bite.unit.toFixed(3));
/* ---- 12: whiffing during a window shortens it by 0.25 s ---- */
const wh=await E(()=>{const T=window.__T;T.R.recover=0;T.R.chomp=0;T.R.dash=0;T.J.winded=1;T.R.x=120;T.R.y=1100;
  T.tryBite();return T.J.winded;});
ok('AC12 whiff during a window costs 0.25 s',near(wh,.75,.02),'1.00 -> '+wh.toFixed(3));

/* ---- 13/3.4: dash charges run out and refill ---- */
await calm();
const ds=await E(()=>{const T=window.__T;T.R.stam=3;T.R.stamT=0;T.R.recover=0;const o=[];
  for(let i=0;i<4;i++){T.R.dashCd=0;T.R.recover=0;o.push(T.tryDash());}return {o,stam:T.R.stam};});
ok('AC13 three dashes empty the pips, the fourth does nothing',
   ds.o[0]&&ds.o[1]&&ds.o[2]&&ds.o[3]===false&&ds.stam===0,'results '+ds.o.join(',')+' stam='+ds.stam);
const rf=await E(()=>{const T=window.__T;T.R.stam=0;T.R.stamT=0;T.R.iframe=0;T.R.dashT=.3;T.R.perfect=false;const hp=T.R.hp;
  T.hurt(14,0,0);return {stam:T.R.stam,hp:T.R.hp===hp};});
ok('AC13 a Perfect Dodge refunds one charge immediately',rf.stam===1&&rf.hp,'stam 0 -> '+rf.stam);
const e0=await E(()=>{const T=window.__T;T.R.stam=0;T.R.stamT=0;return T.elapsed;});
let rg=0,rgE=0;for(let i=0;i<120;i++){await W(150);const r=await E(()=>({s:window.__T.R.stam,e:window.__T.elapsed}));rg=r.s;rgE=r.e-e0;if(rg>=1)break;}
ok('3.4 charges regenerate, 1 per 1.6 s of game time',rg>=1&&rgE>=1.5&&rgE<2.2,'stam='+rg+' after '+rgE.toFixed(2)+' s of game time');

/* ---- 14/3.5: full power does not auto-fire; the input does ---- */
await calm();
await E(()=>{const T=window.__T;T.power=T.K.POWER_MAX;});await W(900);
const auto=await E(()=>({booga:window.__T.booga,dis:document.getElementById('boogaBtn').disabled,chip:!document.getElementById('boogaChip').hidden,lbl:document.getElementById('powLbl').textContent}));
ok('AC14 10 power does NOT start BOOGA by itself',auto.booga===0,'booga='+auto.booga);
ok('AC14 HUD banks it: BOOGA READY chip + label, button enabled',auto.chip&&auto.dis===false&&auto.lbl==='BOOGA READY',JSON.stringify(auto));
await p.keyboard.press('b');await W(400);
const fired=await E(()=>window.__T.booga);
ok('AC14 the B key starts BOOGA when banked',fired===1,'booga='+fired);
// end BOOGA so later tests are not time-dilated or damage-halved
await E(()=>{const T=window.__T;T.endBooga();T.power=0;T.R.hp=100;});await W(500);await calm();
await E(()=>{window.__T.power=3;});await W(250);
const inert2=await E(()=>({dis:document.getElementById('boogaBtn').disabled,b:window.__T.booga}));
await p.click('#boogaBtn',{force:true}).catch(()=>{});await W(400);
ok('AC14/5.10 the touch button is inert below 10 power',inert2.dis===true&&(await E(()=>window.__T.booga))===0,'disabled='+inert2.dis);

/* ---- 1-4 / 3.1: the hot band ---- */
await calm();
await E(()=>{const T=window.__T;T.level=3;T.Hot.cd=0;T.Hot.ph='off';});
let hotSeen=await E(()=>window.__T.Hot.ph);let tries=0;
while(hotSeen==='off'&&tries++<20){await W(100);hotSeen=await E(()=>window.__T.Hot.ph);}
ok('AC1 a band warns before it can burn (phase "warn" reached)',hotSeen==='warn'||hotSeen==='hot','phase='+hotSeen);
// stand in the amber band: zero damage
const amber=await E(()=>{const T=window.__T;const p0=T.rope[T.Hot.c];T.R.x=p0.x;T.R.y=p0.y;T.R.hp=100;T.R.iframe=0;T.attacks=[];return {ph:T.Hot.ph,hp:T.R.hp};});
let amberHp=100;for(let i=0;i<6;i++){await W(90);const r=await E(()=>{const T=window.__T;const p0=T.rope[T.Hot.c];T.R.x=p0.x;T.R.y=p0.y;T.attacks=[];return {ph:T.Hot.ph,hp:T.R.hp};});if(r.ph!=='warn')break;amberHp=r.hp;}
ok('AC1 standing in the amber warning band deals 0 damage',amberHp===100,'hp='+amberHp+' (started warn='+amber.ph+')');
// stand in the live band: one hit, then iframes
let hotHp=[];for(let i=0;i<26;i++){const r=await E(()=>{const T=window.__T;const p0=T.rope[T.Hot.c];T.R.x=p0.x;T.R.y=p0.y;T.attacks=[];return {ph:T.Hot.ph,hp:T.R.hp,f:T.R.iframe};});hotHp.push(r);if(r.ph==='cool'||r.ph==='off')break;await W(110);}
const live=hotHp.filter(r=>r.ph==='hot');const drop=live.length?100-live[live.length-1].hp:0;
ok('AC2 standing in the live band burns once per invulnerability second',live.length>0&&drop>=9.9&&drop<=21,
   'hp 100 -> '+(live.length?live[live.length-1].hp.toFixed(1):'n/a')+' across '+live.length+' samples in contact; phases '+hotHp.map(r=>r.ph).join(','));
// AC3: dashing through the band burns and gives no Perfect Dodge / no refund
const dz=await E(()=>{const T=window.__T;T.R.hp=100;T.R.iframe=0;T.R.stam=1;T.R.dashT=.3;T.R.perfect=false;
  T.burn(T.K.HOT_DMG,1,0);return {hp:T.R.hp,stam:T.R.stam,perfect:T.R.perfect};});
ok('AC3 dashing through a hot band damages, with no PERFECT DODGE and no refund',
   dz.hp<100&&dz.stam===1&&dz.perfect===false,'hp='+dz.hp.toFixed(1)+' stam='+dz.stam+' perfect='+dz.perfect);
// AC4: 10 consecutive activations never put the band on the weak spot
const sel=await E(async()=>{const T=window.__T;const out=[];
  for(let n=0;n<10;n++){T.Hot.ph='off';T.Hot.cd=0;T.moveWeak();
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    out.push({c:T.Hot.c,w:T.Hot.w,weak:T.weak,gap:Math.abs(T.Hot.c-T.weak)});}
  return out;});
ok('AC4 10 activations: the weak spot is never inside the band',sel.every(s=>s.gap>=s.w+6),
   'min gap '+Math.min(...sel.map(s=>s.gap))+' segments, band half-width '+sel[0].w);
const forced=await E(async()=>{const T=window.__T;T.Hot.ph='hot';T.Hot.t=0;T.Hot.len=9;T.weak=T.Hot.c;
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return T.Hot.ph;});
ok('AC4 forcing the weak spot into a live band cools it that frame',forced==='cool','phase='+forced);

/* ---- 5-10 / 3.2: the lasso ---- */
await calm();
await E(()=>{const T=window.__T;T.level=4;T.R.hp=100;T.R.x=600;T.R.y=700;T.R.vx=0;T.R.vy=0;
  T.Lass.mercy=0;T.Lass.sinceWin=1;T.Lass.cd=0;T.J.winded=0;T.attacks=[];});
const grabWait=async(ms)=>{let w=0;while(w<ms){await W(80);w+=80;const st=await E(()=>{const T=window.__T;T.attacks=T.attacks.filter(a=>a.src!=='head'&&a.src!=='human');T.R.vx=0;T.R.vy=0;return T.Lass.ph;});if(st==='held')return true;}return false;};
const g1=await grabWait(4000);
ok('AC5 a telegraphed grab fires and catches a stationary dog',g1,'Lass.ph='+(await E(()=>window.__T.Lass.ph)));
if(g1){
  const x0=await E(()=>window.__T.R.x);
  await p.keyboard.down('ArrowRight');await W(450);await p.keyboard.up('ArrowRight');
  const held=await E(()=>({x:window.__T.R.x,atk:window.__T.attacks.filter(a=>a.src==='head'||a.src==='human').length,ph:window.__T.Lass.ph}));
  ok('AC6 while held, input moves nothing and the hose spawns no other attack',
     Math.abs(held.x-x0)<2&&held.atk===0,'dx='+(held.x-x0).toFixed(2)+'px, other attacks='+held.atk);
  const taps=await E(()=>{const T=window.__T;const out=[];for(let i=0;i<T.K.LASSO_TAPS;i++){T.tryBite();out.push(T.Lass.ph);}return {out,held:T.R.held,hp:T.R.hp};});
  ok('AC6 six Bite presses free Rosie',taps.out[5]==='off'&&taps.held===false,'phases '+taps.out.join(','));
  ok('AC8 mashing from the instant of capture takes 0 damage',taps.hp===100,'hp='+taps.hp.toFixed(1));
  // AC9: no chain grab - mercy + "a weak-spot window must happen first"
  const chain=await E(()=>{const T=window.__T;return {mercy:T.Lass.mercy,since:T.Lass.sinceWin,cd:T.Lass.cd};});
  const chain2=await E(async()=>{const T=window.__T;let grabs=0;
    for(let n=0;n<20;n++){T.Lass.cd=0;await new Promise(r=>requestAnimationFrame(r));if(T.Lass.ph!=='off')grabs++;}
    return {grabs,mercy:T.Lass.mercy,since:T.Lass.sinceWin};});
  ok('AC9 20 attempts straight after an escape produce zero chains',chain2.grabs===0,
     'mercy='+chain.mercy.toFixed(1)+'s, sinceWin='+chain.since+', grabs='+chain2.grabs);
  // AC7: timeout release, total damage <= 22
  await E(()=>{const T=window.__T;T.R.hp=100;T.Lass.mercy=0;T.Lass.sinceWin=1;T.Lass.cd=0;T.attacks=[];T.R.iframe=0;});
  const g2=await grabWait(4000);
  if(g2){const g0=await E(()=>window.__T.elapsed);let ph='held',hp=100,gs=0,lo=100;
    for(let i=0;i<160;i++){await W(90);const r=await E(()=>{const T=window.__T;T.attacks=[];return {ph:T.Lass.ph,hp:T.R.hp,e:T.elapsed};});
      ph=r.ph;hp=r.hp;lo=Math.min(lo,r.hp);gs=r.e-g0;if(ph==='off')break;}
    ok('AC7 doing nothing releases Rosie within 4.0 s of game time for <= 22 damage',ph==='off'&&gs<=4.6&&(100-lo)<=22,
       'released after '+gs.toFixed(2)+' s of game time, worst hp '+lo.toFixed(1)+' (damage '+(100-lo).toFixed(1)+')');}
  else ok('AC7 timeout release','FAILED to re-grab for the timeout test'===null,'no second grab');
  // AC10: never grabbed at <= 10 HP
  await E(()=>{const T=window.__T;T.Lass.ph='off';T.R.held=false;T.R.hp=9;T.Lass.mercy=0;T.Lass.sinceWin=1;T.Lass.cd=0;T.attacks=[];T.R.iframe=99;T.R.safeT=0;});
  let lowPh='off';for(let i=0;i<24;i++){await W(80);lowPh=await E(()=>{const T=window.__T;T.R.hp=9;T.Lass.cd=0;T.R.iframe=99;T.attacks=[];return T.Lass.ph;});if(lowPh!=='off')break;}
  ok('AC10 a dog at 9 HP is never grabbed',lowPh==='off','Lass.ph='+lowPh+' after 2 s of forced attempts');
}
/* ---- 15/4.3: endless curve reaches a fixed hardest state ---- */
const curve=await E(()=>{const T=window.__T;const L0=T.level,rd=L=>{T.level=L;return {u:T.unitDmg(),a:+T.atkMult().toFixed(4),l:T.leapsFor()}};
  const r={l1:rd(1),l5:rd(5),l6:rd(6),l12:rd(12),l20:rd(20)};T.level=L0;
  return {u5:r.l5.u,u20:r.l20.u,a12:r.l12.a,a20:r.l20.a,l12:r.l12.l,l20:r.l20.l,l1:r.l1.l,l6:r.l6.l};});
ok('AC15 unit is identical at levels 5 and 20; level 12 == level 20',
   curve.u5===curve.u20&&curve.a12===curve.a20&&curve.l12===curve.l20,
   'unit='+curve.u5.toFixed(3)+' atkMult(12)='+curve.a12.toFixed(2)+' leaps L1/L6/L12/L20='+[curve.l1,curve.l6,curve.l12,curve.l20].join('/'));
/* ---- 16/3.7: best score ---- */
const best=await E(()=>localStorage.getItem('rosie2-best'));
await E(()=>{const T=window.__T;T.Lass.ph='off';T.R.held=false;T.R.iframe=0;T.R.dashT=0;T.R.hp=1;T.hurt(99,0,0);});await W(1500);
const bw=await E(()=>({ls:localStorage.getItem('rosie2-best'),lb:document.getElementById('lBest').textContent,st:window.__T.state,score:window.__T.score}));
ok('AC16 dying writes rosie2-best and the lose card shows it',bw.ls!==null&&Number(bw.ls)>=0&&bw.lb===bw.ls,
   'localStorage rosie2-best='+bw.ls+', lose card Best='+bw.lb+' (was '+best+')');
// draw-call budget: measure a calm play frame, then the same frame with a band and a ring live
await E(()=>{const T=window.__T;T.R.hp=100;});
const dcA=await E(async()=>{const T=window.__T;T.Hot.ph='off';T.Lass.ph='off';
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return T.calls;});
const dcB=await E(async()=>{const T=window.__T;T.Hot.ph='hot';T.Hot.t=0;T.Hot.len=9;T.Hot.c=20;T.Hot.w=6;T.weak=70;T.Lass.ph='tele';T.Lass.t=0;T.Lass.tele=9;T.Lass.x=T.R.x;T.Lass.y=T.R.y;
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return T.calls;});
console.log('\\ndraw calls: '+dcA+' with no band or ring live, '+dcB+' with both live (delta '+(dcB-dcA)+')');
console.log(errs.length?'JS ERRORS:\\n'+errs.slice(0,8).join('\\n'):'no JS errors');
console.log('\\n'+res.filter(r=>r[0]==='PASS').length+' passed, '+res.filter(r=>r[0]==='FAIL').length+' failed');
clearInterval(nurse);await b.close();})();
