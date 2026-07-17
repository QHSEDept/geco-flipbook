import { LOGO_SRC } from "./logo.mjs";

// Builds the full self-contained-looking flipbook HTML page.
// imageUrls: ordered array of URLs (e.g. "/img/{slug}/0") for each content page.
// A final CSS-based "Thank You" page is always appended, matching the
// original GECO_Flipbook_Template.html engine exactly (curl animation,
// start screen, controls, keyboard/swipe/tap handling).
export function buildFlipbookHtml(imageUrls, title) {
  const safeTitle = (title || "GECO Flipbook").replace(/</g, "&lt;");
  const pagesJs = JSON.stringify([...imageUrls, "THANKYOU"]);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${safeTitle}</title>
<style>
html,body{margin:0;height:100%;background:#111;font-family:Arial,sans-serif;overflow:hidden}
#viewer{
 height:100vh;width:100vw;display:flex;align-items:center;justify-content:center;
 position:relative;cursor:pointer;perspective:2400px;
}
.pageWrap{
 position:absolute;
 width:min(96vw,1400px);
 aspect-ratio:16/9;
 transform-style:preserve-3d;
 opacity:0;
 z-index:0;
 transform:rotateY(0deg);
}
.page{
 position:absolute; inset:0;
 background:#222 center/contain no-repeat;
 border-radius:12px;
 box-shadow:0 10px 40px rgba(0,0,0,.45);
 transform-origin:left center;
 backface-visibility:hidden;
}
.pageWrap.flipping{ transition:transform .8s cubic-bezier(.45,.05,.35,1); }

.curlShadow{
 position:absolute; inset:0; border-radius:12px; pointer-events:none;
 background:linear-gradient(90deg, rgba(0,0,0,0) 55%, rgba(0,0,0,.6) 100%);
 opacity:0; transition:opacity .8s cubic-bezier(.45,.05,.35,1);
}
.curlHighlight{
 position:absolute; inset:0; border-radius:12px; pointer-events:none;
 background:linear-gradient(90deg, rgba(255,255,255,0) 65%, rgba(255,255,255,.4) 100%);
 opacity:0; transition:opacity .8s cubic-bezier(.45,.05,.35,1);
}
.pageWrap.curling .curlShadow,
.pageWrap.curling .curlHighlight{ opacity:1; }

.page.thankyou{
 background-color:#0F2A5C;
 display:flex;align-items:center;justify-content:center;
}
.page.thankyou span{
 color:#fff;font-size:clamp(32px,7vw,64px);font-weight:800;letter-spacing:2px;
}

.brand{
 position:fixed;top:14px;left:14px;display:flex;align-items:center;gap:8px;z-index:15;
 pointer-events:none;
}
.brand img{height:28px;background:#fff;border-radius:5px;padding:3px;opacity:.9;}

#closeBtn{
 position:fixed;top:14px;right:18px;z-index:20;
 background:none;border:none;color:#fff;font-size:30px;line-height:1;
 cursor:pointer;padding:4px 8px;opacity:.85;font-weight:300;
}
#closeBtn:hover{opacity:1;}

#rotateBtn{
 position:fixed;top:14px;left:52px;z-index:15;
 background:none;border:none;color:#fff;font-size:20px;
 cursor:pointer;opacity:.75;display:none;padding:4px;
}
@media (max-width:820px) and (pointer:coarse){ #rotateBtn{display:block;} }

.navArrow{
 position:fixed;bottom:26px;z-index:15;
 background:none;border:none;color:#fff;
 font-size:34px;line-height:1;cursor:pointer;opacity:.55;
 padding:6px 14px;transition:opacity .2s ease;
}
.navArrow:hover{opacity:.95;}
.navArrow:disabled{opacity:.15;cursor:default;}
#prevBtn{left:18px;}
#nextBtn{right:18px;}

#counter{
 position:fixed;bottom:30px;left:50%;transform:translateX(-50%);
 color:#fff;opacity:.55;font-size:12px;font-weight:600;letter-spacing:.5px;z-index:15;
 pointer-events:none;
}

#startScreen{
 position:fixed;inset:0;background:#0F2A5C;z-index:50;
 display:flex;flex-direction:column;align-items:center;justify-content:center;
 color:#fff;text-align:center;cursor:pointer;padding:6%;
}
#startScreen img{height:56px;background:#fff;border-radius:8px;padding:5px;margin-bottom:22px;}
#startScreen h1{font-size:clamp(18px,4vw,28px);margin:0 0 10px 0;}
#startScreen p{color:#9fb0cc;font-size:clamp(12px,2vw,15px);max-width:80%;margin:0;}
#startScreen .rotIcon{font-size:26px;margin-top:18px;opacity:.85;display:none;}
@media (max-width:820px) and (pointer:coarse){ #startScreen .rotIcon{display:block;} }
#startScreen.hide{display:none;}
</style>
</head>
<body>

<div id="startScreen">
  <img src="${LOGO_SRC}" alt="GECO logo">
  <h1>GECO — HSE Flipbook</h1>
  <p>Tap anywhere to begin in full screen. Space bar or tap to flip forward.</p>
  <div class="rotIcon">&#8635; Rotate your device for the best view</div>
</div>

<div class="brand"><img src="${LOGO_SRC}" alt="GECO logo"></div>
<button id="rotateBtn" title="Rotate view">&#8635;</button>
<button id="closeBtn" title="Close">&times;</button>

<div id="viewer"></div>

<button id="prevBtn" class="navArrow" title="Previous page">&#10094;</button>
<button id="nextBtn" class="navArrow" title="Next page">&#10095;</button>
<div id="counter"></div>

<script>
const pages = ${pagesJs};

const viewer=document.getElementById("viewer");
let els=[];
pages.forEach((p)=>{
 const wrap=document.createElement("div");
 wrap.className="pageWrap";
 const d=document.createElement("div");
 if(p === "THANKYOU"){
   d.className="page thankyou";
   d.innerHTML = \`<span>Thank You</span>\`;
 } else {
   d.className="page";
   d.style.backgroundImage=\`url('\${p}')\`;
 }
 const shadow=document.createElement("div");
 shadow.className="curlShadow";
 const highlight=document.createElement("div");
 highlight.className="curlHighlight";
 wrap.appendChild(d);
 wrap.appendChild(shadow);
 wrap.appendChild(highlight);
 viewer.appendChild(wrap);
 els.push(wrap);
});

let index=0;
let animating=false;

function updateCounter(){
  document.getElementById('counter').textContent = \`\${index+1} / \${pages.length}\`;
  document.getElementById('prevBtn').disabled = index===0;
  document.getElementById('nextBtn').disabled = index===pages.length-1;
}

function showOnly(idx){
 els.forEach((w,i)=>{
   w.classList.remove('flipping','curling');
   w.style.transform='rotateY(0deg)';
   if(i===idx){
     w.style.opacity='1';
     w.style.zIndex='1';
   } else {
     w.style.opacity='0';
     w.style.zIndex='0';
   }
 });
 updateCounter();
}

function flip(dir){
 if(animating) return;
 const targetIdx = index + dir;
 if(targetIdx < 0 || targetIdx >= pages.length) return;
 animating = true;

 const fromWrap = els[index];
 const toWrap = els[targetIdx];

 toWrap.classList.remove('flipping','curling');
 toWrap.style.transform = 'rotateY(0deg)';
 toWrap.style.opacity = '1';
 toWrap.style.zIndex = '1';

 fromWrap.style.zIndex = '2';
 fromWrap.style.opacity = '1';
 fromWrap.classList.add('curling');

 void fromWrap.offsetWidth;
 fromWrap.classList.add('flipping');
 requestAnimationFrame(()=>{
   fromWrap.style.transform = dir>0 ? 'rotateY(-165deg)' : 'rotateY(165deg)';
 });

 setTimeout(()=>{
   fromWrap.classList.remove('flipping','curling');
   fromWrap.style.transform = 'rotateY(0deg)';
   fromWrap.style.opacity = '0';
   fromWrap.style.zIndex = '0';

   index = targetIdx;
   updateCounter();
   animating = false;
 }, 820);
}

function next(){ flip(1); }
function prev(){ flip(-1); }

document.addEventListener("keydown",e=>{
 if(e.code==="Space"){ e.preventDefault(); next(); }
 if(e.key==="ArrowRight")next();
 if(e.key==="ArrowLeft")prev();
});

viewer.addEventListener("click",()=> next());

let sx=0;
viewer.addEventListener("touchstart",e=>sx=e.touches[0].clientX);
viewer.addEventListener("touchend",e=>{
 let dx=e.changedTouches[0].clientX-sx;
 if(dx<-40)next();
 if(dx>40)prev();
});

document.getElementById("nextBtn").addEventListener("click",(e)=>{ e.stopPropagation(); next(); });
document.getElementById("prevBtn").addEventListener("click",(e)=>{ e.stopPropagation(); prev(); });

document.getElementById("closeBtn").addEventListener("click",(e)=>{
 e.stopPropagation();
 if(document.fullscreenElement){ document.exitFullscreen().catch(()=>{}); }
 window.close();
});

function tryRotateLandscape(){
 if(screen.orientation && screen.orientation.lock){
   screen.orientation.lock("landscape").catch(()=>{});
 }
}
document.getElementById("rotateBtn").addEventListener("click",(e)=>{
 e.stopPropagation();
 tryRotateLandscape();
});

function beginExperience(){
 const el = document.documentElement;
 const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
 if(req){ req.call(el).catch(()=>{}); }
 tryRotateLandscape();
 document.getElementById("startScreen").classList.add("hide");
 showOnly(0);
}
document.getElementById("startScreen").addEventListener("click", beginExperience);
document.getElementById("startScreen").addEventListener("touchend", (e)=>{ e.preventDefault(); beginExperience(); });
document.addEventListener("keydown", function firstKey(){
  if(!document.getElementById("startScreen").classList.contains("hide")){
    beginExperience();
  }
});
</script>
</body>
</html>`;
}
