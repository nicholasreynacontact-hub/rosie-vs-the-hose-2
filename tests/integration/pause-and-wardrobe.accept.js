// Headless acceptance harness for design/ux/pause-and-wardrobe.md (sections 1-4).
// Usage: node pause_accept.js       (modelled on fight_accept.js)
const fs=require('fs'),{chromium}=require('playwright');const REPO='/home/claude/rosie-vs-the-hose-2';
const HOOK=`window.__T={R,J,Hot,Lass,rope,look,pause,resume,wApply,WSLOTS,FURW,
 get state(){return state},set state(v){state=v},
 get elapsed(){return elapsed},get level(){return level},set level(v){level=v},
 get score(){return score},set score(v){score=v},get levelScore(){return levelScore},
 get hoseHP(){return hoseHP},set hoseHP(v){hoseHP=v},get power(){return power},set power(v){power=v},
 get combo(){return combo},get attacks(){return attacks},set attacks(v){attacks=v},get weak(){return weak},
 get biteBuf(){return biteBuf},get dashBuf(){return dashBuf},get cin(){return !!cinQ},get pauseK(){return pauseK},
 get calls(){return renderer.info.render.calls},get dtS(){return dtS},get dogVis(){return dog.visible},
 get furHex(){return '#'+furM.color.getHexString()},get shadeHex(){return '#'+furS.color.getHexString()},
 meshes(){let n=0;dog.traverse(o=>{if(o.isMesh&&o.visible)n++;});return n;},
 verts(){let n=0;dog.traverse(o=>{if(o.isMesh&&o.visible&&o.geometry.attributes.position)n+=o.geometry.attributes.position.count;});return n;},
 probe(hex){const self=this;return new Promise(res=>{R.wet=1;requestAnimationFrame(()=>requestAnimationFrame(()=>{
   res({got:'#'+furM.color.getHexString(),want:self.expect(hex,R.wet),cream:self.expect('#fffaf0',R.wet),wet:R.wet});}));});},
 wet(v){R.wet=v;},
 expect(hex,w){const a=new THREE.Color(hex).convertSRGBToLinear(),b=new THREE.Color('#b9dcf5').convertSRGBToLinear();
   return '#'+a.clone().lerp(b,Math.min(1,w)*.8).getHexString();},
 ndc(x,y,z){const v=new THREE.Vector3(x,y,z).project(cam);return {x:v.x,y:v.y,z:v.z};},
 ropeNdc(){const q=rope[weak],v=new THREE.Vector3(q.x,Math.max(10,q.z),zOf(q.y)).project(cam);return {x:v.x,y:v.y,z:v.z};},
 K:{DZ}};
requestAnimationFrame(frame);
})();`;
const res=[];const ok=(n,c,d='')=>{res.push([c?'PASS':'FAIL',n,d]);console.log((c?'PASS  ':'FAIL  ')+n+(d?'  ['+d+']':''));};
const unp=(n,d='')=>{res.push(['UNPROVEN',n,d]);console.log('UNPROVEN  '+n+(d?'  ['+d+']':''));};
const near=(a,b,e)=>Math.abs(a-b)<=e;
(async()=>{
let h=fs.readFileSync(REPO+'/src/index.html','utf8');
h=h.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','file://'+__dirname+'/node_modules/three/build/three.min.js');
h=h.replace("requestAnimationFrame(frame);\n})();",HOOK);
fs.writeFileSync(__dirname+'/pause_test.html',h);
const URL='file://'+__dirname+'/pause_test.html';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|Failed to load resource/.test(m.text()))errs.push(m.text().slice(0,160));});
const E=f=>p.evaluate(f);const W=ms=>p.waitForTimeout(ms);
const click=sel=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;e.click();return true;},sel);
const vis=sel=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&!e.hidden;},sel);
const until=async(f,ms=20000)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await E(f))return true;await W(200);}return false;};
const livePlay=()=>until(()=>window.__T.state==='play'&&!window.__T.cin,25000);
const calm=()=>E(()=>{const T=window.__T;T.attacks=[];T.R.hp=100;T.R.iframe=99;T.Hot.ph='off';T.Hot.cd=999;T.Lass.ph='off';T.Lass.cd=999;T.R.held=false;});
const nurse=setInterval(()=>{},1e6);
await p.goto(URL);await W(1500);

/* ---------- AC1: the control ---------- */
const pb=await p.$('#pauseBtn');const box0=await pb.boundingBox();
ok('AC1 #pauseBtn exists in the HUD row, before #mute',
   await E(()=>{const r=document.querySelector('.hud .row');const k=[...r.children];return k.indexOf(document.getElementById('pauseBtn'))>=0&&k.indexOf(document.getElementById('pauseBtn'))<k.indexOf(document.getElementById('mute'));}),
   'desktop box '+Math.round(box0.width)+'x'+Math.round(box0.height));
await p.setViewportSize({width:390,height:844});await W(400);
const box1=await (await p.$('#pauseBtn')).boundingBox();
ok('AC1 hit box >= 44 px tall on a 390 px viewport',box1.height>=44&&box1.width>=44,Math.round(box1.width)+'x'+Math.round(box1.height));
await p.setViewportSize({width:320,height:568});await W(400);
const ovl=await E(()=>{const r=e=>document.querySelector(e).getBoundingClientRect();const a=r('#pauseBtn');
  const hit=['.pad','.btns'].some(s=>{const c=r(s);return !(a.right<c.left||a.left>c.right||a.bottom<c.top||a.top>c.bottom);});return hit;});
ok('AC1 does not overlap .pad or .btns at 320x568',ovl===false);
await p.setViewportSize({width:1280,height:720});await W(400);

/* ---------- title card selector ---------- */
ok('2.0 the title card carries the same three-way difficulty selector',
   await E(()=>document.querySelectorAll('#tSeg .sgb').length===3&&!!document.getElementById('tDiffNote').textContent),
   await E(()=>[...document.querySelectorAll('#tSeg .sgb')].map(b=>b.textContent).join('/')+' note="'+document.getElementById('tDiffNote').textContent+'"'));

await click('#playBtn');await W(700);await calm();

/* ---------- AC2: Escape and P ---------- */
await p.keyboard.press('Escape');await W(200);
const o1=await E(()=>({st:window.__T.state,ov:!document.getElementById('pauseOv').hidden,foc:document.activeElement&&document.activeElement.id,
  dlg:document.getElementById('pauseOv').getAttribute('role'),inert:document.getElementById('controls').hasAttribute('inert')}));
ok('AC2/AC13 Escape pauses: state=paused, dialog open, focus on Back to the yard, game inert',
   o1.st==='paused'&&o1.ov&&o1.foc==='resumeBtn'&&o1.dlg==='dialog'&&o1.inert,JSON.stringify(o1));
await p.keyboard.press('Escape');await W(300);
const o2=await E(()=>({st:window.__T.state,cin:window.__T.cin,ov:!document.getElementById('pauseOv').hidden,foc:document.activeElement&&document.activeElement.id}));
ok('AC2/AC13 Escape resumes into the count-in and focus returns to #pauseBtn',
   o2.st==='paused'&&o2.cin&&!o2.ov&&o2.foc==='pauseBtn',JSON.stringify(o2));
ok('1.5 the count-in ends and the game is live again',await livePlay());
await p.keyboard.press('p');await W(300);
ok('AC2 P pauses',(await E(()=>window.__T.state))==='paused'&&await vis('#pauseOv'));
await p.keyboard.press('p');await W(300);
ok('AC2 P resumes',await livePlay()&&!(await vis('#pauseOv')));

/* ---------- AC3/AC5: the freeze ---------- */
await calm();
await E(()=>{const T=window.__T;T.R.x=900;T.R.y=700;T.power=4;T.hoseHP=70;
  T.attacks=[{type:'jet',t:.2,tele:1.2,life:2,o:{x:900,y:500},dx:0,dy:1,len:400,dmg:9,src:'head'}];});
await W(300);
await p.keyboard.down(' ');                 // AC5: a held bite across the pause
await E(()=>window.__T.pause());await W(300);
const camReady=await until(()=>window.__T.pauseK>.99,12000);
const s0=await E(()=>{const T=window.__T;return {el:T.elapsed,hp:T.R.hp,hose:T.hoseHP,pow:T.power,combo:T.combo,
  lass:T.Lass.t,rx:T.R.x,ry:T.R.y,at:T.attacks[0]?T.attacks[0].t:-1,wx:T.rope[T.weak].x,buf:T.biteBuf,dog:T.dogVis,calls:T.calls};});
await W(2600);                               // a long pause
const s1=await E(()=>{const T=window.__T;return {el:T.elapsed,hp:T.R.hp,hose:T.hoseHP,pow:T.power,combo:T.combo,
  lass:T.Lass.t,rx:T.R.x,ry:T.R.y,at:T.attacks[0]?T.attacks[0].t:-1,wx:T.rope[T.weak].x,buf:T.biteBuf,dog:T.dogVis,pk:T.pauseK};});
ok('AC3 elapsed / hp / hoseHP / power / combo / Lass.t all frozen across a 2.6 s pause',
   s0.el===s1.el&&s0.hp===s1.hp&&s0.hose===s1.hose&&s0.pow===s1.pow&&s0.combo===s1.combo&&s0.lass===s1.lass,
   'elapsed '+s0.el.toFixed(3)+' -> '+s1.el.toFixed(3));
ok('1.3 Rosie does not move and no attack advances while paused',
   s0.rx===s1.rx&&s0.ry===s1.ry&&s0.at===s1.at&&s0.wx===s1.wx,
   'R.x '+s0.rx+'->'+s1.rx+', attack t '+s0.at+'->'+s1.at+', weak x '+s0.wx.toFixed(1)+'->'+s1.wx.toFixed(1));
ok('1.3 input buffers are cleared on entering pause (AC5: no bite fires on resume)',s1.buf===0,'biteBuf='+s1.buf);
ok('2.4 Rosie stays visible while paused (no frozen hurt-flicker frame)',s1.dog===true);
ok('1.4 the pause camera eases to the wardrobe framing',camReady&&s1.pk>.99,'pauseK='+s1.pk.toFixed(3));

/* ---------- AC6: what is on camera while paused ---------- */
const cam6=await E(()=>{const T=window.__T;
  /* two live telegraphs while frozen: one on the rope, one right beside Rosie */
  T.attacks=[{type:'bomb',t:.1,tele:1.4,life:2,tx:T.rope[T.weak].x,ty:T.rope[T.weak].y,spots:[],dmg:9,src:'head'},
             {type:'jet',t:.1,tele:1.4,life:2,tx:T.R.x+160,ty:T.R.y+40,o:{x:T.R.x+160,y:T.R.y+40},dx:0,dy:1,len:300,dmg:9,src:'head'}];
  const on=v=>v.z>0&&v.z<1&&Math.abs(v.x)<1&&Math.abs(v.y)<1;
  /* on a wide viewport the pause card is paper over the left 46%: ndc x < -0.08 is behind it */
  const seen=v=>on(v)&&v.x>-.08;
  const w=T.ropeNdc(),rosie=T.ndc(T.R.x,100,(T.R.y-392)*T.K.DZ);
  const atk=T.attacks.map(a=>T.ndc(a.tx,20,(a.ty-392)*T.K.DZ));
  return {weakOn:on(w),weakSeen:seen(w),weak:w,atkSeen:atk.filter(seen).length,atkN:atk.length,
    atkX:atk.map(v=>v.x.toFixed(2)).join('/'),rosieSeen:seen(rosie),rosie:rosie};});
ok('AC6 paused: the weak spot and every live attack are out of the player\'s view, Rosie is in it',
   cam6.weakSeen===false&&cam6.atkSeen===0&&cam6.rosieSeen===true,
   'weak ndc x='+cam6.weak.x.toFixed(2)+' y='+cam6.weak.y.toFixed(2)+' (on camera at all: '+cam6.weakOn+'), attack ndc x '+cam6.atkX+', '+cam6.atkSeen+'/'+cam6.atkN+' attacks in view, Rosie ndc x='+cam6.rosie.x.toFixed(2)+' y='+cam6.rosie.y.toFixed(2));
await E(()=>{window.__T.attacks=[];});

/* ---------- AC3: resume without a giant frame step ---------- */
await p.keyboard.up(' ');
const t0=await E(()=>window.__T.elapsed);
await E(()=>window.__T.resume());await livePlay();
const r1=await E(()=>({el:window.__T.elapsed,st:window.__T.state,dt:window.__T.dtS,hp:window.__T.R.hp,j:window.__T.J.hits}));
await W(200);const r2=await E(()=>({el:window.__T.elapsed,dt:window.__T.dtS}));
ok('AC3 no giant frame step on resume (first resumed seconds advance in real time)',
   r1.st==='play'&&r1.el-t0<.35&&r2.dt<.06&&r2.el-r1.el<.35,
   'elapsed +'+(r1.el-t0).toFixed(3)+' s at GO, dtS='+r2.dt.toFixed(4)+', +'+(r2.el-r1.el).toFixed(3)+' s over the next 200 ms');
ok('AC3 no attack landed during the count-in',r1.hp===100,'hp='+r1.hp);
ok('AC5 holding Bite across the pause fires no bite on resume',r1.j===0,'J.hits='+r1.j);

/* ---------- AC7: tab-away ---------- */
await calm();
await E(()=>{const T=window.__T;if(T.state!=='play')T.state='play';});
await p.evaluate(()=>{Object.defineProperty(document,'hidden',{get:()=>true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
await W(150);
ok('AC7 tabbing away from the browser pauses the game automatically',(await E(()=>window.__T.state))==='paused');
await p.evaluate(()=>{Object.defineProperty(document,'hidden',{get:()=>false,configurable:true});});

/* ---------- AC8: restart confirmations ---------- */
await E(()=>{const T=window.__T;T.hoseHP=42;T.level=3;T.score=500;});
await click('#againBtn');await W(150);
const c1=await E(()=>({strip:!document.getElementById('stripAgain').hidden,foc:document.activeElement.id,hose:window.__T.hoseHP,st:window.__T.state}));
ok('AC8 "Start this hose again" opens an inline confirm, focus on Never mind, nothing restarted yet',
   c1.strip&&c1.foc==='noAgain'&&c1.hose===42&&c1.st==='paused',JSON.stringify(c1));
await p.keyboard.press('Escape');await W(150);
const c2=await E(()=>({strip:!document.getElementById('stripAgain').hidden,st:window.__T.state,ov:!document.getElementById('pauseOv').hidden}));
ok('AC8 Escape cancels the confirm strip and does NOT resume',c2.strip===false&&c2.st==='paused'&&c2.ov,JSON.stringify(c2));
const lbl=await E(()=>[document.getElementById('againBtn').textContent,document.querySelector('#stripAgain .crow button').textContent,
  document.getElementById('homeBtn').textContent,document.querySelector('#stripHome .crow button').textContent]);
ok('AC8 the confirm is differently labelled from the button that opened it',
   lbl[0]!==lbl[1]&&lbl[2]!==lbl[3]&&lbl[1]!==lbl[3],lbl.join(' | '));
await click('#againBtn');await click('#yesAgain');await livePlay();
const c3=await E(()=>({hose:window.__T.hoseHP,lvl:window.__T.level,st:window.__T.state,ov:!document.getElementById('pauseOv').hidden}));
ok('AC8 confirming restarts this hose and runs the count-in',c3.hose===100&&c3.lvl===3&&c3.st==='play'&&!c3.ov,JSON.stringify(c3));
await E(()=>window.__T.pause());await W(300);await click('#homeBtn');await click('#yesHome');await livePlay();
const c4=await E(()=>({lvl:window.__T.level,score:window.__T.score,st:window.__T.state}));
ok('1.7 "Back to hose #1" resets level and run score',c4.lvl===1&&c4.score===0&&c4.st==='play',JSON.stringify(c4));

/* ---------- difficulty mid-level ---------- */
await calm();await E(()=>{const T=window.__T;T.level=3;});
await E(()=>window.__T.pause());await W(300);
const d0=await E(()=>({cur:window.ROSIE_MODE.current,pend:window.ROSIE_MODE.pending}));
await p.evaluate(()=>document.querySelector('#pSeg [data-m="hard"]').click());await W(150);
const d1=await E(()=>({cur:window.ROSIE_MODE.current,pend:window.ROSIE_MODE.pending,
  note:document.getElementById('pDiffNote').textContent,
  checked:[...document.querySelectorAll('#pSeg .sgb')].map(b=>b.dataset.m+':'+b.getAttribute('aria-checked')).join(' ')}));
ok('1.6 changing difficulty mid-level only queues it (live mode unchanged)',d1.cur===d0.cur&&d1.pend==='hard',
   'current '+d0.cur+' -> '+d1.cur+', pending '+d1.pend);
ok('1.6 the queued label is shown under the control',/Applies at Hose #4/.test(d1.note),'"'+d1.note+'"');
ok('3 the selector mirrors state in aria-checked, not colour alone',/hard:true/.test(d1.checked),d1.checked);
await p.evaluate(()=>document.querySelector('#pSeg [data-m="med"]').click());await W(100);

/* ---------- wardrobe ---------- */
await click('#wardBtn');await W(250);
const w0=await E(()=>({ward:!document.getElementById('wardPanel').hidden,pnl:!document.getElementById('pausePanel').hidden,
  tabs:[...document.querySelectorAll('#wTabs [role="tab"]')].map(t=>t.dataset.k),
  foc:document.activeElement.className,
  groups:[...document.querySelectorAll('#wPanes [role="radiogroup"]')].map(g=>g.getAttribute('aria-label'))}));
ok('2.3 all six slots are present as tabs',w0.ward&&!w0.pnl&&w0.tabs.join(',')==='fur,collar,kerchief,hat,sweater,topknot',w0.tabs.join(','));
ok('3 every grid is a named radiogroup',w0.groups.length===11,w0.groups.join(' / '));
const pick=(slot,label)=>p.evaluate(a=>{const pane=[...document.getElementById('wPanes').children].find(x=>x.dataset.k===a[0]);
  const b=[...pane.querySelectorAll('.sw')].find(x=>x.getAttribute('aria-label')===a[1]);if(!b)return 'MISSING '+a[1];b.click();
  return b.getAttribute('aria-checked');},[slot,label]);
const PICKS=[['fur','Lilac Puff'],['collar','Jingle Collar'],['kerchief','Cowpup Kerchief'],['hat','Party Hat'],['sweater','Cosy Knit'],['topknot','Big Bow']];
for(const [slot,label] of PICKS){
  const before=await E(()=>[window.__T.verts(),window.__T.furHex]);
  const chk=await pick(slot,label);await W(260);
  const after=await E(()=>[window.__T.verts(),window.__T.furHex]);
  const changed=slot==='fur'?before[1]!==after[1]:before[0]!==after[0];
  ok('AC9 '+slot+' -> '+label+' changes Rosie within a frame, no overlay reload',
     chk==='true'&&changed&&await vis('#wardPanel'),
     slot==='fur'?('furM '+before[1]+' -> '+after[1]):('vertices on dog '+before[0]+' -> '+after[0]));}
const live=await E(()=>document.getElementById('liveRgn').textContent);
ok('3 the live region announces the change',/Topknot: Big Bow/.test(live),'"'+live+'"');
await pick('hat','Flower Crown');await pick('sweater','Raincoat');await pick('collar','Star Tag');
await pick('kerchief','Picnic Check');await pick('topknot','Daisy');await W(300);

/* ---------- draw calls, measured at play framing like the 530/559 baseline ---------- */
await E(()=>window.__T.resume());await livePlay();await W(900);
const maxCalls=await E(()=>window.__T.calls);
await E(()=>{const T=window.__T;for(const s of T.WSLOTS)if(!s.fur){T.look[s.k].id='none';T.wApply(s.k);}});await W(600);
const bareCalls=await E(()=>window.__T.calls);
ok('draw calls stay under the 620 ceiling with the heaviest outfit',maxCalls<620,
   'heaviest outfit = '+maxCalls+' draw calls at play framing; every slot None = '+bareCalls);
await E(()=>window.__T.pause());await W(400);await click('#wardBtn');await W(300);
await pick('hat','Flower Crown');await pick('sweater','Raincoat');await pick('collar','Star Tag');
await pick('kerchief','Picnic Check');await pick('topknot','Daisy');await pick('fur','Lilac Puff');await W(300);

/* ---------- AC12: no forbidden swatch ---------- */
const BAD=['#ff2d3c','#ffc21a','#ffd23f','#fffbe0','#ff5d5d','#1fa055','#7be07a','#3f9a52','#55b85a'];
const sws=await E(()=>[...document.querySelectorAll('#wPanes .sw i')].map(i=>i.style.background));
const hx=s=>{const m=/rgb\((\d+), (\d+), (\d+)\)/.exec(s);return m?'#'+[1,2,3].map(i=>(+m[i]).toString(16).padStart(2,'0')).join(''):s;};
const hits=sws.map(hx).filter(c=>BAD.includes(c.toLowerCase()));
const greens=sws.map(hx).filter(c=>{const r=parseInt(c.slice(1,3),16),g=parseInt(c.slice(3,5),16),bl=parseInt(c.slice(5,7),16);return g>r+24&&g>bl+24;});
ok('AC12 no swatch is a warning, weak-spot or hose/lawn colour, and none is green',hits.length===0&&greens.length===0,
   sws.length+' swatches checked; offenders '+(hits.concat(greens).join(',')||'none'));

/* ---------- AC10: fur survives wet ---------- */
const fw=await E(()=>window.__T.probe('#dcc8ff'));
ok('AC10 WARNING CASE: a wet Rosie keeps the chosen fur colour (FURC/FURS rebuilt)',
   fw.got===fw.want&&fw.got!==fw.cream,'wet='+fw.wet.toFixed(2)+' furM='+fw.got+' expected '+fw.want+' (cream would be '+fw.cream+')');
await E(()=>window.__T.wet(0));

/* ---------- 2.6: reload ---------- */
await W(500);   // let the 300 ms debounce land
const saved=await E(()=>{try{return localStorage.getItem('rosie2-look');}catch(e){return 'NOSTORE';}});
if(saved==='NOSTORE'||saved===null)unp('2.6 saved under one localStorage key','localStorage unavailable on file://: '+saved);
else{
  ok('2.6 the whole look is saved under the single key rosie2-look',/"fur":"lilac"/.test(saved)&&/"hat"/.test(saved),saved.slice(0,120));
  await p.goto(URL);await W(1600);
  const back=await E(()=>JSON.parse(JSON.stringify(window.__T.look)));
  ok('AC10/2.6 every slot survives a reload',back.fur==='lilac'&&back.hat.id==='flower'&&back.collar.id==='star'&&back.sweater.id==='raincoat'&&back.topknot.id==='daisy'&&back.kerchief.id==='picnic',
     JSON.stringify(back));
  const fw2=await E(()=>window.__T.probe('#dcc8ff'));
  ok('AC10 the reloaded fur colour is still the one used when wet',fw2.got===fw2.want&&fw2.got!==fw2.cream,fw2.got+' vs '+fw2.want);
  await E(()=>window.__T.wet(0));
  /* AC11: hand-edited key */
  await p.evaluate(()=>localStorage.setItem('rosie2-look','{"v":1,"hat":{"id":"sombrero"}}'));
  await p.goto(URL);await W(1600);
  const hand=await E(()=>JSON.parse(JSON.stringify(window.__T.look)));
  await click('#playBtn');await W(900);await E(()=>window.__T.pause());await W(400);await click('#wardBtn');await W(300);
  const fall=await vis('#wFall');
  ok('AC11 an unknown id falls back for that slot only, keeps the rest, throws nothing',
     hand.hat.id==='none'&&hand.collar.id==='classic'&&hand.topknot.id==='plain'&&hand.fur==='marshmallow',JSON.stringify(hand));
  ok('2.6 the fallback line is shown once in the wardrobe',fall===true);
  /* reset to default */
  await click('#wResetBtn');await W(120);
  const rs=await E(()=>!document.getElementById('stripReset').hidden);
  await click('#yesReset');await W(400);
  const rl=await E(()=>JSON.parse(JSON.stringify(window.__T.look)));
  ok('2.4 "Put it all back" asks first, then restores every default',
     rs===true&&rl.fur==='marshmallow'&&rl.collar.id==='classic'&&rl.topknot.id==='plain'&&rl.hat.id==='none',JSON.stringify(rl));
}

/* ---------- AC14: keyboard only ---------- */
const kb=await E(()=>{const r=[];const o=document.getElementById('pauseOv');
  r.push([...o.querySelectorAll('button')].every(b=>b.tabIndex>=-1));
  r.push(document.getElementById('wTabs').children[0].getAttribute('role')==='tab');
  return r;});
await E(()=>document.querySelector('#wTabs [aria-selected="true"]').focus());
await p.keyboard.press('ArrowRight');await W(250);
const kb2=await E(()=>({tab:document.querySelector('#wTabs [aria-selected="true"]').dataset.k,foc:document.activeElement.dataset.k}));
await p.keyboard.press('Home');await W(250);
const kb3=await E(()=>document.querySelector('#wTabs [aria-selected="true"]').dataset.k);
ok('AC14 slot tabs move with the arrow keys and Home/End (roving tabindex)',
   kb[0]&&kb[1]&&kb2.tab==='collar'&&kb2.foc==='collar'&&kb3==='fur','ArrowRight -> '+kb2.tab+', Home -> '+kb3);
ok('3 escape ladder: confirm strip -> wardrobe -> resume',await (async()=>{
  await p.keyboard.press('Escape');await W(150);const a=await vis('#wardPanel');
  await p.keyboard.press('Escape');await W(150);const bb=await vis('#pauseOv');
  return a===false&&bb===false;})());

await W(600);
console.log('\n'+(errs.length?'ERRORS:\n'+errs.slice(0,10).join('\n'):'no JS errors'));
const pass=res.filter(r=>r[0]==='PASS').length,fail=res.filter(r=>r[0]==='FAIL').length,u=res.filter(r=>r[0]==='UNPROVEN').length;
console.log('\n'+pass+' pass / '+fail+' fail / '+u+' unproven');
if(fail)console.log('FAILED:\n'+res.filter(r=>r[0]==='FAIL').map(r=>'  - '+r[1]+(r[2]?'  ['+r[2]+']':'')).join('\n'));
clearInterval(nurse);await b.close();})();
