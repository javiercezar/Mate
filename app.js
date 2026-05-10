let currentPuzzle = null;
let currentTemplate = 0;
let selected = null;
let placed = {};
let seconds = 0;
let running = true;
let timerId = null;
let hints = 0;
let draggedTile = null;
let touchTile = null;

const board = document.getElementById("board");
const numbers = document.getElementById("numbers");
const timer = document.getElementById("timer");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const levelSelect = document.getElementById("levelSelect");
const modeSelect = document.getElementById("modeSelect");
const templateWrap = document.getElementById("templateWrap");
const message = document.getElementById("message");
const ghost = document.getElementById("dragGhost");
const availableCount = document.getElementById("availableCount");

function key(r,c){ return `${r}-${c}`; }
function rnd(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }

function calc(a, op, b){
  if(op === "+") return a + b;
  if(op === "−") return a - b;
  if(op === "×") return a * b;
  if(op === "/") return b !== 0 && a % b === 0 ? a / b : null;
  return null;
}

function makeEquation(){
  const ops = ["+","−","×"];
  while(true){
    const op = ops[rnd(0, ops.length-1)];
    let a = rnd(1, 18), b = rnd(1, 12);
    if(op === "−" && a <= b) [a,b] = [b,a];
    if(op === "×"){ a = rnd(2,9); b = rnd(2,8); }
    const res = calc(a,op,b);
    if(res > 0 && res <= 99) return {a,op,b,res};
  }
}

function canPlace(cells, positions, values){
  return positions.every((p,i) => {
    const old = cells[p.r][p.c];
    return old === "" || String(old) === String(values[i]);
  });
}

function writeEq(cells, positions, values){
  positions.forEach((p,i) => cells[p.r][p.c] = String(values[i]));
}

// Generador corregido:
// - Arma grupos horizontales compactos.
// - Agrega columnas solamente cuando coinciden matemáticamente con una intersección.
// - Cada fila/columna usada queda como A op B = Resultado.
function generateAutoPuzzle(){
  const size = 11;
  const cells = Array.from({length:size}, () => Array(size).fill(""));
  const solution = {};
  const hiddenNumbers = [];
  const equations = [];

  const horizontalStarts = [
    {r:0,c:0},{r:2,c:0},{r:4,c:0},{r:6,c:0},{r:8,c:0},
    {r:0,c:6},{r:2,c:6},{r:4,c:6},{r:6,c:6},{r:8,c:6}
  ];

  // Primero coloca filas agrupadas.
  for(const s of shuffle(horizontalStarts).slice(0,8)){
    const eq = makeEquation();
    const values = [eq.a, eq.op, eq.b, "=", eq.res];
    const pos = [0,1,2,3,4].map(i => ({r:s.r, c:s.c+i}));
    if(canPlace(cells,pos,values)){
      writeEq(cells,pos,values);
      equations.push({positions:pos, values});
    }
  }

  // Luego intenta columnas reales usando números existentes como intersección.
  const intersections = [];
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(/^\d+$/.test(cells[r][c])) intersections.push({r,c,value:Number(cells[r][c])});
    }
  }

  let verticals = 0;
  for(const inter of shuffle(intersections)){
    if(verticals >= 4) break;

    // La intersección puede ser A, B o Resultado dentro de A op B = Resultado.
    const possibleIndex = shuffle([0,2,4]);
    let placedV = false;

    for(const idx of possibleIndex){
      const startR = inter.r - idx;
      const c = inter.c;
      if(startR < 0 || startR + 4 >= size) continue;

      for(let attempt=0; attempt<80; attempt++){
        const op = ["+","−","×"][rnd(0,2)];
        let a,b,res;

        if(idx === 0){
          a = inter.value;
          b = rnd(1,12);
          if(op === "−" && a <= b) continue;
          if(op === "×") b = rnd(2,8);
          res = calc(a,op,b);
        } else if(idx === 2){
          b = inter.value;
          a = rnd(1,18);
          if(op === "−" && a <= b) continue;
          if(op === "×") a = rnd(2,9);
          res = calc(a,op,b);
        } else {
          res = inter.value;
          if(op === "+"){
            a = rnd(1, Math.max(1,res-1));
            b = res - a;
          } else if(op === "−"){
            b = rnd(1,12);
            a = res + b;
          } else {
            const divs = [];
            for(let d=2; d<=9; d++) if(res % d === 0) divs.push(d);
            if(!divs.length) continue;
            a = divs[rnd(0,divs.length-1)];
            b = res / a;
          }
        }

        if(res === null || res <= 0 || res > 99) continue;

        const values = [a,op,b,"=",res];
        if(Number(values[idx]) !== inter.value) continue;

        const pos = [0,1,2,3,4].map(i => ({r:startR+i, c}));
        if(canPlace(cells,pos,values)){
          writeEq(cells,pos,values);
          equations.push({positions:pos, values});
          verticals++;
          placedV = true;
          break;
        }
      }
      if(placedV) break;
    }
  }

  // Oculta números. No se ocultan operadores ni iguales.
  const numberCells = [];
  equations.forEach(eq => {
    [0,2,4].forEach(i => {
      const p = eq.positions[i];
      const k = key(p.r,p.c);
      if(solution[k] === undefined) {
        numberCells.push({p, value:Number(eq.values[i])});
      }
    });
  });

  // Cantidad acotada para que los disponibles entren en pantalla.
  const toHide = shuffle(numberCells).slice(0, Math.min(14, Math.max(8, numberCells.length)));
  toHide.forEach(item => {
    const k = key(item.p.r,item.p.c);
    solution[k] = item.value;
    hiddenNumbers.push(item.value);
    cells[item.p.r][item.p.c] = "";
  });

  return {
    name: "Automático",
    size,
    hints: 2,
    numbers: shuffle(hiddenNumbers),
    cells,
    solution
  };
}

function setMessage(text, type=""){
  message.textContent = text;
  message.className = "message" + (type ? " " + type : "");
}

function init(){
  FIXED_LEVELS.forEach((lvl, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = lvl.name;
    levelSelect.appendChild(option);
  });

  modeSelect.onchange = () => {
    templateWrap.style.display = modeSelect.value === "template" ? "flex" : "none";
    restart();
  };

  levelSelect.onchange = () => {
    currentTemplate = Number(levelSelect.value);
    restart();
  };

  document.getElementById("newAutoBtn").onclick = () => {
    modeSelect.value = "auto";
    templateWrap.style.display = "none";
    restart();
  };

  document.getElementById("restartBtn").onclick = restart;
  document.getElementById("pauseBtn").onclick = pause;
  document.getElementById("modalBtn").onclick = resume;
  document.getElementById("checkBtn").onclick = checkAll;
  document.getElementById("hintBtn").onclick = useHint;

  templateWrap.style.display = "none";
  restart();
  startTimer();
}

function loadPuzzle(){
  if(modeSelect.value === "template") {
    currentPuzzle = JSON.parse(JSON.stringify(FIXED_LEVELS[currentTemplate]));
  } else {
    currentPuzzle = generateAutoPuzzle();
  }
}

function buildBoard(){
  const p = currentPuzzle;
  board.innerHTML = "";
  board.style.gridTemplateColumns = `repeat(${p.size}, 1fr)`;

  for(let r=0;r<p.size;r++){
    for(let c=0;c<p.size;c++){
      const value = p.cells[r]?.[c] ?? "";
      const div = document.createElement("div");
      div.className = value === "" ? "cell blank" : "cell";
      div.dataset.pos = key(r,c);

      if(p.solution[key(r,c)] !== undefined){
        div.className = "cell slot";
        div.onclick = () => selectSlot(div);

        div.addEventListener("dragover", e => {
          e.preventDefault();
          div.classList.add("drag-over");
        });
        div.addEventListener("dragleave", () => div.classList.remove("drag-over"));
        div.addEventListener("drop", e => {
          e.preventDefault();
          div.classList.remove("drag-over");
          if(draggedTile) {
            selectSlot(div);
            placeNumber(draggedTile);
          }
        });
      } else {
        div.textContent = value;
      }
      board.appendChild(div);
    }
  }
}

function buildNumbers(){
  numbers.innerHTML = "";
  currentPuzzle.numbers.forEach((n, i) => {
    const btn = document.createElement("button");
    btn.className = "tile";
    btn.textContent = n;
    btn.dataset.index = i;
    btn.dataset.value = n;
    btn.draggable = true;

    btn.onclick = () => {
      if(!touchTile) placeByClick(btn);
    };

    btn.addEventListener("dragstart", () => {
      draggedTile = btn;
      btn.classList.add("dragging");
    });
    btn.addEventListener("dragend", () => {
      draggedTile = null;
      btn.classList.remove("dragging");
      document.querySelectorAll(".drag-over").forEach(x => x.classList.remove("drag-over"));
    });

    // Arrastre real para celular.
    btn.addEventListener("pointerdown", startTouchDrag);

    numbers.appendChild(btn);
  });
  updateHints();
  availableCount.textContent = `${currentPuzzle.numbers.length} casillas`;
}

function startTouchDrag(e){
  const btn = e.currentTarget;
  if(btn.classList.contains("used")) return;

  touchTile = btn;
  btn.setPointerCapture?.(e.pointerId);
  ghost.textContent = btn.dataset.value;
  ghost.classList.remove("hidden");
  moveGhost(e.clientX, e.clientY);

  const move = ev => {
    ev.preventDefault();
    moveGhost(ev.clientX, ev.clientY);
    markSlotUnder(ev.clientX, ev.clientY);
  };

  const up = ev => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
    ghost.classList.add("hidden");
    document.querySelectorAll(".drag-over").forEach(x => x.classList.remove("drag-over"));

    const slot = slotAt(ev.clientX, ev.clientY);
    if(slot){
      selectSlot(slot);
      placeNumber(btn);
    }
    setTimeout(()=> touchTile = null, 120);
  };

  document.addEventListener("pointermove", move, {passive:false});
  document.addEventListener("pointerup", up);
}

function moveGhost(x,y){
  ghost.style.left = x + "px";
  ghost.style.top = y + "px";
}

function slotAt(x,y){
  ghost.classList.add("hidden");
  const el = document.elementFromPoint(x,y);
  ghost.classList.remove("hidden");
  return el?.closest?.(".slot");
}

function markSlotUnder(x,y){
  document.querySelectorAll(".drag-over").forEach(s => s.classList.remove("drag-over"));
  const slot = slotAt(x,y);
  if(slot) slot.classList.add("drag-over");
}

function selectSlot(div){
  document.querySelectorAll(".slot").forEach(x=>x.classList.remove("selected"));
  selected = div;
  selected.classList.add("selected");
}

function placeByClick(btn){
  if(!selected) {
    const firstEmpty = [...document.querySelectorAll(".slot")].find(x=>!x.textContent);
    if(firstEmpty) selectSlot(firstEmpty);
  }
  placeNumber(btn);
}

function returnOldTile(pos){
  if(placed[pos] !== undefined){
    const oldBtn = document.querySelector(`.tile[data-index="${placed[pos].index}"]`);
    if(oldBtn) oldBtn.classList.remove("used");
  }
}

function placeNumber(btn){
  if(!selected || btn.classList.contains("used")) return;
  const pos = selected.dataset.pos;
  const value = Number(btn.dataset.value);
  const correct = currentPuzzle.solution[pos];

  selected.classList.remove("correct","wrong");

  // Validación inmediata.
  if(value !== correct){
    const previous = placed[pos]?.value ?? "";
    selected.textContent = value;
    selected.classList.add("wrong");
    setMessage("Error: ese número no corresponde a esa casilla.", "error");

    setTimeout(() => {
      const cell = document.querySelector(`.slot[data-pos="${pos}"]`);
      if(cell && cell.classList.contains("wrong")){
        cell.textContent = previous;
        cell.classList.remove("wrong");
      }
    }, 650);
    return;
  }

  returnOldTile(pos);
  selected.textContent = value;
  selected.classList.add("correct");
  placed[pos] = { value, index:btn.dataset.index };
  btn.classList.add("used");
  setMessage("Correcto.", "ok");

  if(isComplete()) win();
  else {
    const next = [...document.querySelectorAll(".slot")].find(x=>!x.textContent);
    if(next) selectSlot(next);
  }
}

function isComplete(){
  return [...document.querySelectorAll(".slot")].every(cell => {
    const pos = cell.dataset.pos;
    return Number(cell.textContent) === currentPuzzle.solution[pos];
  });
}

function checkAll(){
  let ok = true;
  document.querySelectorAll(".slot").forEach(cell => {
    const pos = cell.dataset.pos;
    const value = Number(cell.textContent);
    cell.classList.remove("correct","wrong");
    if(!cell.textContent || value !== currentPuzzle.solution[pos]){
      cell.classList.add("wrong");
      ok = false;
    } else {
      cell.classList.add("correct");
    }
  });
  if(ok) win();
  else setMessage("Hay casillas vacías o incorrectas.", "error");
}

function useHint(){
  if(hints <= 0) return;
  const target = [...document.querySelectorAll(".slot")].find(cell => {
    const pos = cell.dataset.pos;
    return Number(cell.textContent) !== currentPuzzle.solution[pos];
  });
  if(!target) return;

  const pos = target.dataset.pos;
  const correct = currentPuzzle.solution[pos];
  const tile = [...document.querySelectorAll(".tile:not(.used)")].find(t => Number(t.dataset.value) === correct);

  if(tile){
    selectSlot(target);
    returnOldTile(pos);
    target.textContent = correct;
    target.classList.add("correct");
    placed[pos] = { value:correct, index:tile.dataset.index };
    tile.classList.add("used");
    hints--;
    updateHints();
    setMessage("Pista aplicada.", "ok");
    if(isComplete()) win();
  }
}

function updateHints(){
  document.getElementById("hintsLeft").textContent = "x" + hints;
}

function startTimer(){
  clearInterval(timerId);
  timerId = setInterval(() => {
    if(!running) return;
    seconds++;
    const m = String(Math.floor(seconds/60)).padStart(2,"0");
    const s = String(seconds%60).padStart(2,"0");
    timer.textContent = `${m}:${s}`;
  }, 1000);
}

function pause(){
  running = false;
  modalTitle.textContent = "Pausa";
  modalText.textContent = "Juego pausado.";
  modal.classList.remove("hidden");
}

function resume(){
  running = true;
  modal.classList.add("hidden");
}

function win(){
  running = false;
  modalTitle.textContent = "¡Ganaste!";
  modalText.textContent = `Completaste el crucigrama en ${timer.textContent}.`;
  modal.classList.remove("hidden");
}

function restart(){
  seconds = 0;
  timer.textContent = "00:00";
  running = true;
  selected = null;
  placed = {};
  modal.classList.add("hidden");
  loadPuzzle();
  hints = currentPuzzle.hints;
  buildBoard();
  buildNumbers();
  setMessage("Arrastrá un número a una casilla vacía.");
}

init();
