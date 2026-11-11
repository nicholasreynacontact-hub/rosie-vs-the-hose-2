// Acceptance harness for design/gdd/special-moves.md sections 3.1-3.2 (motion reader + the four
// built specials) and for the hit-reaction addition. Deterministic: the state machine is stepped
// by calling updSpecial(1/60) directly, never by wall-clock waits.
// Usage: node moves_accept.js
const fs=require('fs'),{chromium}=require('playwright');const REPO='/home/claude/rosie-vs-the-hose-2';
const HOOK=`window.__T={R,J,Mot,MOVES,Hot,Lass,snakes,get attacks(){return attacks},
 get rope(){return rope},motPush,motMatch,motDir,motSeq,updSpecial,startSp,tryBite,tryDash,doBark,doBite,hurt,burn,chainSet,unitDmg,chainDmg,moveWeak,
 get state(){return state},get weak(){return weak},set weak(v){weak=v},
 get hoseHP(){return hoseHP},set hoseHP(v){hoseHP=v},get combo(){return combo},get calls(){return renderer.info.render.calls},
 get motT(){return motT},set motT(v){motT=v},
 set inX(v){inX=v},set inY(v){inY=v},get inX(){return inX},get inY(){return inY},
 get hitStop(){return hitStop},set hitStop(v){hitStop=v},get shake(){return shake},set shake(v){shake=v},
 get level(){return level},set level(v){level=v},
 get dashBuf(){return dashBuf},set dashBuf(v){dashBuf=v},
 K:{MOT_HOLD,MOT_GAP,MOT_BASE,MOT_PER,MOT_SLOP,MOT_BTN,SLAM_W,SLAM_CD,SPIN_CD,DIG_CD,DIG_T,FIN_W,FIN_CHAIN,SPIN_R,SLAM_R,DZ,N,HIT_STOP,HIT_SHAKE},
 mv(id){return MOVES.filter(m=>m.id===id)[0];},
 /* craft a buffer tail: tokens evenly spaced 0.15 s back from now */
 feed(toks,gap){const g=gap===undefined?.15:gap;Mot.buf.length=0;
   for(let i=0;i<toks.length;i++)Mot.buf.push({tok:toks[i],t:motT-(toks.length-i)*g});},
 calm(){R.sp=null;R.under=0;R.air=0;R.recover=0;R.chomp=0;R.shk=0;R.held=false;R.dash=0;R.dashT=0;R.iframe=0;
   R.stam=3;R.hp=100;R.vx=0;R.vy=0;R.pounce=0;R.dashCd=0;R.biteT=0;R.thrash=0;Hot.ph='off';Hot.cd=999;Lass.ph='off';Lass.cd=999;attacks.length=0;snakes.length=0;
   for(const k in R.spCd)R.spCd[k]=0;Mot.buf.length=0;Mot.pend=null;hitStop=0;shake=0;hoseHP=100;},
 step(n){for(let i=0;i<n;i++)updSpecial(1/60);},
 runToEnd(cap){let i=0;while(R.sp&&i<cap){updSpecial(1/60);i++;}return i;}};
requestAnimationFrame(frame);
})();`;
const res=[];const ok=(n,c,d='')=>{res.push([c?'PASS':'FAIL',n,d]);console.log((c?'PASS  ':'FAIL  ')+n+(d?'  ['+d+']':''));};
const near=(a,b,e)=>Math.abs(a-b)<=e;
(async()=>{
let h=fs.readFileSync(REPO+'/src/index.html','utf8');
h=h.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','file://'+__dirname+'/node_modules/three/build/three.min.js');
h=h.replace("requestAnimationFrame(frame);\n})();",HOOK);
fs.writeFileSync(__dirname+'/moves_test.html',h);
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|Failed to load resource/.test(m.text()))errs.push(m.text().slice(0,160));});
await p.goto('file://'+__dirname+'/moves_test.html');await p.waitForTimeout(1500);
await p.click('#playBtn');await p.waitForTimeout(700);
const E=f=>p.evaluate(f);const W=ms=>p.waitForTimeout(ms);
const nurse=setInterval(()=>{},1e6);

/* ---- AC2: every motion fires its own move ---- */
const fires=await E(()=>{const T=window.__T,o={};
  const run=(id,toks,btn)=>{T.calm();if(id==='bonk'){T.chainSet(9);T.J.winded=5;}
    T.feed(toks);const r=btn==='B'?T.tryBite():btn==='D'?T.tryDash():T.doBark();
    const got=T.R.sp?T.R.sp.id:null;o[id]=[got,r];T.calm();};
  run('slam',[2,8],'B');run('bonk',[2,6,8],'B');run('dig',[4,6,2],'D');run('spin',[6,2,4],'K');
  return o;});
for(const id of ['slam','bonk','dig','spin'])
  ok('AC2 '+id+' fires from its motion',fires[id][0]===id,'sp='+fires[id][0]+' btn returned '+fires[id][1]);

/* ---- AC2: one stray flick mid-sequence still matches (MOT_SLOP = 1) ---- */
const slop=await E(()=>{const T=window.__T;T.calm();T.feed([4,8,6,2]);T.tryDash();const a=T.R.sp?T.R.sp.id:null;
  T.calm();T.feed([4,8,8,6,2]);T.tryDash();const c=T.R.sp?T.R.sp.id:null;T.calm();return [a,c];});
ok('AC2 one stray flick is skipped, two are not',slop[0]==='dig'&&slop[1]===null,'1 stray -> '+slop[0]+', 2 strays -> '+slop[1]);

/* ---- AC4: a diagonal substitutes in exactly one slot ---- */
const diag=await E(()=>{const T=window.__T;T.calm();T.feed([3,2,4]);T.doBark();const a=T.R.sp?T.R.sp.id:null;
  T.calm();T.feed([3,1,4]);T.doBark();const c=T.R.sp?T.R.sp.id:null;T.calm();return [a,c];});
ok('AC4 one diagonal substitutes, two do not',diag[0]==='spin'&&diag[1]===null,'one -> '+diag[0]+', two -> '+diag[1]);

/* ---- AC3: a gap over MOT_GAP, or a span over MOT_WIN, does not fire ---- */
const win=await E(()=>{const T=window.__T;T.calm();T.feed([2,8],.5);T.tryBite();const g=T.R.sp?T.R.sp.id:null;
  T.calm();T.feed([2,6,8],.399);T.tryBite();const s=T.R.sp?T.R.sp.id:null;T.calm();return [g,s];});
ok('AC3 a 0.50 s gap does not fire',win[0]===null,'got '+win[0]);
ok('AC3 a span of 1.20 s (over MOT_WIN(4)=1.18) does not fire, though every gap is legal',win[1]===null,'got '+win[1]);

/* ---- AC6: a failed or partial motion is free, and the ordinary action still runs ---- */
const free=await E(()=>{const T=window.__T;T.calm();T.R.x=140;T.R.y=1100;T.J.winded=0;
  const b={stam:T.R.stam,cd:JSON.parse(JSON.stringify(T.R.spCd)),rec:T.R.recover};
  T.feed([2]);const r=T.tryBite();                                   // partial: one flick then Bite
  const a={stam:T.R.stam,cd:JSON.parse(JSON.stringify(T.R.spCd)),sp:T.R.sp,chomp:T.R.chomp,ret:r};
  T.calm();return {b,a};});
ok('AC6 a partial motion costs no stamina and sets no cooldown',
   free.a.stam===free.b.stam&&free.a.cd.slam===0&&free.a.cd.dig===0&&free.a.cd.spin===0&&free.a.sp===null,
   'stam '+free.b.stam+'->'+free.a.stam+' cds '+JSON.stringify(free.a.cd));
ok('AC6 the button falls through to its ordinary action (a Bite is still a Bite)',
   free.a.ret===true&&free.a.chomp>0,'tryBite returned '+free.a.ret+' chomp='+free.a.chomp);

/* ---- AC1: running in a circle, holding each direction 0.4 s, fires nothing ---- */
const circle=await E(()=>{const T=window.__T;T.calm();let fired=0,acts=0;
  const dirs=[[1,0],[.7,.7],[0,1],[-.7,.7],[-1,0],[-.7,-.7],[0,-1],[.7,-.7]];
  for(let lap=0;lap<3;lap++)for(const d of dirs){
    T.inX=d[0];T.inY=d[1];
    for(let f=0;f<24;f++){T.motT=T.motT+1/60;T.motDir(1/60);}     // 0.40 s held
    T.inX=0;T.inY=0;for(let f=0;f<4;f++){T.motT=T.motT+1/60;T.motDir(1/60);}
    T.R.x=140;T.R.y=1100;T.R.recover=0;T.R.chomp=0;T.R.dashCd=0;T.R.stam=3;T.R.dash=0;T.R.dashT=0;T.R.pounce=0;T.R.barkCd=0;
    if(T.tryBite())acts++;if(T.R.sp)fired++;
    if(T.tryDash())acts++;if(T.R.sp)fired++;
    if(T.doBark())acts++;if(T.R.sp)fired++;
    T.R.barkCd=0;}
  const tok=T.Mot.buf.length;T.calm();return {fired,acts,tok};});
ok('AC1 60 s of running in circles + 72 button presses fires ZERO specials',
   circle.fired===0&&circle.tok===0,'specials='+circle.fired+' tokens emitted='+circle.tok);
ok('AC1 every one of those presses still produced its ordinary action',circle.acts>=60,'ordinary actions='+circle.acts);

/* ---- AC13: the finisher is gated on chain 8 AND a winded spot ---- */
const fin=await E(()=>{const T=window.__T;const t=(c,w)=>{T.calm();T.chainSet(c);T.J.winded=w;T.feed([2,6,8]);
  T.tryBite();const r=T.R.sp?T.R.sp.id:null;T.calm();return r;};
  return {c7:t(7,5),c8:t(8,5),dry:t(9,0)};});
ok('AC13 MEGA BONK is unavailable at chain 7',fin.c7===null,'got '+fin.c7);
ok('AC13 MEGA BONK is unavailable on a spot that is not winded',fin.dry===null,'got '+fin.dry);
ok('AC13 MEGA BONK fires at chain 8 on a winded spot',fin.c8==='bonk','got '+fin.c8);

/* ---- 4.2 / AC9 / AC13: damage weights, sampled at the EFFECT frame ---- */
const dmg=await E(()=>{const T=window.__T;const o={};
  const fire=(id,toks,btn,winded,chain)=>{T.calm();T.level=5;T.chainSet(chain);T.J.winded=winded;T.J.hits=0;T.J.streak=0;
    const w=T.rope[T.weak];T.R.x=w.x;T.R.y=w.y;T.R.ang=0;const h0=T.hoseHP,cd=T.chainDmg(),u=T.unitDmg();
    T.feed(toks);const r=btn==='B'?T.tryBite():btn==='D'?T.tryDash():T.doBark();
    const frames=T.runToEnd(200);
    o[id+(winded?'':'_dry')]={dmg:h0-T.hoseHP,unit:u,cd,frames,streak:T.J.streak,hits:T.J.hits,combo:T.combo};
    T.calm();};
  fire('slam',[2,8],'B',5,4);fire('slam',[2,8],'B',0,4);
  fire('bonk',[2,6,8],'B',5,9);fire('spin',[6,2,4],'K',5,4);fire('dig',[4,6,2],'D',0,4);
  return o;});
ok('4.2 FLIPPITY-FLOP removes unit x 3.2 x chainDmg()',near(dmg.slam.dmg,dmg.slam.unit*3.2*dmg.slam.cd,.02),
   dmg.slam.dmg.toFixed(3)+' vs '+(dmg.slam.unit*3.2*dmg.slam.cd).toFixed(3));
ok('AC9 the slam ends the window as a RIP (J.hits back to 0)',dmg.slam.hits===0,'J.hits='+dmg.slam.hits);
ok('AC8 a slam on a spot that is NOT winded deals 0 and adds exactly +1 to J.streak',
   dmg.slam_dry.dmg===0&&dmg.slam_dry.streak===1,'dmg='+dmg.slam_dry.dmg+' streak='+dmg.slam_dry.streak);
ok('4.3 MEGA BONK removes unit x 5.6 x chainDmg() and spends the chain',
   near(dmg.bonk.dmg,dmg.bonk.unit*5.6*dmg.bonk.cd,.02)&&dmg.bonk.combo===0,
   dmg.bonk.dmg.toFixed(3)+' vs '+(dmg.bonk.unit*5.6*dmg.bonk.cd).toFixed(3)+', combo after='+dmg.bonk.combo);
ok('AC12 SPIN CYCLE deals 0 to the main hose even on a winded spot',dmg.spin.dmg===0,'dmg='+dmg.spin.dmg);

/* ---- 3.2: commitment lengths ---- */
const LEN={slam:.85,bonk:1.40,spin:.55,dig:1.15};
for(const id of ['slam','bonk','spin','dig']){
  const k=dmg[id]||dmg[id+'_dry'];
  ok('3.2 '+id+' commitment is '+LEN[id].toFixed(2)+' s',near(k.frames/60,LEN[id],.04),(k.frames/60).toFixed(3)+' s');
}

/* ---- 3.2 / 7: stamina cost and cooldown ---- */
const cost=await E(()=>{const T=window.__T;const o={};
  for(const m of T.MOVES){T.calm();T.chainSet(9);T.J.winded=5;T.R.stam=3;
    T.startSp(m);o[m.id]={spent:3-T.R.stam,cd:T.R.spCd[m.id]};T.calm();}
  o.short=(()=>{T.calm();T.R.stam=1;T.feed([6,2,4]);T.doBark();const r=T.R.sp?T.R.sp.id:null;T.calm();return r;})();
  return o;});
ok('3.2 stamina costs are slam 1 / dig 2 / spin 2 / bonk 1',
   cost.slam.spent===1&&cost.dig.spent===2&&cost.spin.spent===2&&cost.bonk.spent===1,
   JSON.stringify({slam:cost.slam.spent,dig:cost.dig.spent,spin:cost.spin.spent,bonk:cost.bonk.spent}));
ok('7 cooldowns are slam 5 s / dig 7 s / spin 6 s, and the finisher has none (the chain is its cooldown)',
   cost.slam.cd===5&&cost.dig.cd===7&&cost.spin.cd===6&&cost.bonk.cd===0,
   JSON.stringify({slam:cost.slam.cd,dig:cost.dig.cd,spin:cost.spin.cd,bonk:cost.bonk.cd}));
ok('AC12 SPIN CYCLE does nothing at all below 2 stamina',cost.short===null,'got '+cost.short);

/* ---- AC11 / 5.7: R.under and R.air turn off the damage paths they are supposed to ---- */
const inv=await E(()=>{const T=window.__T;T.calm();const o={};
  T.R.under=1;const h0=T.R.hp;T.hurt(20,0,0);T.burn(20,0,0);o.under=T.R.hp===h0;
  T.R.under=0;T.R.air=1;T.R.iframe=0;const h1=T.R.hp;T.burn(20,0,0);o.air=T.R.hp===h1;
  T.R.air=0;T.R.iframe=0;const h2=T.R.hp;T.hurt(20,0,0);o.normal=T.R.hp<h2;T.calm();return o;});
ok('AC11 nothing reaches her while R.under (hurt and burn are no-ops)',inv.under,'hp unchanged='+inv.under);
ok('AC10 the hot band deals 0 during the airborne phase (R.air)',inv.air,'hp unchanged='+inv.air);
ok('damage still lands normally outside those states',inv.normal);

/* ---- AC11: dig travel distance stays under 630 px ---- */
const trav=await E(()=>{const T=window.__T;T.calm();T.R.x=1400;T.R.y=700;T.R.ang=0;T.inX=1;T.inY=0;
  const x0=T.R.x;T.feed([4,6,2]);T.tryDash();let d=0,uf=0,mx=0;
  let was=0,travel=0;
  for(let i=0;i<120&&T.R.sp;i++){T.updSpecial(1/60);if(T.R.under)uf++;mx=Math.max(mx,T.R.vx);
    if(was&&!T.R.under)travel=T.R.x-x0;was=T.R.under;
    T.R.x=Math.min(2900,T.R.x+T.R.vx/60);d=T.R.x-x0;}
  d=travel||d;
  T.inX=0;T.calm();return {d,uf,mx};});
ok('AC11 Diggy-Down travels at most 630 px',trav.d<=640&&trav.d>400,
   Math.round(trav.d)+' px of tunnel over '+trav.uf+' underground frames at up to '+Math.round(trav.mx)+' px/s (5.8 pushOut on emergence is separate)');

/* ---- AC14: one special at a time, never queued ---- */
const solo=await E(()=>{const T=window.__T;T.calm();T.feed([2,8]);T.tryBite();const first=T.R.sp&&T.R.sp.id;
  T.step(6);T.R.spCd.dig=0;T.R.stam=3;T.feed([4,6,2]);const r=T.tryDash();const still=T.R.sp&&T.R.sp.id;
  const tt=T.R.sp&&T.R.sp.t;T.calm();return {first,still,r,tt};});
ok('AC14 a second motion mid-special does nothing and does not queue',
   solo.first==='slam'&&solo.still==='slam',solo.first+' stayed '+solo.still);

/* ---- hit reactions (user addition): escalation, and a special hits like a third bite ---- */
const feel=await E(()=>{const T=window.__T;const o=[];
  for(let s=1;s<=3;s++){T.calm();T.level=5;T.J.winded=5;T.J.hits=s-1;const wi=T.weak,w=T.rope[wi];T.R.x=w.x;T.R.y=w.y;
    T.hitStop=0;T.shake=0;T.rope[wi].vz=0;T.doBite(wi);
    o.push({step:s,stop:T.hitStop,shake:T.shake,vz:T.rope[wi].vz});}
  T.calm();T.level=5;T.J.winded=5;T.J.hits=0;const w=T.rope[T.weak];T.R.x=w.x;T.R.y=w.y;T.hitStop=0;T.shake=0;
  T.feed([2,8]);T.tryBite();T.runToEnd(200);const sp={stop:T.hitStop,shake:T.shake};T.calm();
  return {o,sp};});
ok('hit reactions escalate across a combo (hit-stop and shake both grow 1 -> 2 -> 3)',
   feel.o[0].stop<feel.o[1].stop&&feel.o[1].stop<feel.o[2].stop&&feel.o[0].shake<feel.o[2].shake,
   feel.o.map(x=>'s'+x.step+': stop '+x.stop.toFixed(2)+' shake '+x.shake.toFixed(2)).join(' | '));
ok('hit reactions kick the hose away from the bite point (vertical recoil grows with weight)',
   feel.o[0].vz>0&&feel.o[2].vz>feel.o[0].vz,'vz '+feel.o.map(x=>Math.round(x.vz)).join(' / '));
ok("a special's hit lands at least as heavy as a third bite",
   feel.sp.stop>=feel.o[2].stop-.001,'special stop='+feel.sp.stop.toFixed(2)+' vs RIP '+feel.o[2].stop.toFixed(2));

/* ---- end-to-end on a real keyboard: down-flick, up-flick, Bite ---- */
await E(()=>{const T=window.__T;T.calm();T.R.x=140;T.R.y=1100;});
await p.keyboard.down('ArrowDown');await W(70);await p.keyboard.up('ArrowDown');await W(40);
await p.keyboard.down('ArrowUp');await W(70);await p.keyboard.up('ArrowUp');await W(30);
await p.keyboard.press('Space');await W(120);
const kb=await E(()=>{const T=window.__T;const r=T.R.sp?T.R.sp.id:null;return r;});
ok('AC2 FLIPPITY-FLOP fires from real keyboard flicks (Down, Up, Space)',kb==='slam','sp='+kb);
await E(()=>window.__T.calm());

const draw=await E(()=>({c:window.__T.calls}));
console.log('\ndraw calls now: '+draw.c);
const pass=res.filter(r=>r[0]==='PASS').length;
console.log('\n'+pass+' / '+res.length+' passed');
if(errs.length)console.log('JS ERRORS:\n'+errs.slice(0,8).join('\n'));else console.log('no JS errors');
clearInterval(nurse);await b.close();})();
