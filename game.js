const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const VIEW_W = canvas.width;
const VIEW_H = canvas.height;
const HALF_H = VIEW_H / 2;

const CELL_SIZE = 1;
const MAZE_COLS = 23;
const MAZE_ROWS = 23;
const FOV = Math.PI / 2.7;
const RAY_COUNT = 320;
const MAX_DEPTH = 18;

const keys = new Set();
let gameOver = false;
let win = false;
let message = 'Find the exit while surviving in blackout mode.';

const map = generateMaze(MAZE_COLS, MAZE_ROWS);
const visitedCells = new Set();

const player = {
  x: 1.5,
  y: 1.5,
  dir: 0,
  hp: 100,
  shield: false,
  weaponLevel: 1,
  shootCooldown: 0,
  sprintEnergy: 100,
};

const exitCell = { x: MAZE_COLS - 2, y: MAZE_ROWS - 2 };
map[exitCell.y][exitCell.x] = 2;

const enemies = scatterEntities(10, [1], 5).map(({ x, y }) => ({
  x: x + 0.5,
  y: y + 0.5,
  hp: 40,
  speed: 0.55 + Math.random() * 0.35,
  cooldown: 1 + Math.random() * 1.5,
}));

const powerups = [
  ...scatterEntities(4, [1], 7).map((p) => ({ ...p, type: 'weapon' })),
  ...scatterEntities(3, [1], 9).map((p) => ({ ...p, type: 'shield' })),
];

window.addEventListener('keydown', (e) => {
  if ([
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    ' ',
    'KeyW',
    'KeyA',
    'KeyS',
    'KeyD',
    'ShiftLeft',
  ].includes(e.code)) {
    e.preventDefault();
  }
  keys.add(e.code);

  if (e.code === 'KeyR' && (gameOver || win)) {
    location.reload();
  }

  if (e.code === 'Space' && !gameOver && !win) {
    shoot();
  }
});

window.addEventListener('keyup', (e) => keys.delete(e.code));

let previousTime = performance.now();
requestAnimationFrame(loop);

function loop(now) {
  const dt = Math.min(0.05, (now - previousTime) / 1000);
  previousTime = now;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

function update(dt) {
  if (gameOver || win) return;

  const turnSpeed = 2.2;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) player.dir -= turnSpeed * dt;
  if (keys.has('ArrowRight') || keys.has('KeyD')) player.dir += turnSpeed * dt;

  const sprint = (keys.has('ShiftLeft') || keys.has('ShiftRight')) && player.sprintEnergy > 0;
  const moveSpeed = (sprint ? 2.8 : 1.9) * dt;
  if (sprint) {
    player.sprintEnergy = Math.max(0, player.sprintEnergy - 35 * dt);
  } else {
    player.sprintEnergy = Math.min(100, player.sprintEnergy + 20 * dt);
  }

  let moveX = 0;
  let moveY = 0;

  if (keys.has('KeyW') || keys.has('ArrowUp')) {
    moveX += Math.cos(player.dir) * moveSpeed;
    moveY += Math.sin(player.dir) * moveSpeed;
  }
  if (keys.has('KeyS') || keys.has('ArrowDown')) {
    moveX -= Math.cos(player.dir) * moveSpeed * 0.7;
    moveY -= Math.sin(player.dir) * moveSpeed * 0.7;
  }

  attemptMove(player.x + moveX, player.y + moveY);

  player.shootCooldown = Math.max(0, player.shootCooldown - dt);

  const cellX = Math.floor(player.x);
  const cellY = Math.floor(player.y);
  visitedCells.add(`${cellX},${cellY}`);

  if (map[cellY][cellX] === 2) {
    win = true;
    message = 'You escaped the maze! Press R to play again.';
  }

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 0.55) {
      enemy.cooldown = 0;
    }

    if (dist < 7.5) {
      const nx = dx / Math.max(0.001, dist);
      const ny = dy / Math.max(0.001, dist);
      const step = enemy.speed * dt;
      const tx = enemy.x + nx * step;
      const ty = enemy.y + ny * step;
      if (!isWall(tx, enemy.y)) enemy.x = tx;
      if (!isWall(enemy.x, ty)) enemy.y = ty;
    }

    enemy.cooldown -= dt;
    if (enemy.cooldown <= 0 && dist < 1.9) {
      enemy.cooldown = 1.2;
      if (player.shield) {
        player.shield = false;
        message = 'Shield absorbed damage!';
      } else {
        player.hp = Math.max(0, player.hp - 14);
        if (player.hp <= 0) {
          gameOver = true;
          message = 'You were overwhelmed. Press R to retry.';
        }
      }
    }
  }

  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    if (Math.hypot(player.x - (p.x + 0.5), player.y - (p.y + 0.5)) < 0.8) {
      if (p.type === 'weapon') {
        player.weaponLevel = Math.min(3, player.weaponLevel + 1);
        message = `Weapon boosted to Mk-${player.weaponLevel}.`;
      } else {
        player.shield = true;
        message = 'Shield charged: one hit blocked.';
      }
      powerups.splice(i, 1);
    }
  }
}

function attemptMove(nx, ny) {
  if (!isWall(nx, player.y)) player.x = nx;
  if (!isWall(player.x, ny)) player.y = ny;
}

function shoot() {
  if (player.shootCooldown > 0) return;
  player.shootCooldown = 0.45 - player.weaponLevel * 0.1;

  let target = null;
  let bestScore = Infinity;

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 9) continue;

    const angle = normalizeAngle(Math.atan2(dy, dx) - player.dir);
    const centerOffset = Math.abs(angle);
    if (centerOffset > 0.14) continue;

    if (canSee(player.x, player.y, enemy.x, enemy.y)) {
      const score = dist + centerOffset * 6;
      if (score < bestScore) {
        bestScore = score;
        target = enemy;
      }
    }
  }

  if (!target) {
    message = 'Shot missed in the dark.';
    return;
  }

  const damage = [18, 30, 44][player.weaponLevel - 1];
  target.hp -= damage;
  message = target.hp <= 0 ? 'Enemy down.' : 'Enemy hit.';
}

function castRay(angle) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);

  for (let depth = 0; depth < MAX_DEPTH; depth += 0.02) {
    const x = player.x + cos * depth;
    const y = player.y + sin * depth;

    if (isWall(x, y)) {
      return { depth, x, y };
    }
  }

  return { depth: MAX_DEPTH, x: player.x + cos * MAX_DEPTH, y: player.y + sin * MAX_DEPTH };
}

function render() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  drawSkyAndFloor();

  const rays = [];
  const sliceW = VIEW_W / RAY_COUNT;

  for (let i = 0; i < RAY_COUNT; i++) {
    const rayAngle = player.dir - FOV / 2 + (i / RAY_COUNT) * FOV;
    const ray = castRay(rayAngle);
    const correctedDepth = ray.depth * Math.cos(rayAngle - player.dir);
    const wallH = Math.min(VIEW_H, (VIEW_H * 0.95) / Math.max(0.001, correctedDepth));

    const brightness = flashlightBrightness(rayAngle, correctedDepth);

    const wallCellX = Math.floor(ray.x);
    const wallCellY = Math.floor(ray.y);
    const litByPath = isCellLit(wallCellX, wallCellY) ? 0.55 : 0;

    const shade = Math.max(0, Math.min(1, brightness + litByPath));
    const base = Math.floor(55 + 145 * shade);
    ctx.fillStyle = `rgb(${Math.floor(base * 0.65)}, ${Math.floor(base * 0.75)}, ${base})`;

    ctx.fillRect(i * sliceW, HALF_H - wallH / 2, sliceW + 1, wallH);

    rays.push({ depth: correctedDepth, i });
  }

  drawSprites(rays);
  drawCrosshair();
  drawMiniMap();
  drawHud();
}

function drawSkyAndFloor() {
  const sky = ctx.createLinearGradient(0, 0, 0, HALF_H);
  sky.addColorStop(0, '#050810');
  sky.addColorStop(1, '#0d1220');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, HALF_H);

  const floor = ctx.createLinearGradient(0, HALF_H, 0, VIEW_H);
  floor.addColorStop(0, '#020304');
  floor.addColorStop(1, '#000');
  ctx.fillStyle = floor;
  ctx.fillRect(0, HALF_H, VIEW_W, HALF_H);
}

function drawSprites(rays) {
  const depthBuffer = rays.map((r) => r.depth);

  const sprites = [];

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    sprites.push({ ...enemy, kind: 'enemy', color: '#f64' });
  }

  for (const p of powerups) {
    sprites.push({
      x: p.x + 0.5,
      y: p.y + 0.5,
      kind: p.type,
      color: p.type === 'weapon' ? '#f4f24a' : '#4ad9ff',
    });
  }

  sprites.sort((a, b) => distanceToPlayer(b) - distanceToPlayer(a));

  for (const s of sprites) {
    const dx = s.x - player.x;
    const dy = s.y - player.y;
    const dist = Math.hypot(dx, dy);
    const angle = normalizeAngle(Math.atan2(dy, dx) - player.dir);

    if (Math.abs(angle) > FOV / 2 + 0.3 || dist < 0.2) continue;

    const screenX = (0.5 + angle / FOV) * VIEW_W;
    const size = Math.min(VIEW_H, (VIEW_H / Math.max(0.001, dist)) * 0.36);
    const xStart = Math.floor(screenX - size / 2);
    const xEnd = Math.floor(screenX + size / 2);

    for (let x = xStart; x <= xEnd; x++) {
      if (x < 0 || x >= VIEW_W) continue;
      const rayIndex = Math.floor((x / VIEW_W) * RAY_COUNT);
      if (depthBuffer[rayIndex] < dist) continue;

      const flashlight = flashlightBrightness(player.dir + ((x / VIEW_W) - 0.5) * FOV, dist);
      const lit = Math.max(0.07, flashlight);
      const alpha = Math.min(1, lit + (s.kind === 'enemy' ? 0.1 : 0.25));

      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.color;
      ctx.fillRect(x, HALF_H - size * 0.5, 1, size);
      if (s.kind === 'enemy') {
        ctx.fillStyle = '#120';
        ctx.fillRect(x, HALF_H - size * 0.15, 1, size * 0.2);
      }
    }
    ctx.globalAlpha = 1;
  }
}

function drawCrosshair() {
  ctx.strokeStyle = 'rgba(230,240,255,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(VIEW_W / 2 - 10, HALF_H);
  ctx.lineTo(VIEW_W / 2 + 10, HALF_H);
  ctx.moveTo(VIEW_W / 2, HALF_H - 10);
  ctx.lineTo(VIEW_W / 2, HALF_H + 10);
  ctx.stroke();
}

function drawMiniMap() {
  const size = 180;
  const scale = size / MAZE_COLS;
  const ox = VIEW_W - size - 16;
  const oy = 16;

  ctx.fillStyle = 'rgba(5,8,16,0.72)';
  ctx.fillRect(ox - 6, oy - 6, size + 12, size + 12);

  for (let y = 0; y < MAZE_ROWS; y++) {
    for (let x = 0; x < MAZE_COLS; x++) {
      if (map[y][x] === 0) {
        ctx.fillStyle = '#1f263b';
      } else if (map[y][x] === 2) {
        ctx.fillStyle = '#1f7f3f';
      } else {
        ctx.fillStyle = isCellLit(x, y) ? '#7ea7d8' : '#0a0c12';
      }
      ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
    }
  }

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    ctx.fillStyle = '#ff6666';
    ctx.fillRect(ox + enemy.x * scale - 2, oy + enemy.y * scale - 2, 4, 4);
  }

  for (const p of powerups) {
    ctx.fillStyle = p.type === 'weapon' ? '#ffe94d' : '#4ad9ff';
    ctx.fillRect(ox + (p.x + 0.5) * scale - 2, oy + (p.y + 0.5) * scale - 2, 4, 4);
  }

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ox + player.x * scale, oy + player.y * scale, 3.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(ox + player.x * scale, oy + player.y * scale);
  ctx.lineTo(
    ox + (player.x + Math.cos(player.dir) * 1.2) * scale,
    oy + (player.y + Math.sin(player.dir) * 1.2) * scale
  );
  ctx.stroke();
}

function drawHud() {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(12, VIEW_H - 90, 460, 78);

  ctx.fillStyle = '#e2ebff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`HP: ${Math.round(player.hp)}`, 22, VIEW_H - 62);
  ctx.fillText(`Weapon: Mk-${player.weaponLevel}`, 110, VIEW_H - 62);
  ctx.fillText(`Shield: ${player.shield ? 'Ready' : 'None'}`, 248, VIEW_H - 62);

  ctx.fillStyle = '#7896ff';
  ctx.fillRect(22, VIEW_H - 44, player.sprintEnergy * 1.25, 10);
  ctx.strokeStyle = '#a8b9ff';
  ctx.strokeRect(22, VIEW_H - 44, 125, 10);
  ctx.fillStyle = '#ccd8ff';
  ctx.fillText('Sprint', 155, VIEW_H - 35);

  ctx.fillStyle = '#b7c8ff';
  ctx.fillText(message, 22, VIEW_H - 16);

  if (gameOver || win) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = win ? '#8cffb8' : '#ff8a8a';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(win ? 'ESCAPED' : 'DEFEAT', VIEW_W / 2 - 95, HALF_H - 18);
    ctx.fillStyle = '#fff';
    ctx.font = '22px sans-serif';
    ctx.fillText(message, VIEW_W / 2 - 230, HALF_H + 20);
    ctx.fillText('Press R to restart', VIEW_W / 2 - 92, HALF_H + 56);
  }
}

function isWall(x, y) {
  const cell = map[Math.floor(y)]?.[Math.floor(x)];
  return cell === undefined || cell === 0;
}

function canSee(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.floor(dist * 28);

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    if (isWall(px, py)) return false;
  }
  return true;
}

function flashlightBrightness(rayAngle, depth) {
  const offCenter = Math.abs(normalizeAngle(rayAngle - player.dir));
  const cone = Math.max(0, 1 - offCenter / (FOV * 0.55));
  const falloff = Math.max(0, 1 - depth / 10);
  return Math.max(0.02, cone * falloff);
}

function isCellLit(x, y) {
  if (visitedCells.has(`${x},${y}`)) return true;

  const neighbors = [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ];

  return neighbors.some(([nx, ny]) => visitedCells.has(`${nx},${ny}`));
}

function distanceToPlayer(obj) {
  return Math.hypot(obj.x - player.x, obj.y - player.y);
}

function normalizeAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function scatterEntities(count, validTiles, minDistanceFromStart) {
  const spots = [];
  let attempts = 0;

  while (spots.length < count && attempts < 5000) {
    attempts++;
    const x = 1 + Math.floor(Math.random() * (MAZE_COLS - 2));
    const y = 1 + Math.floor(Math.random() * (MAZE_ROWS - 2));

    if (!validTiles.includes(map[y][x])) continue;
    if (Math.hypot(x - 1, y - 1) < minDistanceFromStart) continue;
    if (x === exitCell?.x && y === exitCell?.y) continue;
    if (spots.some((s) => s.x === x && s.y === y)) continue;

    spots.push({ x, y });
  }

  return spots;
}

function generateMaze(width, height) {
  const maze = Array.from({ length: height }, () => Array(width).fill(0));
  const stack = [[1, 1]];
  maze[1][1] = 1;

  const dirs = [
    [2, 0],
    [-2, 0],
    [0, 2],
    [0, -2],
  ];

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];
    const shuffled = dirs.slice().sort(() => Math.random() - 0.5);

    let carved = false;
    for (const [dx, dy] of shuffled) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx <= 0 || nx >= width - 1 || ny <= 0 || ny >= height - 1) continue;
      if (maze[ny][nx] !== 0) continue;

      maze[cy + dy / 2][cx + dx / 2] = 1;
      maze[ny][nx] = 1;
      stack.push([nx, ny]);
      carved = true;
      break;
    }

    if (!carved) stack.pop();
  }

  return maze;
}
