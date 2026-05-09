let currentPuzzle = null;
let currentTemplate = 0;
let selected = null;
let placed = {};
let seconds = 0;
let running = true;
let timerId = null;
let hints = 0;
let draggedTile = null;

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
    let a = rnd(1, 20), b = rnd(1, 12);
    if(op === "−" && a <= b) [a,b] = [b,a];
    if(op === "×"){ a = rnd(2,12); b = rnd(2,9); }
    const res = calc(a,op,b);
    if(res > 0 && res <= 99) return {a,op,b,res};
  }
}

// Genera un crucigrama nuevo automáticamente.
// Usa ecuaciones de 5 casillas: A operador B = Resultado.
// Algunas casillas quedan ocultas y el jugador debe completarlas.
function generateAutoPuzzle(){
  const size = 11;
  const cells = Array.from({length:size}, () => Array(size).fill(""));
  const solution = {};
  const hiddenNumbers = [];
  const starts = shuffle([
    {r:0,c:0,d:"h"},{r:2,c:0,d:"h"},{r:4,c:0,d:"h"},{r:6,c:0,d:"h"},{r:8,c:0,d:"h"},
    {r:0,c:6,d:"h"},{r:2,c:6,d:"h"},{r:4,c:6,d:"h"},{r:6,c:6,d:"h"},{r:8,c:6,d:"h"},
    {r:0,c:0,d:"v"},{r:0,c:2,d:"v"},{r:0,c:4,d:"v"},{r:0,c:6,d:"v"},{r:0,c:8,d:"v"},{r:0,c:10,d:"v"}
  ]);

  let placedEq = 0;
  let attempts = 0;

  while(placedEq < 8 && attempts < 500){
    attempts++;
    const s = starts[attempts % starts.length];
    const positions = [];
    for(let i=0;i<5;i++){
      positions.push({r:s.r + (s.d==="v"?i:0), c:s.c + (s.d==="h"?i:0)});
    }
    if(positions.some(p => p.r >= size || p.c >= size)) continue;

    const eq = makeEquation();
    const values = [eq.a, eq.op, eq.b, "=", eq.res];

    let conflict = false;
    for(let i=0;i<5;i++){
      const p = positions[i];
      const existing = cells[p.r][p.c];
      if(existing !== "" && String(existing) !== String(values[i])) conflict = true;
    }
    if(conflict) continue;

    for(let i=0;i<5;i++){
      const p = positions[i];
      cells[p.r][p.c] = String(values[i]);
    }

    // Oculta entre 1 y 2 números por ecuación, nunca operadores.
    const numberIndexes = shuffle([0,2,4]).slice(0, rnd(1,2));
    numberIndexes.forEach(i => {
      const p = positions[i];
      const k = key(p.r,p.c);
      if(solution[k] === undefined){
        solution[k] = Number(values[i]);
        hiddenNumbers.push(Number(values[i]));
        cells[p.r][p.c] = "";
      }
    });

    placedEq++;
  }

  // Evita números repetidos en exceso agregando algunos distractores.
  const distractors = Array.from({length: Math.max(3, 18 - hiddenNumbers.length)}, () => rnd(1,28));
  return {
    name: "Automático",
    size,
    hints: 2,
    numbers: shuffle([...hiddenNumbers, ...distractors]),
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

        div.addEventListener("pointerup", () => {
          const mobileTile = document.querySelector(".tile.dragging-touch");
          if(mobileTile) {
            selectSlot(div);
            placeNumber(mobileTile);
            mobileTile.classList.remove("dragging-touch");
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

    btn.onclick = () => placeByClick(btn);

    btn.addEventListener("dragstart", () => {
      draggedTile = btn;
      btn.classList.add("dragging");
    });
    btn.addEventListener("dragend", () => {
      draggedTile = null;
      btn.classList.remove("dragging");
      document.querySelectorAll(".drag-over").forEach(x => x.classList.remove("drag-over"));
    });

    btn.addEventListener("pointerdown", () => {
      btn.classList.add("dragging-touch");
    });
    btn.addEventListener("pointerup", () => {
      setTimeout(() => btn.classList.remove("dragging-touch"), 80);
    });

    numbers.appendChild(btn);
  });
  updateHints();
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

  // VALIDACIÓN INMEDIATA: si está mal, marca error y NO deja colocado el número.
  if(value !== correct){
    selected.textContent = value;
    selected.classList.add("wrong");
    setMessage("Ese número no corresponde a esa casilla.", "error");

    setTimeout(() => {
      if(selected && selected.dataset.pos === pos && selected.classList.contains("wrong")){
        selected.textContent = placed[pos]?.value ?? "";
        selected.classList.remove("wrong");
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
