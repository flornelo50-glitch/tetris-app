const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
ctx.scale(24, 24);

const colors = [null, '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#06b6d4', '#f97316'];
const arena = Array.from({ length: 20 }, () => Array(10).fill(0));
const player = { pos: { x: 0, y: 0 }, matrix: null, score: 0 };

let highScore = localStorage.getItem('tetrisHigh') || 0;
document.getElementById('high').innerText = highScore;

const SHAPES = {
  T: [[0,1,0],[1,1,1],[0,0,0]],
  O: [[2,2],[2,2]],
  L: [[0,0,3],[3,3,3],[0,0,0]],
  J: [[4,0,0],[4,4,4],[0,0,0]],
  I: [[0,0,0,0],[5,5,5,5],[0,0,0,0],[0,0,0,0]],
  S: [[0,6,6],[6,6,0],[0,0,0]],
  Z: [[7,7,0],[0,7,7],[0,0,0]]
};

function createPiece(type) {
  return SHAPES[type].map(row => [...row]);
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) return true;
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val !== 0) arena[y + player.pos.y][x + player.pos.x] = val;
    });
  });
}

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y > 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) continue outer;
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y;
    player.score += rowCount * 100;
    rowCount *= 2;
  }
  updateScore();
}
function rotate(matrix) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
  }
  matrix.forEach(row => row.reverse());
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
  }
  dropCounter = 0;
}

function playerHardDrop() {
  while (!collide(arena, player)) player.pos.y++;
  player.pos.y--;
  merge(arena, player);
  playerReset();
  arenaSweep();
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) player.pos.x -= dir;
}

function playerRotate() {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix.length) {
      rotate(player.matrix); rotate(player.matrix); rotate(player.matrix);
      player.pos.x = pos;
      return;
    }
  }
}

function playerReset() {
  const pieces = 'ILJOTSZ';
  player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
  }
}

function updateScore() {
  document.getElementById('score').innerText = player.score;
  if (player.score > highScore) {
    highScore = player.score;
    localStorage.setItem('tetrisHigh', highScore);
    document.getElementById('high').innerText = highScore;
  }
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val !== 0) {
        ctx.fillStyle = colors[val];
        ctx.fillRect(x + offset.x + 0.05, y + offset.y + 0.05, 0.9, 0.9);
      }
    });
  });
}

function draw() {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

let dropCounter = 0;
let lastTime = 0;
function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > 700) playerDrop();
  draw();
  requestAnimationFrame(update);
}

document.getElementById('left').onclick = () => playerMove(-1);
document.getElementById('right').onclick = () => playerMove(1);
document.getElementById('down').onclick = () => playerDrop();
document.getElementById('rotate').onclick = () => playerRotate();
document.getElementById('drop').onclick = () => playerHardDrop();

playerReset();
update();
