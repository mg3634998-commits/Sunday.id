"use strict";
const $=id=>document.getElementById(id);
const cv=$("cv"),ctx=cv.getContext("2d");

const SALDO_AWAL=1000000,MIN_BET=1000;
const S={saldo:SALDO_AWAL,disp:SALDO_AWAL,bet:50000,phase:"wait",mult:1,crashAt:2,t0:0,cd:5,tw:performance.now(),my:0,cashed:false,
 hist:[],st:{r:0,w:0,n:0},k:null,tick:0,log:[],popKey:2,tier:0,pt:-1e9,parts:[],conf:[],rings:[],kp:{x:0,y:0},cur:0,
 lift:0,warm:0,heat:0,nextChirp:0,last:performance.now()};
let W=0,H=0;
const clouds=Array.from({length:7},()=>({x:Math.random(),y:Math.random()*.6,z:Math.random()*.7+.4}));
const birds=Array.from({length:3},(_,i)=>({x:Math.random(),y:.1+Math.random()*.25,v:.02+Math.random()*.02,ph:i*2}));

function fit(){const r=cv.getBoundingClientRect(),d=devicePixelRatio||1;W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0)}
addEventListener("resize",fit);fit();

// ---------- Format & warna ----------
const fmt=n=>n.toFixed(2).replace(".",",")+"x";
const rp=n=>"Rp"+Math.floor(Math.abs(n)).toLocaleString("id-ID");
const rpSigned=n=>(n>0?"+":n<0?"−":"")+rp(n);
const genCrash=()=>{const r=Math.random();return Math.min(500,Math.max(1,Math.floor(97/(1-r))/100))};
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const lerpc=(A,B,t)=>A.map((v,i)=>v+(B[i]-v)*t);
const rgb=a=>"rgb("+a.map(Math.round).join(",")+")";
const COL={topB:hex("#3d9bff"),botB:hex("#c4e9ff"),topW:hex("#ff9a5c"),botW:hex("#ffe3b0"),topH:hex("#5a2a44"),botH:hex("#2a1424"),
 sun:hex("#ffd84a"),sunH:hex("#d4693a"),h1:hex("#3ea85a"),h1H:hex("#2a3d2a"),h2:hex("#2f9450"),h2H:hex("#22331f")};

// ---------- Suara (Web Audio: nada pentatonik + gema) ----------
let ac=null,master=null,rev=null,muted=false,nbuf=null,wind=null;
function audio(){
 if(!ac){
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
  ac=new C();
  master=ac.createGain();master.gain.value=.9;
  const comp=ac.createDynamicsCompressor();master.connect(comp);comp.connect(ac.destination);
  // gema ruang (reverb) dari noise yang meredup
  const len=Math.floor(ac.sampleRate*1.6),ir=ac.createBuffer(2,len,ac.sampleRate);
  for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)}
  const conv=ac.createConvolver();conv.buffer=ir;
  rev=ac.createGain();rev.gain.value=.28;rev.connect(conv);conv.connect(master)}
 if(ac.state==="suspended")ac.resume();
 return ac}
function noiseBuf(){
 if(nbuf)return nbuf;
 nbuf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);
 const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 return nbuf}
function note(f,d,o={}){
 const a=audio();if(!a||muted)return;
 const {type="sine",v=.12,delay=0,slide=null,att=.006,wet=1,vib=0}=o;
 const t=a.currentTime+delay,osc=a.createOscillator(),g=a.createGain();
 osc.type=type;osc.frequency.setValueAtTime(f,t);
 if(slide)osc.frequency.exponentialRampToValueAtTime(slide,t+d);
 g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+d);
 osc.connect(g);g.connect(master);
 if(wet){const s=a.createGain();s.gain.value=wet;g.connect(s);s.connect(rev)}
 if(vib){const l=a.createOscillator(),lg=a.createGain();l.frequency.value=7;lg.gain.value=vib;l.connect(lg);lg.connect(osc.frequency);l.start(t);l.stop(t+d+.05)}
 osc.start(t);osc.stop(t+d+.05)}
function bell(f,d=.9,v=.1,delay=0){
 note(f,d,{v,delay});
 note(f*2,d*.6,{v:v*.35,delay});
 note(f*3.01,d*.35,{v:v*.15,delay,type:"triangle"})}
function burst(d,v,f0,f1,type="bandpass",delay=0,q=.9){
 const a=audio();if(!a||muted)return;
 const t=a.currentTime+delay,s=a.createBufferSource(),fl=a.createBiquadFilter(),g=a.createGain();
 s.buffer=noiseBuf();fl.type=type;fl.Q.value=q;
 fl.frequency.setValueAtTime(f0,t);fl.frequency.exponentialRampToValueAtTime(f1,t+d);
 g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+Math.min(.03,d/3));g.gain.exponentialRampToValueAtTime(.0001,t+d);
 s.connect(fl);fl.connect(g);g.connect(master);s.start(t);s.stop(t+d+.05)}
// angin berhembus dengan hembusan naik-turun (LFO)
function startWind(){
 const a=audio();if(!a||muted||wind)return;
 const s=a.createBufferSource(),fl=a.createBiquadFilter(),g=a.createGain();
 s.buffer=noiseBuf();s.loop=true;fl.type="bandpass";fl.Q.value=.8;fl.frequency.value=400;
 g.gain.value=.0001;g.gain.setTargetAtTime(.05,a.currentTime,.4);
 const l1=a.createOscillator(),l1g=a.createGain();l1.frequency.value=.35;l1g.gain.value=110;l1.connect(l1g);l1g.connect(fl.frequency);
 const l2=a.createOscillator(),l2g=a.createGain();l2.frequency.value=.21;l2g.gain.value=.015;l2.connect(l2g);l2g.connect(g.gain);
 s.connect(fl);fl.connect(g);g.connect(master);s.start();l1.start();l2.start();
 wind={s,fl,g,l1,l2}}
function stopWind(){
 if(!wind)return;const w=wind;wind=null;
 w.g.gain.setTargetAtTime(.0001,ac.currentTime,.12);
 setTimeout(()=>{for(const n of [w.s,w.l1,w.l2]){try{n.stop()}catch(e){}}},600)}
function updateWind(){
 if(!wind||!ac)return;
 const m=Math.min(S.mult,10);
 wind.fl.frequency.setTargetAtTime(350+m*140,ac.currentTime,.15);
 wind.g.gain.setTargetAtTime(.04+m*.007,ac.currentTime,.15)}
const SC=[261.63,293.66,329.63,392,440,523.25,587.33,659.25,783.99,880,1046.5,1174.66,1318.5,1568,1760];
const sfx={
 bet(){bell(659.25,.5,.09);bell(987.77,.6,.08,.07)},
 cancel(){note(440,.22,{type:"triangle",v:.09,slide:300})},
 chip(i=0){note(500+i*70,.12,{type:"triangle",v:.07,wet:.3})},
 tick(){note(1300,.07,{v:.07,slide:650,wet:.2})},
 start(){burst(.9,.2,250,2600);note(360,.9,{type:"triangle",v:.05,slide:820,vib:12});startWind()},
 pop(m){const i=Math.min(SC.length-1,Math.max(0,Math.floor(Math.log2(m)*4)+1));bell(SC[i],.45,.07)},
 tier(){[0,4,7].forEach((x,j)=>bell(523.25*Math.pow(2,x/12),.9,.08,j*.05))},
 cash(m=1){const arp=[523.25,659.25,783.99,1046.5,1318.5,1568],n=m<2?3:m<5?4:6;
  for(let i=0;i<n;i++)bell(arp[i],.9,.1,i*.075);
  burst(.5,.06,5000,9000,"highpass",.05)},
 snap(lost){stopWind();burst(.06,.5,4000,8000,"highpass");
  note(700,.7,{type:"sawtooth",v:.08,slide:140,vib:25,wet:.6});
  if(lost)[440,349.23,293.66].forEach((f,i)=>note(f,.6,{type:"triangle",v:.09,delay:.25+i*.22,slide:f*.94}));
  else note(220,.8,{v:.08,slide:110,delay:.1})},
 chirp(){const f=2400+Math.random()*900;note(f,.09,{v:.025,slide:f*1.4,wet:.4});note(f*1.1,.08,{v:.022,slide:f*1.5,delay:.1,wet:.4})}
};
addEventListener("pointerdown",audio,{once:true});
$("snd").onclick=()=>{
 audio();muted=!muted;$("snd").textContent=muted?"🔇":"🔊";
 if(muted)stopWind();else if(S.phase==="fly")startWind()};

// ---------- UI ----------
let prevSaldo=S.saldo,lastBal="";
function balTrack(){
 if(S.saldo===prevSaldo)return;
 const b=$("bal");b.classList.remove("up","down");void b.offsetWidth;
 b.classList.add(S.saldo>prevSaldo?"up":"down");prevSaldo=S.saldo}
function setMsg(t){
 const m=$("msg");if(m.textContent===t)return;
 m.textContent=t;m.classList.remove("swap");void m.offsetWidth;m.classList.add("swap")}
function ui(){
 balTrack();
 $("sR").textContent=S.st.r;$("sW").textContent=rp(S.st.w);
 const n=$("sN");n.textContent=rpSigned(S.st.n);n.style.color=S.st.n>=0?"var(--ok)":"var(--bad)";
 const g=$("go");g.className="";g.disabled=false;
 if(S.phase==="wait"){
  if(S.my){g.textContent="BATALKAN TARUHAN ("+rp(S.my)+")";g.className="cancel"}
  else{g.textContent="PASANG TARUHAN "+rp(S.bet);g.disabled=S.saldo<S.bet}
 }else if(S.phase==="fly"&&S.my&&!S.cashed){g.textContent="CASH OUT +"+rp(S.my*S.mult);g.className="cash"}
 else{g.textContent=S.phase==="fly"?"MENUNGGU RONDE BERIKUTNYA":"RONDE SELESAI";g.disabled=true}
 $("topup").style.display=S.saldo<MIN_BET&&!S.my?"inline-block":"none";
 for(const id of ["manual","half","dbl","maxb"])$(id).disabled=!!S.my;
}
function renderHist(fresh){
 $("hist").innerHTML=S.hist.map((v,i)=>`<span class="${v<2?"lo":v<10?"mid":"hi"}${fresh&&i===0?" new":""}">${fmt(v)}</span>`).join("");
}

// ---------- Riwayat taruhan ----------
function addLog(n,bet,m,win,profit){
 S.log.unshift({n,bet,m,win,profit});S.log=S.log.slice(0,50);renderLog(true)}
function renderLog(fresh){
 const el=$("log");
 if(!S.log.length){el.innerHTML='<div class="empty">Belum ada taruhan. Pasang taruhan untuk mulai mencatat.</div>';return}
 el.innerHTML='<div class="lr lh"><span>#</span><span>Taruhan</span><span>Kali</span><span>Hasil</span></div>'+
  S.log.map((e,i)=>`<div class="lr ${e.win?"w":"l"}${fresh&&i===0?" new":""}"><span>${e.n}</span><span>${rp(e.bet)}</span><span>${fmt(e.m)}</span><span>${e.win?"+":"−"}${rp(e.profit)}</span></div>`).join("")}
$("clr").onclick=()=>{S.log=[];renderLog()};

// ---------- Animasi ----------
function floatText(t,cls){const f=$("fl");f.textContent=t;f.className="float "+cls;void f.offsetWidth;f.classList.add("show")}
function shake(){const s=$("stage");s.classList.remove("shake");void s.offsetWidth;s.classList.add("shake")}
function sparkle(){
 for(let i=0;i<7;i++){const a=Math.random()*6.283,v=40+Math.random()*90;
  S.parts.push({x:S.kp.x,y:S.kp.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1})}}
function confetti(n){
 const cols=["#ff3d7f","#ffd23f","#3dd6ff","#7dffb0","#c084fc","#ffffff"];
 for(let i=0;i<n;i++)S.conf.push({x:S.kp.x,y:S.kp.y,vx:(Math.random()-.5)*300,vy:-80-Math.random()*220,
  r:Math.random()*6,vr:(Math.random()-.5)*12,l:1,c:cols[i%cols.length]})}
function bump(){
 const key=S.mult<3?Math.floor(S.mult*2):6+Math.floor(S.mult);
 if(key===S.popKey)return;
 S.popKey=key;
 const tier=S.mult>=10?3:S.mult>=5?2:S.mult>=2?1:0;
 const m=$("mult");m.className=tier===3?"t3":tier===2?"t2":tier===1?"t1":"";
 void m.offsetWidth;m.classList.add("pop");
 S.pt=performance.now();sfx.pop(S.mult);sparkle();
 if(tier>S.tier){S.tier=tier;sfx.tier();S.rings.push({x:S.kp.x,y:S.kp.y,l:1})}}

// ---------- Alur ronde ----------
const kiteScale=()=>Math.max(.8,H/300);
const kiteLift=m=>Math.min(Math.log(m)*H*.14,H*.22);
function startRound(){S.phase="fly";S.crashAt=genCrash();S.t0=performance.now();S.mult=1;S.cashed=false;S.k=null;
 S.popKey=2;S.tier=0;S.parts=[];S.conf=[];S.rings=[];$("mult").className="";
 if(S.my){S.st.r++;S.st.w+=S.my;S.cur=S.st.r}
 sfx.start();
 setMsg("TERBANG!");document.body.classList.remove("crash");ui()}
function cashOut(){
 if(S.phase!=="fly"||!S.my||S.cashed)return;
 const win=Math.floor(S.my*S.mult);S.saldo+=win;S.st.n+=win-S.my;S.cashed=true;
 sfx.cash(S.mult);addLog(S.cur,S.my,S.mult,true,win-S.my);floatText("+"+rp(win-S.my),"win");
 confetti(Math.min(70,22+Math.floor(S.mult*4)));
 setMsg("CASH OUT +"+rp(win));ui()}
function crash(){
 const lost=S.my&&!S.cashed;
 S.phase="crash";S.mult=S.crashAt;S.tw=performance.now();
 if(lost){S.st.n-=S.my;addLog(S.cur,S.my,S.crashAt,false,S.my);floatText("−"+rp(S.my),"lose")}
 $("mult").className="";
 S.hist.unshift(S.crashAt);S.hist=S.hist.slice(0,14);renderHist(true);
 S.k={x:S.kp.x,y:S.kp.y,vx:90+Math.random()*60,vy:-60-Math.random()*40,r:0,vr:1.2+Math.random()};
 sfx.snap(lost);shake();
 setMsg("PUTUS!");document.body.classList.add("crash");ui()}
function nextWait(){S.phase="wait";S.my=0;S.cashed=false;S.mult=1;S.k=null;S.tw=performance.now();$("mult").className="";document.body.classList.remove("crash");ui()}

$("go").onclick=()=>{
 audio();
 if(S.phase==="wait"){
  if(S.my){S.saldo+=S.my;S.my=0;sfx.cancel()}
  else if(S.saldo>=S.bet){S.saldo-=S.bet;S.my=S.bet;sfx.bet()}
  ui()}
 else cashOut()};

function setBet(v,typed){
 S.bet=v;
 document.querySelectorAll("[data-b]").forEach(x=>x.classList.toggle("on",+x.dataset.b===v));
 if(!typed)$("manual").value=document.querySelector("[data-b].on")?"":v;
 $("mhint").textContent="";ui()}
document.querySelectorAll("[data-b]").forEach((b,i)=>b.onclick=()=>{
 if(S.my)return;audio();sfx.chip(i);setBet(+b.dataset.b)});
$("manual").oninput=()=>{
 if(S.my)return;
 const v=Math.floor(+$("manual").value);
 if(!v||v<MIN_BET){$("mhint").textContent="Minimal "+rp(MIN_BET);return}
 setBet(v,true);
 if(v>S.saldo)$("mhint").textContent="Melebihi saldo ("+rp(S.saldo)+")"};
$("half").onclick=()=>{if(S.my)return;audio();sfx.chip(1);setBet(Math.max(MIN_BET,Math.floor(S.bet/2)))};
$("dbl").onclick=()=>{if(S.my)return;audio();sfx.chip(3);
 setBet(Math.max(MIN_BET,Math.min(S.bet*2,Math.floor(S.saldo/MIN_BET)*MIN_BET)))};
$("maxb").onclick=()=>{if(S.my)return;audio();sfx.chip(5);
 setBet(Math.max(MIN_BET,Math.floor(S.saldo/MIN_BET)*MIN_BET))};
$("topup").onclick=()=>{audio();S.saldo+=SALDO_AWAL;sfx.cash(3);ui()};

// ---------- Gambar ----------
function kite(x,y,s,rot,fl,withString){
 if(withString){
  ctx.strokeStyle="rgba(255,255,255,.9)";ctx.lineWidth=1.5;ctx.beginPath();
  ctx.moveTo(x,y+36*s);ctx.quadraticCurveTo(x+Math.sin(fl*2)*24*s,(y+H)/2,W/2,H+10);ctx.stroke()}
 ctx.save();ctx.translate(x,y);ctx.rotate(rot+Math.sin(fl*2.2)*.08);ctx.scale(s,s);
 // ekor dengan pita
 ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,36);
 for(let i=1;i<=24;i++){const t=i/24;ctx.lineTo(Math.sin(fl*5-t*7)*(6+t*8),36+t*70)}
 ctx.stroke();
 for(let k=1;k<=4;k++){
  const t=k/5,px=Math.sin(fl*5-t*7)*(6+t*8),py=36+t*70;
  ctx.fillStyle=k%2?"#ff3d7f":"#ffd23f";
  ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-8,py-5);ctx.lineTo(px-8,py+5);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+8,py-5);ctx.lineTo(px+8,py+5);ctx.closePath();ctx.fill()}
 // badan layangan (4 segitiga)
 const T=[0,-40],R=[26,-6],B=[0,36],L=[-26,-6],C=[0,-6];
 const tri=(a,b,c,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.lineTo(...c);ctx.closePath();ctx.fill()};
 tri(T,L,C,"#e0245e");tri(T,R,C,"#ffd23f");tri(B,R,C,"#e0245e");tri(B,L,C,"#ffd23f");
 ctx.strokeStyle="#6b3a1d";ctx.lineWidth=1.5;
 ctx.beginPath();ctx.moveTo(...T);ctx.lineTo(...R);ctx.lineTo(...B);ctx.lineTo(...L);ctx.closePath();ctx.stroke();
 ctx.beginPath();ctx.moveTo(...T);ctx.lineTo(...B);ctx.moveTo(...L);ctx.lineTo(...R);ctx.stroke();
 ctx.restore()}

function cloud(x,y,r){
 ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.arc(x+r*.9,y+r*.15,r*.8,0,6.283);
 ctx.arc(x-r*.9,y+r*.2,r*.7,0,6.283);ctx.arc(x+r*.2,y-r*.5,r*.7,0,6.283);ctx.fill()}

function draw(now){
 const dt=Math.min(.05,(now-S.last)/1000);S.last=now;
 const ease=k=>Math.min(1,dt*k);
 // ----- logika -----
 if(S.phase==="wait"){
  S.cd=Math.max(0,5-(now-S.tw)/1000);
  const c=Math.ceil(S.cd);
  if(c!==S.tick){S.tick=c;if(c>0&&c<=3)sfx.tick()}
  if(now>S.nextChirp){S.nextChirp=now+1400+Math.random()*2400;if(ac&&!muted&&ac.state==="running")sfx.chirp()}
  $("mult").textContent=fmt(1);setMsg("RONDE BERIKUTNYA DALAM "+c+"s");
  if(S.cd<=0)startRound();
 }else if(S.phase==="fly"){
  const t=(now-S.t0)/1000;S.mult=Math.exp(.1*t);
  const a=parseFloat($("auto").value);
  if(S.my&&!S.cashed&&a>=1.1&&S.mult>=a)cashOut();
  if(S.mult>=S.crashAt)crash();
  else{$("mult").textContent=fmt(S.mult);updateWind();bump();if(S.my&&!S.cashed)$("go").textContent="CASH OUT +"+rp(S.my*S.mult)}
 }else if(S.phase==="crash"){
  $("mult").textContent=fmt(S.crashAt);
  if(now-S.tw>3000)nextWait();
 }
 // ----- transisi halus -----
 S.heat+=((S.phase==="crash"?1:0)-S.heat)*ease(6);
 const wt=S.phase==="fly"?Math.min(Math.log(S.mult)/Math.log(20),1)*.7:0;
 S.warm+=(wt-S.warm)*ease(2);
 const lt=S.phase==="fly"?kiteLift(S.mult):0;
 const vel=lt-S.lift;
 S.lift+=vel*ease(S.phase==="fly"?5:3);
 S.disp+=(S.saldo-S.disp)*ease(7);if(Math.abs(S.saldo-S.disp)<1)S.disp=S.saldo;
 const bt=rp(S.disp);if(bt!==lastBal){$("bal").textContent=bt;lastBal=bt}
 const hot=S.heat;
 // ----- langit (biru → jingga saat naik → senja saat putus) -----
 const g=ctx.createLinearGradient(0,0,0,H);
 g.addColorStop(0,rgb(lerpc(lerpc(COL.topB,COL.topW,S.warm),COL.topH,hot)));
 g.addColorStop(1,rgb(lerpc(lerpc(COL.botB,COL.botW,S.warm),COL.botH,hot)));
 ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 // matahari + cahaya berdenyut, turun pelan saat kali naik
 const sx=W*.85,sy=H*(.22+S.warm*.12),sr=H*.1,pulse=1+Math.sin(now/900)*.06;
 const sg=ctx.createRadialGradient(sx,sy,sr*.4,sx,sy,sr*2.6*pulse);
 sg.addColorStop(0,"rgba(255,230,120,.55)");sg.addColorStop(1,"rgba(255,230,120,0)");
 ctx.globalAlpha=1-hot*.7;ctx.fillStyle=sg;ctx.fillRect(sx-sr*3,sy-sr*3,sr*6,sr*6);ctx.globalAlpha=1;
 ctx.fillStyle=rgb(lerpc(COL.sun,COL.sunH,hot));ctx.beginPath();ctx.arc(sx,sy,sr,0,6.283);ctx.fill();
 // burung terbang
 ctx.globalAlpha=1-hot;ctx.strokeStyle="rgba(30,40,70,.55)";ctx.lineWidth=1.6;
 for(const b of birds){b.x+=b.v*dt;if(b.x>1.1){b.x=-.1;b.y=.1+Math.random()*.25}
  const x=b.x*W,y=b.y*H+Math.sin(now/600+b.ph)*H*.01,w=H*.025,f=Math.sin(now/110+b.ph)*w*.6;
  ctx.beginPath();ctx.moveTo(x-w,y-f);ctx.quadraticCurveTo(x-w*.4,y+w*.1,x,y);ctx.quadraticCurveTo(x+w*.4,y+w*.1,x+w,y-f);ctx.stroke()}
 ctx.globalAlpha=1;
 // awan
 const sp=S.phase==="fly"?.012+Math.min(S.mult,10)*.006:.008;
 ctx.fillStyle=`rgba(255,${Math.round(255-hot*35)},${Math.round(255-hot*35)},${(.9-hot*.55).toFixed(2)})`;
 for(const c of clouds){c.x-=sp*c.z*dt*3;if(c.x<-.2){c.x=1.2;c.y=Math.random()*.6}
  cloud(c.x*W,c.y*H,H*.045*c.z)}
 // bukit
 ctx.fillStyle=rgb(lerpc(COL.h1,COL.h1H,hot));ctx.beginPath();ctx.ellipse(W*.22,H*1.04,W*.45,H*.2,0,0,6.283);ctx.fill();
 ctx.fillStyle=rgb(lerpc(COL.h2,COL.h2H,hot));ctx.beginPath();ctx.ellipse(W*.8,H*1.08,W*.5,H*.24,0,0,6.283);ctx.fill();
 // ----- layangan -----
 const s=kiteScale();
 if(S.phase!=="crash"){
  const bob=Math.sin(now/300)*4;
  S.kp.x=W/2+Math.sin(now/700)*W*.02;S.kp.y=H*.5-S.lift+bob;
  const tilt=Math.max(-.15,Math.min(.15,vel*.01))+Math.sin(now/1100)*.05;
  ctx.globalAlpha=S.phase==="wait"?Math.min(1,(now-S.tw)/700):1;
  kite(S.kp.x,S.kp.y,s*(1+.15*Math.max(0,1-(now-S.pt)/300)),tilt,now/1000,true);
  ctx.globalAlpha=1}
 else if(S.k){
  const k=S.k;k.vx+=40*dt;k.x+=k.vx*dt;k.y+=k.vy*dt;k.r+=k.vr*dt;
  ctx.globalAlpha=Math.max(0,1-(now-S.tw)/2800);
  kite(k.x,k.y,s,k.r,now/1000,false);ctx.globalAlpha=1}
 // gelombang cincin saat naik tingkat
 S.rings=S.rings.filter(r=>r.l>0);
 for(const r of S.rings){r.l-=dt*1.1;ctx.globalAlpha=Math.max(0,r.l)*.7;ctx.strokeStyle="#fff";ctx.lineWidth=3*r.l+1;
  ctx.beginPath();ctx.arc(r.x,r.y,(1-r.l)*H*.5+10,0,6.283);ctx.stroke()}
 ctx.globalAlpha=1;
 // percikan bintang
 S.parts=S.parts.filter(p=>p.l>0);
 for(const p of S.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt*1.6;ctx.globalAlpha=Math.max(0,p.l);ctx.fillStyle="#fff7a8";
  ctx.beginPath();ctx.moveTo(p.x,p.y-5*p.l-1);ctx.lineTo(p.x+3,p.y);ctx.lineTo(p.x,p.y+5*p.l+1);ctx.lineTo(p.x-3,p.y);ctx.closePath();ctx.fill()}
 // konfeti saat cash out
 S.conf=S.conf.filter(p=>p.l>0);
 for(const p of S.conf){p.vy+=420*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.vr*dt;p.l-=dt*.6;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.globalAlpha=Math.min(1,p.l*1.5);ctx.fillStyle=p.c;ctx.fillRect(-3,-2,6,4);ctx.restore()}
 ctx.globalAlpha=1;
 requestAnimationFrame(draw)}
ui();renderHist();renderLog();requestAnimationFrame(draw);