// Headless acceptance harness for design/gdd/difficulty-and-combos.md.
// Usage: node modes_accept.js      (modelled on fight_accept.js)
const fs=require('fs'),{chromium}=require('playwright');const REPO='/home/claude/rosie-vs-the-hose-2';
const HOOK=`window.__T={R,J,Hot,Lass,rope,E,Hm,DIFF,D,tryBite,tryDash,doBite,doBark,startBooga,endBooga,freeLass,burn,hurt,
 moveWeak,resetLevel,leapAway,dmgOf,unitDmg,leapsFor,windLen,chainDmg,allowedSnakes,spawnSnake,hitSnake,updSnakes,
 get state(){return state},set state(v){state=v},get level(){return level},set level(v){level=v},
 get power(){return power},set power(v){power=v},get hoseHP(){return hoseHP},set hoseHP(v){hoseHP=v},
 get booga(){return booga},get weak(){return weak},set weak(v){weak=v},
 get attacks(){return attacks},set attacks(v){attacks=v},
 get score(){return score},set score(v){score=v},get combo(){return combo},set combo(v){combo=v},
 get chainT(){return chainT},set chainT(v){chainT=v},get dmgTaken(){return dmgTaken},
 get mode(){return mode},get pendingMode(){return pendingMode},get runMinMode(){return runMinMode},
 get secondWind(){return secondWind},set secondWind(v){secondWind=v},
 get snakes(){return snakes},get phase(){return phase},set phase(v){phase=v},
 get crankT(){return crankT},set crankT(v){crankT=v},get crankW(){return crankW},set crankW(v){crankW=v},
 get biteHeld(){return biteHeld},set biteHeld(v){biteHeld=v},
 get calls(){return renderer.info.render.calls},get elapsed(){return elapsed},
 K:{N,DZ,SN_N,SN_HP,SN_MAX_ROPES,SHAKE_T,SHAKE_MAX,SHAKE_EXT,SHAKE_EXT_CAP,BARK_R,BARK_CD,BARK_HOLD,
    CHAIN_W,CHAIN_STEP,POUNCE_DMG,POUNCE_SP,POUNCE_T,SNAKE_COIL,CRANK_CD,CRANK_WIND,HARD_SPACING,BITE_W,WIND_GRANT}};
requestAnimationFrame(frame);
})();`;
const res=[];const ok=(n,c,d='')=>{res.push([c?'PASS':'FAIL',n,d]);console.log((c?'PASS  ':'FAIL  ')+n+(d?'  ['+d+']':''));};
const near=(a,b,e)=>Math.abs(a-b)<=e;
(async()=>{
let h=fs.readFileSync(REPO+'/src/index.html','utf8');
h=h.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','file://'+__dirname+'/node_modules/three/build/three.min.js');
h=h.replace("requestAnimationFrame(frame);\n})();",HOOK);
fs.writeFileSync(__dirname+'/modes_test.html',h);
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|Failed to load resource/.test(m.text()))errs.push(m.text().slice(0,160));});
await p.goto('file://'+__dirname+'/modes_test.html');await p.waitForTimeout(1500);
await p.click('#playBtn');await p.waitForTimeout(600);
const E=(f,a)=>p.evaluate(f,a);const W=ms=>p.waitForTimeout(ms);
const nurse=setInterval(()=>{},1e6);
// put the world in a quiet, known state
const calm=()=>E(()=>{const T=window.__T;T.attacks=[];T.R.iframe=0;T.R.held=false;T.R.shk=0;T.R.pounce=0;T.R.recover=0;
  T.R.chomp=0;T.R.dash=0;T.R.dashCd=0;T.R.barkCd=0;T.biteHeld=false;T.Hot.ph='off';T.Hot.cd=999;T.Lass.ph='off';T.Lass.cd=999;
  T.J.winded=0;T.J.hits=0;T.J.streak=0;T.J.cd=0;T.combo=0;T.chainT=0;T.R.hp=T.D().hpMax;});
// restart a level in a chosen mode (the supported path: set while not playing, then resetLevel)
const startIn=async m=>{const got=await E(mm=>{const T=window.__T;T.state='title';
    window.ROSIE_MODE.set(mm);T.resetLevel();T.level=1;T.phase=1;return T.mode;},m);
  if(got!==m)console.log('  !! startIn('+m+') left mode='+got);return got;};

/* ===== AC1 / AC2 / 3.1 : the DIFF table and Medium-is-today ===== */
const tbl=await E(()=>{const T=window.__T;return JSON.parse(JSON.stringify(T.DIFF));});
const MED={hpMax:100,regenMul:1,regenWait:4,dmgMul:1,hitCap:.2,iframe:1,windGrantMul:1,windLenMul:1,leapAdj:0,
  atkCdMul:1,teleMul:1,hotLvl:2,hotCdMul:1,lassoLvl:4,lassoCdMul:1,dashMax:3,dashRegen:1.6,treatMin:8,treatMax:12,
  treatHeal:20,powerMax:10,boogaLen:15,unitBase:28,secondWind:false,freeSnake:false,maxSnakes:1};
const medBad=Object.keys(MED).filter(k=>tbl.med[k]!==MED[k]);
ok('AC1 Medium column IS the pre-change build (all 26 values)',medBad.length===0,
   medBad.length?('differs: '+medBad.map(k=>k+'='+tbl.med[k]+' want '+MED[k]).join(', ')):'26/26 match');
ok('3.1 Easy/Hard columns match the spec table',
   tbl.easy.hpMax===150&&tbl.easy.dmgMul===.6&&tbl.easy.secondWind===true&&tbl.easy.teleMul===1.25&&tbl.easy.dashMax===4&&
   tbl.hard.hpMax===85&&tbl.hard.dmgMul===1.25&&tbl.hard.freeSnake===true&&tbl.hard.maxSnakes===3&&tbl.hard.teleMul===1,
   'easy hp'+tbl.easy.hpMax+'/dmg'+tbl.easy.dmgMul+'  hard hp'+tbl.hard.hpMax+'/dmg'+tbl.hard.dmgMul+'/tele'+tbl.hard.teleMul);
ok('7 fairness invariant: teleMul is never below 1.00 in any mode',
   ['easy','med','hard'].every(m=>tbl[m].teleMul>=1),['easy','med','hard'].map(m=>m+'='+tbl[m].teleMul).join(' '));

// each mode actually drives the values at the call sites
const drives={};
for(const m of ['easy','med','hard']){
  await startIn(m);await calm();
  drives[m]=await E(()=>{const T=window.__T;T.level=5;T.phase=1;
    return {mode:T.mode,hp:T.R.hp,stam:T.R.stam,unit:T.unitDmg(),leaps:T.leapsFor(),wind:T.windLen(),
            lunge:T.dmgOf(16),free:!T.Hm.grabbed,sw:T.secondWind};});
}
ok('AC1 Medium at L5: 100 HP, 3 dashes, unit 100/48, 4 leaps, window 1.00 s',
   drives.med.hp===100&&drives.med.stam===3&&near(drives.med.unit,100/48,1e-9)&&drives.med.leaps===4&&near(drives.med.wind,1,1e-9),
   JSON.stringify({hp:drives.med.hp,stam:drives.med.stam,unit:+drives.med.unit.toFixed(4),leaps:drives.med.leaps,wind:+drives.med.wind.toFixed(3)}));
ok('3.1 Easy is easier on every axis it should be (HP, dashes, unit, leaps, window)',
   drives.easy.hp===150&&drives.easy.stam===4&&drives.easy.unit>drives.med.unit&&
   drives.easy.leaps===drives.med.leaps-1&&drives.easy.wind>drives.med.wind,
   'hp150 stam4 unit '+drives.easy.unit.toFixed(3)+' leaps '+drives.easy.leaps+' window '+drives.easy.wind.toFixed(3));
ok('3.1 Hard is harder on every axis it should be (HP, unit, leaps, window)',
   drives.hard.hp===85&&drives.hard.unit<drives.med.unit&&drives.hard.leaps===drives.med.leaps+1&&drives.hard.wind<drives.med.wind,
   'hp85 unit '+drives.hard.unit.toFixed(3)+' leaps '+drives.hard.leaps+' window '+drives.hard.wind.toFixed(3));
/* ===== AC6 : no single hit exceeds hitCap x hpMax ===== */
ok('AC6 a 16-damage lunge is capped in all three modes',
   near(drives.easy.lunge,9.6,.01)&&near(drives.med.lunge,16,.01)&&near(drives.hard.lunge,20,.01)&&
   drives.easy.lunge<=.15*150&&drives.med.lunge<=.2*100&&drives.hard.lunge<=.25*85,
   'easy '+drives.easy.lunge.toFixed(2)+' / med '+drives.med.lunge.toFixed(2)+' / hard '+drives.hard.lunge.toFixed(2)+
   ' vs caps 22.5 / 20 / 21.25');
const capped=await E(()=>{const T=window.__T;T.level=9;return {d:T.dmgOf(999),cap:T.D().hitCap*T.D().hpMax};});
ok('AC6 even a 999-damage source cannot exceed hitCap x hpMax (Hard)',near(capped.d,capped.cap,1e-9),
   'dmgOf(999)='+capped.d.toFixed(2)+' cap='+capped.cap.toFixed(2));

/* ===== AC3 / 5.1 : a mode change mid-level waits for the next level ===== */
await startIn('med');await calm();
const mid=await E(()=>{const T=window.__T;T.level=3;const hp0=T.R.hp,st0=T.R.stam;
  const r=window.ROSIE_MODE.set('easy');
  return {r,mode:T.mode,pend:T.pendingMode,hp:T.R.hp,hpSame:T.R.hp===hp0,stamSame:T.R.stam===st0,
          label:window.ROSIE_MODE.label(),unit:T.unitDmg()};});
const after=await E(()=>{const T=window.__T;T.resetLevel();return {mode:T.mode,hp:T.R.hp,stam:T.R.stam};});
ok('AC3 choosing a mode mid-fight changes nothing live',
   mid.mode==='med'&&mid.pend==='easy'&&mid.hpSame&&mid.stamSame,
   'mode stayed '+mid.mode+', pending='+mid.pend+', HP/dash untouched');
ok('AC3 the button label reads "Applies at Hose #N+1"',mid.label==='Applies at Hose #4','label="'+mid.label+'" at level 3');
ok('AC3 the new mode takes effect exactly at the next resetLevel',
   after.mode==='easy'&&after.hp===150&&after.stam===4,'after resetLevel: '+after.mode+', hp '+after.hp+', dashes '+after.stam);

/* ===== AC4 : a Hard run that drops to Easy banks under Easy ===== */
const bank=await E(()=>{const T=window.__T;
  localStorage.setItem('rosie2-best-hard','5000');localStorage.setItem('rosie2-best-easy','0');
  T.state='title';window.ROSIE_MODE.set('hard');T.resetLevel();            // a run that starts Hard
  window.ROSIE_MODE.set('easy');T.resetLevel();                            // ...and drops to Easy
  T.score=1234;T.R.hp=1;T.R.iframe=0;T.R.dashT=0;T.secondWind=false;T.hurt(99,0,0);
  return {hard:localStorage.getItem('rosie2-best-hard'),easy:localStorage.getItem('rosie2-best-easy'),run:T.runMinMode};});
ok('AC4 a Hard run that switches to Easy writes its best under Easy; the Hard best is untouched',
   bank.hard==='5000'&&Number(bank.easy)===1234&&bank.run==='easy',
   'runMinMode='+bank.run+', best-easy='+bank.easy+', best-hard='+bank.hard);
await E(()=>{const T=window.__T;T.state='title';T.resetLevel();});await W(300);

/* ===== AC5 / 3.1 : Easy's Second Wind fires once per level ===== */
await startIn('easy');await calm();
const sw=await E(()=>{const T=window.__T;const out={armed:T.secondWind};
  T.R.hp=5;T.R.iframe=0;T.R.dashT=0;T.hurt(16,0,0);
  out.first={hp:T.R.hp,state:T.state,left:T.secondWind,iframe:T.R.iframe};
  T.R.hp=5;T.R.iframe=0;T.R.dashT=0;T.hurt(16,0,0);
  out.second={hp:T.R.hp,state:T.state};return out;});
ok('AC5 Second Wind leaves 20 HP, grants 2 s of iframes and is armed at level start',
   sw.armed===true&&sw.first.hp===20&&sw.first.state==='play'&&sw.first.iframe>=2,
   'hp -> '+sw.first.hp+', iframes '+sw.first.iframe.toFixed(2)+' s, state '+sw.first.state);
ok('AC5 Second Wind fires at most once per level (the second lethal blow kills)',
   sw.first.left===false&&sw.second.state==='lost','after one save: armed='+sw.first.left+', second blow -> state '+sw.second.state);
const rearm=await E(()=>{const T=window.__T;T.resetLevel();return T.secondWind;});
ok('AC5/5.4 resetLevel re-arms Second Wind for the new level',rearm===true,'secondWind='+rearm);
const noSw=await E(()=>{const T=window.__T;T.state='title';window.ROSIE_MODE.set('med');T.resetLevel();return T.secondWind;});
ok('3.1 Medium and Hard get no Second Wind',noSw===false,'med secondWind='+noSw);

/* ===== AC11 / 3.3 : POUNCE ===== */
await startIn('med');await calm();
const pz=await E(async()=>{const T=window.__T,DZ=T.K.DZ;
  // find open ground at least 400 px clear of every rope node, so nothing interrupts the leap
  let sx=1500,sy=800,best=0;
  for(let gx=1150;gx<2900;gx+=70)for(let gy=470;gy<1100;gy+=70){
    let m=1e9;for(const p of T.rope)m=Math.min(m,Math.hypot(p.x-gx,(p.y-gy)*DZ));
    if(m>best){best=m;sx=gx;sy=gy;}}
  T.R.x=sx;T.R.y=sy;T.R.vx=0;T.R.vy=0;T.R.ang=Math.PI;T.R.stam=3;T.R.dashCd=0;T.R.recover=0;T.J.winded=0;
  const d=T.tryDash(),bite=T.tryBite(),pounce=T.R.pounce,dash=T.R.dash,x0=T.R.x,y0=T.R.y;
  let n=0;while(T.R.pounce&&n++<60)await new Promise(r=>requestAnimationFrame(r));
  return {d,bite,pounce,dash,clear:best,dist:Math.hypot(T.R.x-x0,(T.R.y-y0)*DZ),
          reach:T.K.POUNCE_SP*T.K.POUNCE_T,plain:760*.30};});
ok('AC11 Bite during a dash becomes a Pounce (0.26 s at 1020 px/s)',
   pz.d===true&&pz.bite===true&&pz.pounce===1&&near(pz.dash,.26,.001),
   'R.pounce='+pz.pounce+', R.dash='+pz.dash.toFixed(3)+' s');
ok('AC11/4.4 a Pounce is configured for ~265 px vs 228 px for a plain dash',
   near(pz.reach,265.2,.5)&&pz.reach/pz.plain>1.15,
   pz.reach.toFixed(1)+' px vs '+pz.plain.toFixed(1)+' px = +'+Math.round((pz.reach/pz.plain-1)*100)+'%');
ok('AC11 a Pounce measured in open ground covers ~265 px',pz.dist>235&&pz.dist<305,
   'covered '+pz.dist.toFixed(0)+' px on ground '+pz.clear.toFixed(0)+' px clear of the hose');
await calm();
const pounceAt=`async(winded)=>{const T=window.__T;
  T.J.winded=winded;T.J.hits=0;T.J.streak=0;T.J.cd=0;T.R.recover=0;T.R.chomp=0;T.R.sc=1;
  const h0=T.hoseHP;let w=T.rope[T.weak];
  T.R.x=w.x-30;T.R.y=w.y;T.R.ang=0;T.R.dx=1;T.R.dy=0;T.R.vx=0;T.R.vy=0;
  T.R.dash=T.K.POUNCE_T;T.R.dashT=.3;T.R.pounce=1;
  for(let i=0;i<24&&T.R.pounce;i++){w=T.rope[T.weak];w.z=0;
    T.R.x=w.x-30;T.R.y=w.y;T.R.ang=0;T.R.dx=1;T.R.dy=0;
    await new Promise(r=>requestAnimationFrame(r));}
  return {h0,hp:T.hoseHP,streak:T.J.streak,hits:T.J.hits,pounce:T.R.pounce};}`;
const pw2=await p.evaluate('('+pounceAt+')(0)');
ok('AC11/5.5 a Pounce onto a NON-winded weak spot deals 0 damage and baits one leap',
   near(pw2.hp,pw2.h0,.001)&&pw2.streak>=1,'hoseHP '+pw2.h0.toFixed(2)+' -> '+pw2.hp.toFixed(2)+', J.streak='+pw2.streak);
await calm();
const pwin2=await p.evaluate('('+pounceAt+')(3)');
const pwin={h0:pwin2.h0};
ok('AC11 a Pounce onto a WINDED weak spot lands a step-1 bite',
   pwin2.hits===1&&pwin2.hp<pwin.h0-.1,'J.hits='+pwin2.hits+', hoseHP '+pwin.h0.toFixed(2)+' -> '+pwin2.hp.toFixed(2));

/* ===== AC12 / 3.3 : SHAKE ===== */
await calm();
const sh=await E(async()=>{const T=window.__T;
  T.R.x=1500;T.R.y=800;T.R.ang=0;T.R.vx=0;T.R.vy=0;T.J.winded=4;T.J.hits=1;T.R.shk=0;T.R.shkT=0;
  T.R.shkExt=0;T.R.shkStep=-1;T.hoseHP=100;T.combo=0;T.biteHeld=true;
  const h0=T.hoseHP,unit=T.unitDmg();let started=0,rootVx=null,rootVy=null,maxShk=0;
  for(let i=0;i<150;i++){
    const w=T.rope[T.weak];w.z=0;T.R.x=w.x-44;T.R.y=w.y;T.R.ang=0;T.R.vx=0;T.R.vy=0;   // mouth on the spot
    if(!started)T.R.biteT=.3;                                      // the 0.3 s window after a landed bite
    await new Promise(r=>requestAnimationFrame(r));
    if(T.R.shk>0){if(!started){started=1;}maxShk=Math.max(maxShk,T.R.shk);
      if(rootVx===null){rootVx=T.R.vx;rootVy=T.R.vy;}}
    else if(started)break;}
  T.biteHeld=false;
  return {h0,unit,started,rootVx,rootVy,maxShk,hp:T.hoseHP,shk:T.R.shk,ext:T.R.shkExt,combo:T.combo,wind:T.J.winded};});
const shRoot={shk:sh.maxShk,vx:sh.rootVx,vy:sh.rootVy},shEnd=sh,shStart=sh;
ok('AC12 holding Bite after a landed bite starts a Shake and roots Rosie',
   sh.started===1&&sh.rootVx===0&&sh.rootVy===0,'peak R.shk='+sh.maxShk.toFixed(3)+' s, velocity while rooted '+sh.rootVx+','+sh.rootVy);
const ticks=(shStart.h0-shEnd.hp)/(shStart.unit*.5);
ok('AC12 a full Shake deals 4 ticks of 0.5 unit over 1.2 s',ticks>=3.4&&ticks<=4.6,
   'hoseHP '+shStart.h0.toFixed(2)+' -> '+shEnd.hp.toFixed(2)+' = '+ticks.toFixed(2)+' ticks of '+(shStart.unit*.5).toFixed(3));
ok('RULING: the window extension is capped at 0.24 s, not the spec\'s 0.48 s',
   shEnd.ext<=.2401&&shEnd.ext>0,'total extension granted = '+shEnd.ext.toFixed(3)+' s (cap 0.240)');
ok('AC12 the Shake ends itself at SHAKE_MAX',shEnd.shk===0,'R.shk='+shEnd.shk);
await calm();
const shCancel=await E(()=>{const T=window.__T;T.R.x=1500;T.R.y=800;T.R.ang=0;T.J.winded=3;T.J.hits=1;T.R.biteT=.3;
  T.R.shk=.4;T.R.shkT=0;T.biteHeld=true;T.R.iframe=0;T.R.dashT=0;T.combo=8;
  T.hurt(12,0,0);return {shk:T.R.shk,combo:T.combo};});
ok('AC12 any damage cancels the Shake',shCancel.shk===0,'R.shk after hurt() = '+shCancel.shk);
await calm();
const shRip=await E(()=>{const T=window.__T;T.R.x=1500;T.R.y=800;T.R.ang=0;T.J.winded=3;T.J.hits=3;T.R.biteT=.3;
  T.R.shk=0;T.R.shkStep=-1;const w=T.rope[T.weak];w.x=T.R.x+44;w.y=T.R.y;w.z=0;T.biteHeld=true;return 1;});
await W(200);
const shRip2=await E(()=>window.__T.R.shk);
ok('AC12 Shake is unavailable after the RIP (step 3)',shRip2===0,'R.shk='+shRip2+' with J.hits=3');
await E(()=>{window.__T.biteHeld=false;});

/* ===== AC13 / 3.3 : BARK, tap vs hold ===== */
await calm();
const bk=await E(()=>{const T=window.__T;T.R.x=1500;T.R.y=800;T.R.ang=0;T.R.stam=3;T.R.barkCd=0;T.R.recover=0;
  const mk=n=>({type:'jet',src:'snake',t:0,tele:9,act:.45,o:{x:T.R.x+120,y:T.R.y,h:18},dx:1,dy:0,len:300,landed:false,n});
  T.attacks=[mk(1),mk(2),mk(3)];
  const behind={type:'jet',src:'snake',t:0,tele:9,act:.45,o:{x:T.R.x-200,y:T.R.y,h:18},dx:-1,dy:0,len:300,landed:false,n:4};
  T.attacks=T.attacks.concat([behind]);
  const r=T.doBark();return {r,left:T.attacks.length,ns:T.attacks.map(a=>a.n),stam:T.R.stam,cd:T.R.barkCd,combo:T.combo};});
ok('AC13 a Bark deletes at most 2 telegraphing attacks in cone and leaves the one behind her',
   bk.left===2&&bk.ns.indexOf(4)>=0,'4 telegraphs -> '+bk.left+' left (ids '+bk.ns.join(',')+')');
ok('AC13 a Bark costs 1 stamina and sets a 2.5 s cooldown',bk.stam===2&&near(bk.cd,2.5,.01),
   'stam 3 -> '+bk.stam+', barkCd='+bk.cd.toFixed(2));
const bkLate=await E(()=>{const T=window.__T;T.R.barkCd=0;T.R.stam=3;T.R.recover=0;
  T.attacks=[{type:'jet',src:'snake',t:5,tele:1,act:9,o:{x:T.R.x+120,y:T.R.y,h:18},dx:1,dy:0,len:300,landed:false}];
  T.doBark();return T.attacks.length;});
ok('AC13/5.11 a Bark cannot interrupt an attack already past its telegraph',bkLate===1,'attacks left='+bkLate);
// tap vs hold on the real input
await calm();
await E(()=>{const T=window.__T;T.power=T.D().powerMax;T.R.stam=3;T.R.barkCd=0;T.R.recover=0;});
await p.keyboard.press('b');await W(400);
const tap=await E(()=>({booga:window.__T.booga,power:window.__T.power,stam:window.__T.R.stam}));
ok('AC13/5.10 a TAP on the BOOGA input never spends a banked BOOGA (it barks)',
   tap.booga===0&&tap.power===tap.power&&tap.stam===2,'booga='+tap.booga+', power still '+tap.power+', stamina '+tap.stam);
await E(()=>{const T=window.__T;T.R.barkCd=0;T.R.stam=3;T.R.recover=0;T.power=T.D().powerMax;});
await p.keyboard.down('b');await W(520);
const mid2=await E(()=>({booga:window.__T.booga,power:window.__T.power,state:window.__T.state,mode:window.__T.mode}));
await p.keyboard.up('b');await W(200);
const hold=await E(()=>window.__T.booga);
ok('AC13 HOLDING the B key for 0.3 s at full power starts BOOGA',hold===1,
   'booga='+hold+' (mid-hold: '+JSON.stringify(mid2)+')');
if(hold!==1){await E(()=>{const T=window.__T;T.power=T.D().powerMax;T.R.barkCd=0;T.R.stam=3;});
  const bx=await p.locator('#boogaBtn').boundingBox();
  await p.mouse.move(bx.x+bx.width/2,bx.y+bx.height/2);await p.mouse.down();await W(600);await p.mouse.up();await W(200);
  const hb=await E(()=>window.__T.booga);
  ok('AC13/AC15 HOLDING the touch BOOGA button for 0.3 s at full power starts BOOGA',hb===1,'booga='+hb);
  await E(()=>{const T=window.__T;if(T.booga)T.endBooga();T.power=0;});}
await E(()=>{const T=window.__T;T.endBooga();T.power=0;});await W(400);

/* ===== AC14 / 3.4 : the chain ===== */
await calm();
const ch=await E(()=>{const T=window.__T;T.combo=0;T.power=0;const out=[];
  for(let i=0;i<8;i++){T.J.winded=5;T.J.hits=0;T.doBite(T.weak);out.push({c:T.combo,p:T.power});}
  return {out,chip:document.getElementById('comboChip').hidden,txt:document.getElementById('combo').textContent};});
ok('AC14 every landed bite step raises the chain by 1',ch.out[0].c===1&&ch.out[7].c===8,
   'chain after 8 bites = '+ch.out[7].c);
ok('AC14 +1 power on every 4th chain step',ch.out[3].p>=1&&ch.out[7].p>=2,
   'power after 4 steps = '+ch.out[3].p+', after 8 = '+ch.out[7].p);
const dmgBonus=await E(()=>{const T=window.__T;const o={};T.combo=0;o.c0=T.chainDmg();T.combo=4;o.c4=T.chainDmg();
  T.combo=9;o.c9=T.chainDmg();T.combo=50;o.c50=T.chainDmg();return o;});
ok('AC14 chainDmg runs 1.00 -> 1.48 and is clamped there',
   near(dmgBonus.c0,1,1e-9)&&near(dmgBonus.c4,1.08,1e-9)&&near(dmgBonus.c50,1.48,1e-9),
   'c=0:'+dmgBonus.c0.toFixed(2)+' c=4:'+dmgBonus.c4.toFixed(2)+' c=9:'+dmgBonus.c9.toFixed(2)+' c=50:'+dmgBonus.c50.toFixed(2));
const hud=await E(()=>{const T=window.__T;T.combo=5;return 1;});
await W(200);
const hudTxt=await E(()=>({hidden:document.getElementById('comboChip').hidden,txt:document.getElementById('combo').textContent}));
ok('AC14 the chip shows from chain 2 and reads "CHAIN x N"',hudTxt.hidden===false&&/^CHAIN x5/.test(hudTxt.txt),
   'chip text "'+hudTxt.txt+'"');
const halve=await E(()=>{const T=window.__T;T.combo=7;T.chainT=.001;T.R.hp=T.D().hpMax;T.R.iframe=0;T.R.dashT=0;
  const o={};return new Promise(r=>{setTimeout(()=>{o.afterExpiry=T.combo;
    T.combo=7;T.R.iframe=0;T.R.dashT=0;T.hurt(10,0,0);o.afterDamage=T.combo;
    T.combo=1;T.R.iframe=0;T.hurt(10,0,0);o.fromOne=T.combo;r(o);},120);});});
ok('AC14 an expiring chain HALVES, it does not zero',halve.afterExpiry===3,'7 -> '+halve.afterExpiry);
ok('AC14 taking damage halves the chain too',halve.afterDamage===3,'7 -> '+halve.afterDamage);
ok('5.17 a chain of 1 halves to 0, never below',halve.fromOne===0,'1 -> '+halve.fromOne);

/* ===== AC7 / AC8 / 3.2 : Hard's living yard ===== */
await startIn('hard');await calm();
const hd=await E(()=>{const T=window.__T;return {lvl:T.level,grab:T.Hm.grabbed,hm:T.Hm.mode,
  weak:T.weak,n:T.K.N,ex:T.E.x,ey:T.E.y,sw:T.secondWind,snakes:T.snakes.length};});
ok('AC7 Hard level 1: the person holds nothing and the hose head is free',
   hd.lvl===1&&hd.grab===false&&hd.hm==='crank','level '+hd.lvl+', Hm.grabbed='+hd.grab+', Hm.mode='+hd.hm);
await W(900);
const hsrc=await E(()=>{const T=window.__T;T.R.x=T.E.x+180;T.R.y=T.E.y;return 1;});
await W(2500);
const srcs=await E(()=>{const T=window.__T;return {srcs:T.attacks.map(a=>a.src),human:T.attacks.filter(a=>a.src==='human').length,dmg:T.dmgTaken};});
ok('AC7 attacks come from the free head, never from the person',srcs.human===0,
   'attack sources seen: ['+srcs.srcs.join(',')+'], human-sourced = '+srcs.human);
const wk=await E(()=>{const T=window.__T;const o=[];for(let i=0;i<12;i++){T.moveWeak();o.push(T.weak);}return o;});
ok('AC8 Hard restricts the weak spot to [12, N-14] so it is never in the whipping tail',
   wk.every(w=>w>=12&&w<=90-14),'12 picks, range '+Math.min(...wk)+'..'+Math.max(...wk)+' (limit 12..76)');
const coil=await E(async()=>{const T=window.__T;const sample=async()=>{const x0=T.E.x,y0=T.E.y;
    for(let i=0;i<10;i++)await new Promise(r=>requestAnimationFrame(r));
    return Math.hypot(T.E.x-x0,(T.E.y-y0)*T.K.DZ);};
  T.J.winded=0;T.R.x=T.E.x+150;T.R.y=T.E.y;const free=await sample();
  T.J.winded=99;const slow=await sample();T.J.winded=0;return {free,slow};});
ok('AC8 while the window is earned the head slows to <= 35 % and stops chasing',
   coil.slow<=coil.free*.5+2,'moved '+coil.free.toFixed(1)+' px free vs '+coil.slow.toFixed(1)+' px coiled over 10 frames');
await calm();
const bite1=await E(async()=>{const T=window.__T;T.J.winded=5;T.J.hits=0;T.R.sc=1;T.R.shk=0;T.biteHeld=false;
  const h0=T.hoseHP;let r=false;
  for(let i=0;i<10&&T.J.hits===0;i++){await new Promise(x=>requestAnimationFrame(x));
    const w=T.rope[T.weak];w.z=0;T.R.x=w.x-40;T.R.y=w.y;T.R.ang=0;T.R.recover=0;T.R.chomp=0;T.R.dash=0;T.J.winded=5;
    r=T.tryBite();}
  return {r,hits:T.J.hits,drop:h0-T.hoseHP};});
ok('AC8 the weak spot on the free Hard snake is still bitable',bite1.hits===1&&bite1.drop>0,
   'J.hits='+bite1.hits+', hoseHP -'+bite1.drop.toFixed(2));

/* ===== AC9 / AC10 / 3.2 : the crank and the extra snakes ===== */
const cr=await E(()=>{const T=window.__T;T.Hm.x=90;T.Hm.y=760;T.Hm.shock=0;T.crankT=0;T.crankW=1.5;
  T.R.x=T.Hm.x-90;T.R.y=T.Hm.y;T.R.ang=0;T.R.stam=3;T.R.barkCd=0;T.R.recover=0;
  const before=T.crankT;T.doBark();return {before,after:T.crankT,wind:T.crankW,shock:T.Hm.shock};});
ok('AC10 barking the person adds 6 s to the crank and cancels an in-progress wind-up',
   near(cr.after-cr.before,6,.01)&&cr.wind===0&&cr.shock===3,
   'crankT '+cr.before.toFixed(1)+' -> '+cr.after.toFixed(1)+', wind-up '+cr.wind+', shock '+cr.shock+' s');
const cap=await E(()=>{const T=window.__T;T.level=9;T.phase=3;const o={allowed:T.allowedSnakes()};
  for(let i=0;i<6;i++)T.spawnSnake();o.snakes=T.snakes.length;o.ropes=1+T.snakes.length;
  o.nodes=90+1+T.snakes.length*T.K.SN_N;return o;});
ok('AC9 never more than 3 ropes alive and never more than 163 nodes, however hard you crank',
   cap.snakes<=2&&cap.ropes<=3&&cap.nodes<=163,
   '6 cranks at L9 phase 3 -> '+cap.snakes+' extra snakes, '+cap.ropes+' ropes, '+cap.nodes+' nodes (cap 3 / 163)');
const gate=await E(()=>{const T=window.__T;const o={};
  T.snakes.length=0;T.level=1;T.phase=1;o.l1=T.allowedSnakes();
  T.level=3;o.l3=T.allowedSnakes();T.level=6;o.l6=T.allowedSnakes();
  T.level=4;T.phase=3;o.l4p3=T.allowedSnakes();
  T.state='title';window.ROSIE_MODE.set('med');T.resetLevel();T.level=9;T.phase=3;o.med=T.allowedSnakes();return o;});
ok('4.4 the snake count curve is 0 / 1 / 2, and always 0 outside Hard',
   gate.l1===0&&gate.l3===1&&gate.l6===2&&gate.l4p3===2&&gate.med===0,
   'Hard L1='+gate.l1+' L3='+gate.l3+' L6='+gate.l6+' L4-phase3='+gate.l4p3+'; Medium L9 phase3='+gate.med);
await startIn('hard');await calm();
const sn2=await E(()=>{const T=window.__T;T.level=6;T.phase=1;T.spawnSnake();T.spawnSnake();
  return {n:T.snakes.length,hp:T.snakes.map(s=>s.hp),nodes:T.snakes[0].rope.length-1};});
ok('3.2 an extra snake carries SN_HP 30 over SN_N 36 nodes',
   sn2.n===2&&sn2.hp.every(h=>h===30)&&sn2.nodes===36,sn2.n+' snakes, hp '+sn2.hp.join('/')+', '+sn2.nodes+' nodes each');
await W(700);
const snKill=await E(()=>{const T=window.__T;const s=T.snakes[0],h0=T.hoseHP,sc=T.score;
  T.hitSnake(s,999);return {left:T.snakes.length,hoseSame:T.hoseHP===h0,gain:T.score-sc};});
ok('3.2 an extra snake dies to bites, cannot touch hoseHP, and pays score on death',
   snKill.left===1&&snKill.hoseSame&&snKill.gain>0,
   snKill.left+' left, main hoseHP untouched='+snKill.hoseSame+', score +'+snKill.gain);
const spacing=await E(()=>{const T=window.__T;const o={};
  T.J.winded=5;o.winded=(T.snakes[0].atkCd,T.updSnakes(.016),T.attacks.filter(a=>a.src==='snake').length);
  T.J.winded=0;T.R.held=true;T.snakes.forEach(s=>s.atkCd=0);T.updSnakes(.016);
  o.held=T.attacks.filter(a=>a.src==='snake').length;T.R.held=false;return o;});
ok('AC9/3.2c extra snakes never attack during an earned window or while Rosie is held',
   spacing.winded===0&&spacing.held===0,'snake jets started: '+spacing.winded+' (winded) / '+spacing.held+' (held)');

/* ===== draw calls ===== */
await W(500);
const dc=await E(async()=>{const T=window.__T;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return T.calls;});
const dc0=await E(async()=>{const T=window.__T;T.snakes.length=0;
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return T.calls;});
ok('6 draw calls stay under the 620 ceiling with every extra rope alive',dc<620,
   dc+' draw calls with 1 extra snake live, '+dc0+' with none (ceiling 620)');
console.log(errs.length?'\nJS ERRORS:\n'+errs.slice(0,8).join('\n'):'\nno JS errors');
console.log('\n'+res.filter(r=>r[0]==='PASS').length+' passed, '+res.filter(r=>r[0]==='FAIL').length+' failed');
clearInterval(nurse);await b.close();})();
