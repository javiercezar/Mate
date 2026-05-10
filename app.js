const FORMATS = [
  {
    name: "Cruz",
    size: 15,
    lines: [
      {r:0, c:0, d:"h", hide:[0]},
      {r:0, c:4, d:"v", hide:[4]},
      {r:2, c:2, d:"h", hide:[2]},
      {r:2, c:6, d:"v", hide:[4]},
      {r:4, c:4, d:"h", hide:[0]},
      {r:4, c:8, d:"v", hide:[4]},
      {r:6, c:6, d:"h", hide:[2]},
      {r:6, c:10, d:"v", hide:[4]},
      {r:8, c:8, d:"h", hide:[0]},
      {r:8, c:12, d:"v", hide:[4]},
      {r:10, c:10, d:"h", hide:[2]},
    ]
  },
  {
    name: "Escalera",
    size: 15,
    lines: [
      {r:0, c:0, d:"h", hide:[0]},
      {r:0, c:2, d:"v", hide:[4]},
      {r:2, c:2, d:"h", hide:[2]},
      {r:2, c:4, d:"v", hide:[4]},
      {r:4, c:4, d:"h", hide:[0]},
      {r:4, c:6, d:"v", hide:[4]},
      {r:6, c:6, d:"h", hide:[2]},
      {r:6, c:8, d:"v", hide:[4]},
      {r:8, c:8, d:"h", hide:[0]},
      {r:8, c:10, d:"v", hide:[4]},
      {r:10, c:10, d:"h", hide:[2]},
      {r:10, c:12, d:"v", hide:[4]},
    ]
  },
  {
    name: "Puente",
    size: 15,
    lines: [
      {r:0, c:2, d:"h", hide:[0]},
      {r:0, c:6, d:"v", hide:[4]},
      {r:2, c:4, d:"h", hide:[2]},
      {r:2, c:8, d:"v", hide:[4]},
      {r:4, c:6, d:"h", hide:[0]},
      {r:4, c:10, d:"v", hide:[4]},
      {r:6, c:8, d:"h", hide:[2]},
      {r:6, c:12, d:"v", hide:[4]},
      {r:8, c:10, d:"h", hide:[0]},
      {r:8, c:14, d:"v", hide:[4]},
    ]
  }
];

const DIFFICULTIES = [
  {name:"Fácil",hints:4,maxNum:50,level:0},
  {name:"Medio",hints:2,maxNum:99,level:1},
  {name:"Difícil",hints:1,maxNum:99,level:2},
];

const THEMES = [
  {cell:"#ffebb0",slot:"#fff8df",num:"#e8fbff",green:"#098c43",red:"#dc2626",blue:"#234fbd",bg:"linear-gradient(145deg,#f4f7fd,#dfe7f5)"},
  {cell:"#d4edda",slot:"#e8f5e9",num:"#c8e6c9",green:"#1b5e20",red:"#c62828",blue:"#1565c0",bg:"linear-gradient(145deg,#e8f5e9,#c8e6c9)"},
  {cell:"#e1bee7",slot:"#f3e5f5",num:"#f3e5f5",green:"#4a148c",red:"#b71c1c",blue:"#283593",bg:"linear-gradient(145deg,#f3e5f5,#e1bee7)"},
  {cell:"#ffe0b2",slot:"#fff3e0",num:"#ffe0b2",green:"#e65100",red:"#bf360c",blue:"#0d47a1",bg:"linear-gradient(145deg,#fff3e0,#ffe0b2)"},
];

let currentPuzzle=null,selected=null,placed={},seconds=0,running=true,timerId=null,hints=2,draggedTile=null,touchTile=null,didDrag=false,dragStartX=0,dragStartY=0,currentDifficulty=1;
const board=document.getElementById("board"),numbers=document.getElementById("numbers"),timer=document.getElementById("timer"),modal=document.getElementById("modal"),modalTitle=document.getElementById("modalTitle"),modalText=document.getElementById("modalText"),formatSelect=document.getElementById("formatSelect"),difficultySelect=document.getElementById("difficultySelect"),message=document.getElementById("message"),ghost=document.getElementById("dragGhost"),availableCount=document.getElementById("availableCount");

function key(r,c){return`${r}-${c}`}
function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function shuffle(a){return[...a].sort(()=>Math.random()-.5)}
function coords(line,i){return{r:line.r+(line.d==="v"?i:0),c:line.c+(line.d==="h"?i:0)}}
function calc(a,op,b){
  if(op==="+")return a+b;
  if(op==="−")return a-b;
  if(op==="×")return a*b;
  if(op==="÷"){
    if(b===0||a%b!==0)return null;
    return a/b;
  }
  return null;
}

function randomEquation5(maxNum,level){
  const ops=["+","−","×","÷"];
  for(let t=0;t<500;t++){
    const op=ops[rnd(0,3)];
    let a,b,c;
    if(op==="+"){
      if(level>=2){a=rnd(20,Math.min(49,maxNum-1));b=rnd(20,Math.min(49,maxNum-a));if(b<20||a+b>maxNum)continue;c=a+b}
      else{a=rnd(1,Math.min(50,maxNum));b=rnd(1,Math.min(50,maxNum));c=a+b;if(c>maxNum)continue}
    }else if(op==="−"){
      if(level>=2){a=rnd(30,maxNum);b=rnd(15,Math.min(a-5,maxNum));if(b<15)continue;c=a-b}else{a=rnd(2,maxNum);b=rnd(1,Math.min(a-1,maxNum));c=a-b}
    }else if(op==="×"){
      if(level>=2){a=rnd(3,Math.min(15,maxNum));const mb=Math.min(9,Math.floor(maxNum/a));if(mb<2)continue;b=rnd(2,mb);c=a*b}
      else{a=rnd(1,Math.min(12,maxNum));b=rnd(1,Math.min(9,Math.floor(maxNum/a)));if(b<1)continue;c=a*b}
    }else{
      if(level>=2){b=rnd(2,Math.min(15,maxNum));const mc=Math.min(9,Math.floor(maxNum/b));if(mc<2)continue;c=rnd(2,mc);a=b*c}
      else{b=rnd(1,Math.min(12,maxNum));const mc=Math.min(9,Math.floor(maxNum/b));if(mc<1)continue;c=rnd(1,mc);a=b*c}
    }
    if([a,b,c].every(n=>Number.isInteger(n)&&n>=1&&n<=maxNum))return[a,op,b,"=",c];
  }
  return[1,"+",1,"=",2];
}

function equationWithKnown5(idx,val,maxNum,level){
  const ops=["+","−","×","÷"];
  for(let t=0;t<1000;t++){
    const op=ops[rnd(0,3)];
    let a,b,c;
    if(idx===0){
      a=val;
      if(op==="+"){
        if(level>=2){b=rnd(20,Math.min(49,maxNum-a));if(b<20||a+b>maxNum)continue;c=a+b}
        else{b=rnd(1,Math.min(50,maxNum));c=a+b;if(c>maxNum)continue}
      }else if(op==="−"){
        if(a<=1)continue;b=rnd(1,Math.min(a-1,maxNum));c=a-b
      }else if(op==="×"){
        b=rnd(level>=2?2:1,Math.min(9,Math.floor(maxNum/a)));if(b<(level>=2?2:1))continue;c=a*b
      }else{
        const d=[];const maxD=level>=2?15:12;const maxR=9;
        for(let i=level>=2?2:1;i<=maxD;i++)if(a%i===0&&a/i<=maxR)d.push(i);
        if(!d.length)continue;b=d[rnd(0,d.length-1)];c=a/b
      }
    }else if(idx===2){
      b=val;
      if(op==="+"){
        if(level>=2){a=rnd(20,Math.min(49,maxNum-b));if(a<20||a+b>maxNum)continue;c=a+b}
        else{a=rnd(1,Math.min(50,maxNum));c=a+b;if(c>maxNum)continue}
      }else if(op==="−"){
        a=rnd(b+1,maxNum);c=a-b
      }else if(op==="×"){
        a=rnd(level>=2?2:1,Math.min(15,Math.floor(maxNum/b)));if(a<(level>=2?2:1))continue;c=a*b
      }else{
        for(let i=level>=2?2:1;i<=15;i++){const a2=i*b;if(a2<=maxNum&&a2/b<=9){a=a2;c=i;break}}
        if(!a)continue
      }
    }else{
      c=val;
      if(op==="+"){
        if(c<2)continue;a=rnd(1,c-1);b=c-a
      }else if(op==="−"){
        b=rnd(level>=2?5:1,Math.min(level>=2?Math.min(40,maxNum-c):30,maxNum));a=c+b;if(a>maxNum)continue
      }else if(op==="×"){
        const d=[];for(let i=level>=2?2:1;i<=12;i++)if(c%i===0&&c/i<=9)d.push(i);
        if(!d.length)continue;a=d[rnd(0,d.length-1)];b=c/a
      }else{
        for(let i=level>=2?2:1;i<=12;i++){const a2=i*c;if(a2<=maxNum){a=a2;b=i;break}}
        if(!a)continue
      }
    }
    if([a,b,c].every(n=>Number.isInteger(n)&&n>=1&&n<=maxNum)){
      const v=[a,op,b,"=",c];
      if(Number(v[idx])===val)return v;
    }
  }
  return null;
}

function validLine(cells,line,v,size){
  for(let i=0;i<5;i++){
    const p=coords(line,i);
    if(p.r<0||p.r>=size||p.c<0||p.c>=size)return false;
    const old=cells[p.r][p.c];
    if(old!==""&&String(old)!==String(v[i]))return false;
  }
  return true;
}

function lineCandidate(cells,line,maxNum,level){
  const known=[];
  for(const idx of[0,2,4]){
    const p=coords(line,idx),old=cells[p.r]?.[p.c];
    if(old!==""&&/^\d+$/.test(String(old)))known.push({idx,val:Number(old)});
  }
  if(!known.length)return randomEquation5(maxNum,level);
  for(let t=0;t<700;t++){
    const first=known[0];
    const v=equationWithKnown5(first.idx,first.val,maxNum,level);
    if(!v)continue;
    if(known.every(k=>Number(v[k.idx])===k.val))return v;
  }
  return null;
}

function verifyAll(cells,format){
  for(const line of format.lines){
    const v=[];
    for(let i=0;i<5;i++){const p=coords(line,i);v.push(cells[p.r][p.c])}
    if(v[3]!=="="||!["+","−","×","÷"].includes(v[1]))return false;
    for(const i of[0,2,4]){const n=Number(v[i]);if(!Number.isInteger(n)||n<1||n>99)return false}
    if(calc(Number(v[0]),v[1],Number(v[2]))!==Number(v[4]))return false;
  }
  return true;
}

function generatePuzzle(){
  const diff=DIFFICULTIES[currentDifficulty];
  const format=FORMATS[Number(formatSelect.value)||0];
  for(let attempt=0;attempt<200;attempt++){
    const size=format.size;
    const cells=Array.from({length:size},()=>Array(size).fill(""));
    let failed=false;
    for(const line of format.lines){
      let values=null;
      for(let t=0;t<700;t++){
        const cand=lineCandidate(cells,line,diff.maxNum,diff.level);
        if(cand&&validLine(cells,line,cand,size)){values=cand;break}
      }
      if(!values){failed=true;break}
      for(let i=0;i<5;i++){const p=coords(line,i);cells[p.r][p.c]=String(values[i])}
    }
    if(failed||!verifyAll(cells,format))continue;
    const traySize=[10,15,20][currentDifficulty];
    const lines=format.lines;
    const perLineBlanks=lines.map(()=>[]);
    if(traySize<lines.length){
      const lineIndices=shuffle([...Array(lines.length).keys()]);
      for(let i=0;i<traySize;i++){
        perLineBlanks[lineIndices[i]].push([0,2,4][rnd(0,2)]);
      }
    }else{
      for(let i=0;i<lines.length;i++){
        perLineBlanks[i].push([0,2,4][rnd(0,2)]);
      }
      const remaining=[];
      for(let i=0;i<lines.length;i++){
        for(const idx of[0,2,4]){
          if(!perLineBlanks[i].includes(idx)){
            remaining.push({lineIdx:i,idx});
          }
        }
      }
      shuffle(remaining);
      const extra=Math.min(traySize-lines.length,remaining.length);
      for(let j=0;j<extra;j++){
        perLineBlanks[remaining[j].lineIdx].push(remaining[j].idx);
      }
    }
    const solution={},hidden=[];
    for(let i=0;i<lines.length;i++){
      for(const idx of perLineBlanks[i]){
        const p=coords(lines[i],idx),k=key(p.r,p.c),value=cells[p.r][p.c];
        if(solution[k]===undefined){
          solution[k]=Number(value);
          hidden.push(Number(value));
          cells[p.r][p.c]="";
        }
      }
    }
    return{size,cells,solution,numbers:shuffle([...hidden]),hints:diff.hints,name:format.name};
  }
  alert("No se pudo generar el formato. Probá nuevamente.");
  return{size:5,cells:[["1","+","","=","2"],["","","","",""],["","","","",""],["","","","",""],["","","","",""]],solution:{"0-2":1},numbers:[1],hints:1,name:"Emergencia"};
}

function setMessage(t,type=""){message.textContent=t;message.className="message"+(type?" "+type:"")}

function applyTheme(theme){
  const r=document.documentElement;
  r.style.setProperty("--cell",theme.cell);
  r.style.setProperty("--slot",theme.slot);
  r.style.setProperty("--num",theme.num);
  r.style.setProperty("--green",theme.green);
  r.style.setProperty("--red",theme.red);
  r.style.setProperty("--blue",theme.blue);
  document.body.style.background=theme.bg;
}

function init(){
  FORMATS.forEach((f,i)=>{const o=document.createElement("option");o.value=i;o.textContent=f.name;formatSelect.appendChild(o)});
  formatSelect.onchange=restart;
  difficultySelect.onchange=()=>{currentDifficulty=Number(difficultySelect.value);setMessage(`${DIFFICULTIES[currentDifficulty].name}`);restart()};
  document.getElementById("newBtn").onclick=restart;
  document.getElementById("pauseBtn").onclick=pause;
  document.getElementById("modalBtn").onclick=resume;
  document.getElementById("checkBtn").onclick=checkAll;
  document.getElementById("hintBtn").onclick=useHint;
  restart();startTimer();
}

function buildBoard(){
  const p=currentPuzzle;
  board.innerHTML="";
  board.style.gridTemplateColumns=`repeat(${p.size},1fr)`;
  board.style.gridTemplateRows=`repeat(${p.size},1fr)`;
  for(let r=0;r<p.size;r++){
    for(let c=0;c<p.size;c++){
      const val=p.cells[r]?.[c]??"";
      const d=document.createElement("div");
      d.className=val===""?"cell blank":"cell";
      d.dataset.pos=key(r,c);
      if(p.solution[key(r,c)]!==undefined){
        d.className="cell slot";
        d.onclick=()=>selectSlot(d);
        d.addEventListener("dragover",e=>{e.preventDefault();d.classList.add("drag-over")});
        d.addEventListener("dragleave",()=>d.classList.remove("drag-over"));
        d.addEventListener("drop",e=>{e.preventDefault();d.classList.remove("drag-over");if(draggedTile){selectSlot(d);placeNumber(draggedTile)}});
      }else{
        d.textContent=val;
        if(val==="+")d.classList.add("symbol","op-add");
        else if(val==="−")d.classList.add("symbol","op-sub");
        else if(val==="×")d.classList.add("symbol","op-mul");
        else if(val==="÷")d.classList.add("symbol","op-div");
        else if(val==="=")d.classList.add("symbol","op-eq");
        else if(/^\d+$/.test(val))d.classList.add("num");
      }
      board.appendChild(d);
    }
  }
}

function buildNumbers(){
  numbers.innerHTML="";
  currentPuzzle.numbers.forEach((n,i)=>{
    const b=document.createElement("button");
    b.className="tile";b.textContent=n;b.dataset.index=i;b.dataset.value=n;b.draggable=true;
    b.onclick=()=>{if(didDrag){didDrag=false;return}if(!touchTile)placeByClick(b)};
    b.addEventListener("dragstart",()=>{draggedTile=b;b.classList.add("dragging")});
    b.addEventListener("dragend",()=>{draggedTile=null;b.classList.remove("dragging");document.querySelectorAll(".drag-over").forEach(x=>x.classList.remove("drag-over"))});
    b.addEventListener("pointerdown",startTouchDrag);
    numbers.appendChild(b);
  });
  updateHints();
  availableCount.textContent=`${currentPuzzle.numbers.length} para completar`;
}

function startTouchDrag(e){
  const btn=e.currentTarget;
  if(btn.classList.contains("used"))return;
  touchTile=btn;didDrag=false;dragStartX=e.clientX;dragStartY=e.clientY;
  const move=ev=>{
    const dx=Math.abs(ev.clientX-dragStartX),dy=Math.abs(ev.clientY-dragStartY);
    if(dx+dy>8){
      didDrag=true;ev.preventDefault();
      ghost.textContent=btn.dataset.value;ghost.classList.remove("hidden");
      moveGhost(ev.clientX,ev.clientY);markSlotUnder(ev.clientX,ev.clientY);
    }
  };
  const finish=ev=>{
    document.removeEventListener("pointermove",move);
    document.removeEventListener("pointerup",finish);
    document.removeEventListener("pointercancel",finish);
    const was=didDrag,slot=was?slotAt(ev.clientX,ev.clientY):null;
    ghost.classList.add("hidden");ghost.textContent="";
    document.querySelectorAll(".drag-over").forEach(x=>x.classList.remove("drag-over"));
    if(was&&slot){selectSlot(slot);placeNumber(btn)}
    else if(was)setMessage("Soltá el número sobre una casilla vacía.","error");
    touchTile=null;
    if(was){didDrag=true;setTimeout(()=>didDrag=false,220)}else didDrag=false;
  };
  document.addEventListener("pointermove",move,{passive:false});
  document.addEventListener("pointerup",finish);
  document.addEventListener("pointercancel",finish);
}

function moveGhost(x,y){ghost.style.left=x+"px";ghost.style.top=y+"px"}
function slotAt(x,y){ghost.classList.add("hidden");const el=document.elementFromPoint(x,y);ghost.classList.remove("hidden");return el?.closest?.(".slot")}
function markSlotUnder(x,y){document.querySelectorAll(".drag-over").forEach(s=>s.classList.remove("drag-over"));const s=slotAt(x,y);if(s)s.classList.add("drag-over")}

function selectSlot(d){document.querySelectorAll(".slot").forEach(x=>x.classList.remove("selected"));selected=d;selected.classList.add("selected")}
function placeByClick(b){if(!selected){const f=[...document.querySelectorAll(".slot")].find(x=>!x.textContent);if(f)selectSlot(f)}placeNumber(b)}
function returnOldTile(pos){if(placed[pos]!==undefined){const old=document.querySelector(`.tile[data-index="${placed[pos].index}"]`);if(old)old.classList.remove("used")}}

function placeNumber(b){
  if(!selected||b.classList.contains("used"))return;
  const pos=selected.dataset.pos,val=Number(b.dataset.value),correct=currentPuzzle.solution[pos];
  selected.classList.remove("correct","wrong");
  if(val!==correct){
    const prev=placed[pos]?.value??"";
    selected.textContent=val;selected.classList.add("wrong");
    setMessage("Error: ese número no corresponde a esa casilla.","error");
    setTimeout(()=>{const cell=document.querySelector(`.slot[data-pos="${pos}"]`);if(cell&&cell.classList.contains("wrong")){cell.textContent=prev;cell.classList.remove("wrong")}},650);
    return;
  }
  returnOldTile(pos);
  selected.textContent=val;selected.classList.add("correct");
  placed[pos]={value:val,index:b.dataset.index};b.classList.add("used");
  setMessage("Correcto.","ok");
  if(isComplete())win();else{const next=[...document.querySelectorAll(".slot")].find(x=>!x.textContent);if(next)selectSlot(next)}
}

function isComplete(){return[...document.querySelectorAll(".slot")].every(c=>Number(c.textContent)===currentPuzzle.solution[c.dataset.pos])}
function checkAll(){let ok=true;document.querySelectorAll(".slot").forEach(c=>{const pos=c.dataset.pos,val=Number(c.textContent);c.classList.remove("correct","wrong");if(!c.textContent||val!==currentPuzzle.solution[pos]){c.classList.add("wrong");ok=false}else c.classList.add("correct")});if(ok)win();else setMessage("Hay casillas vacías o incorrectas.","error")}
function useHint(){if(hints<=0)return;const target=[...document.querySelectorAll(".slot")].find(c=>Number(c.textContent)!==currentPuzzle.solution[c.dataset.pos]);if(!target)return;const pos=target.dataset.pos,cor=currentPuzzle.solution[pos],tile=[...document.querySelectorAll(".tile:not(.used)")].find(t=>Number(t.dataset.value)===cor);if(tile){selectSlot(target);returnOldTile(pos);target.textContent=cor;target.classList.add("correct");placed[pos]={value:cor,index:tile.dataset.index};tile.classList.add("used");hints--;updateHints();setMessage("Pista aplicada.","ok");if(isComplete())win()}}
function updateHints(){document.getElementById("hintsLeft").textContent="x"+hints}
function startTimer(){clearInterval(timerId);timerId=setInterval(()=>{if(!running)return;seconds++;const m=String(Math.floor(seconds/60)).padStart(2,"0"),s=String(seconds%60).padStart(2,"0");timer.textContent=`${m}:${s}`},1000)}
function pause(){running=false;modalTitle.textContent="Pausa";modalText.textContent="Juego pausado.";modal.classList.remove("hidden")}
function resume(){running=true;modal.classList.add("hidden")}
function win(){running=false;modalTitle.textContent="¡Ganaste!";modalText.textContent=`Completaste el crucigrama en ${timer.textContent}.`;modal.classList.remove("hidden")}
function restart(){
  seconds=0;timer.textContent="00:00";running=true;selected=null;placed={};modal.classList.add("hidden");
  applyTheme(THEMES[rnd(0,THEMES.length-1)]);
  currentPuzzle=generatePuzzle();hints=currentPuzzle.hints;buildBoard();buildNumbers();
  setMessage(`${DIFFICULTIES[currentDifficulty].name} · Arrastrá un número a una casilla vacía.`);
}
init();
