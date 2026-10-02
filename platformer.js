(function () {
  'use strict';

  var root = document.getElementById('platform-game');
  if (!root) return;

  var WORLD_WIDTH = 2960;
  var WORLD_HEIGHT = 500;
  var STEP = 1 / 120;
  var MOVE_SPEED = 245;
  var GRAVITY = 1350;
  var JUMP_SPEED = 510;
  var platforms = [
    { x: 0, y: 430, w: 520, h: 90, ground: true },
    { x: 610, y: 430, w: 390, h: 90, ground: true },
    { x: 1110, y: 430, w: 400, h: 90, ground: true },
    { x: 1620, y: 430, w: 410, h: 90, ground: true },
    { x: 2150, y: 430, w: 810, h: 90, ground: true },
    { x: 260, y: 344, w: 126, h: 26 },
    { x: 460, y: 282, w: 116, h: 26 },
    { x: 690, y: 340, w: 132, h: 26 },
    { x: 934, y: 306, w: 112, h: 26 },
    { x: 1235, y: 340, w: 118, h: 26 },
    { x: 1452, y: 272, w: 126, h: 26 },
    { x: 1725, y: 336, w: 146, h: 26 },
    { x: 1960, y: 284, w: 122, h: 26 },
    { x: 2270, y: 336, w: 132, h: 26 },
    { x: 2500, y: 280, w: 140, h: 26 }
  ];
  var spikes = [
    { x: 365, y: 414, w: 54, h: 16 },
    { x: 842, y: 414, w: 58, h: 16 },
    { x: 1370, y: 414, w: 58, h: 16 },
    { x: 1866, y: 414, w: 62, h: 16 },
    { x: 2320, y: 414, w: 62, h: 16 }
  ];
  var lights = [
    { x: 320, y: 312 }, { x: 988, y: 274 }, { x: 1514, y: 240 },
    { x: 2020, y: 252 }, { x: 2570, y: 248 }
  ];
  var checkpoints = [{ x: 1230, y: 430 }, { x: 2198, y: 430 }];
  var portal = { x: 2830, y: 365, w: 58, h: 65 };
  var spawn = { x: 90, y: 388 };
  var keys = new Set();
  var touches = new Map();
  var collected = new Set();
  var player = {};
  var particles = [];
  var status = 'idle';
  var lives = 3;
  var checkpoint = 0;
  var camera = 0;
  var time = 0;
  var frame = 0;
  var lastTime = 0;
  var accumulator = 0;
  var jumpBuffer = 0;
  var coyote = 0;
  var visible = true;
  var viewport = { w: 1000, h: WORLD_HEIGHT, dpr: 1 };
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var style = document.createElement('style');
  style.textContent = `
    #platform-game { width:100%; color:#e4edf5; background:#21242e; border:2px solid #7a8aba; font:500 14px/1.5 Arial,"Microsoft JhengHei",sans-serif; outline:none; }
    #platform-game *, #platform-game *::before, #platform-game *::after { box-sizing:border-box; }
    #platform-game:focus-visible { outline:3px solid #ecab37; outline-offset:4px; }
    #platform-game .pg-top { display:flex; flex-wrap:wrap; gap:10px 18px; align-items:center; padding:12px 16px; background:#272d40; border-bottom:1px solid #6575a0; }
    #platform-game .pg-lives { color:#ecab37; letter-spacing:3px; white-space:nowrap; }
    #platform-game .pg-lights { color:#b9e8ed; white-space:nowrap; }
    #platform-game .pg-track { flex:1; min-width:95px; display:flex; gap:8px; align-items:center; font-size:12px; color:#b7c1d7; }
    #platform-game .pg-progress { height:5px; flex:1; background:#151b2b; border-radius:4px; overflow:hidden; }
    #platform-game .pg-progress span { display:block; height:100%; width:0; background:#91c9d8; }
    #platform-game button { font:inherit; cursor:pointer; border:1px solid #7a8aba; color:#e4edf5; background:#3d4f97; border-radius:3px; min-height:44px; padding:6px 12px; box-shadow:0 2px 0 #111829; }
    #platform-game button:hover { background:#4c60af; }
    #platform-game button:focus-visible { outline:3px solid #ecab37; outline-offset:3px; }
    #platform-game button:disabled { opacity:.45; cursor:default; }
    #platform-game .pg-tools { display:flex; gap:7px; }
    #platform-game .pg-tools button { font-size:12px; }
    #platform-game .pg-screen { position:relative; aspect-ratio:2 / 1; overflow:hidden; background:#0d1726; }
    #platform-game canvas { display:block; width:100%; height:100%; touch-action:none; }
    #platform-game .pg-overlay { position:absolute; inset:0; display:flex; justify-content:center; align-items:center; padding:20px; background:linear-gradient(90deg,rgba(7,15,27,.52),rgba(7,15,27,.24),rgba(7,15,27,.52)); }
    #platform-game .pg-overlay[hidden] { display:none; }
    #platform-game .pg-card { max-width:380px; text-align:center; padding:24px 30px; border:1px solid #8298b578; background:#162238ee; box-shadow:0 12px 55px #02081570; }
    #platform-game .pg-eyebrow { margin:0 0 10px; color:#9ac9d9; font-size:11px; letter-spacing:4px; }
    #platform-game .pg-card h3 { margin:0 0 10px; color:#f0f5f4; font-size:24px; font-weight:600; }
    #platform-game .pg-card p { margin:0 0 18px; font-size:13px; line-height:1.8; color:#c2cede; }
    #platform-game .pg-card .pg-primary { background:#ecab37; border-color:#ffca6a; color:#272833; min-width:150px; font-weight:700; padding:10px 24px; }
    #platform-game .pg-card .pg-primary:hover { background:#f2be65; }
    #platform-game .pg-bottom { padding:11px 16px 13px; border-top:1px solid #6575a0; }
    #platform-game .pg-controls { display:flex; align-items:center; gap:8px; }
    #platform-game .pg-control { width:56px; min-width:56px; height:56px; padding:0; touch-action:none; user-select:none; -webkit-user-select:none; font-size:22px; }
    #platform-game .pg-control[data-action="jump"], #platform-game .pg-control[data-action="dash"] { font-size:13px; font-weight:700; }
    #platform-game .pg-control[data-action="jump"] { margin-left:auto; border-color:#b6d6e6; background:#536b9f; }
    #platform-game .pg-control[data-action="dash"] { color:#ffd893; }
    #platform-game .pg-control.pg-held { background:#7a8aba; transform:translateY(2px); box-shadow:none; }
    #platform-game .pg-legend { flex:1; text-align:center; color:#bcc7dc; font-size:12px; }
    #platform-game kbd { font:inherit; color:#f0f1fa; }
    #platform-game .pg-message { margin:10px 0 0; font-size:12px; color:#aebbd2; display:flex; gap:12px; justify-content:space-between; }
    #platform-game .pg-objective { color:#91c9d8; }
    @media (max-width:650px) {
      #platform-game .pg-screen { aspect-ratio:1.2 / 1; }
      #platform-game .pg-top { padding:10px; gap:8px 12px; }
      #platform-game .pg-track { order:3; flex-basis:100%; }
      #platform-game .pg-tools { margin-left:auto; }
      #platform-game .pg-bottom { padding:10px; }
      #platform-game .pg-legend { display:none; }
      #platform-game .pg-message { flex-direction:column; gap:2px; }
      #platform-game .pg-card { padding:22px 18px; }
      #platform-game .pg-card h3 { font-size:22px; }
    }
    @media (prefers-reduced-motion:reduce) { #platform-game button { transition:none; } }
  `;
  document.head.appendChild(style);
  root.tabIndex = 0;
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', '微光遺跡平台冒險遊戲');
  root.innerHTML = `
    <div class="pg-top">
      <span class="pg-lives" aria-label="生命 3">♥ ♥ ♥</span>
      <span class="pg-lights">✦ 微光 <b>0 / 5</b></span>
      <div class="pg-track"><span class="pg-checkpoint">起點</span><div class="pg-progress" aria-hidden="true"><span></span></div><span class="pg-percent">0%</span></div>
      <div class="pg-tools"><button type="button" class="pg-pause" disabled>暫停</button><button type="button" class="pg-restart">重來</button></div>
    </div>
    <div class="pg-screen">
      <canvas aria-label="藍色洞窟中的平台冒險；使用下方按鈕或鍵盤控制旅人">此遊戲需要瀏覽器支援 Canvas。</canvas>
      <div class="pg-overlay">
        <div class="pg-card"><div class="pg-eyebrow">A LITTLE LIGHT / 微光遺跡</div><h3>帶著微光，往前走。</h3><p>穿越斷橋與尖刺，抵達洞窟深處的光門。<br>空中可再跳一次；燈臺會記住你的腳步。</p><button type="button" class="pg-primary">開始冒險</button></div>
      </div>
    </div>
    <div class="pg-bottom">
      <div class="pg-controls" aria-label="觸控遊戲控制">
        <button type="button" class="pg-control" data-action="left" aria-label="向左移動">◀</button>
        <button type="button" class="pg-control" data-action="right" aria-label="向右移動">▶</button>
        <span class="pg-legend"><kbd>← →</kbd> / <kbd>A D</kbd> 移動 · <kbd>空白</kbd> 二段跳<br><kbd>Shift</kbd> / <kbd>X</kbd> 衝刺 · <kbd>P</kbd> 暫停</span>
        <button type="button" class="pg-control" data-action="jump" aria-label="跳躍或二段跳">跳躍<br>↑</button>
        <button type="button" class="pg-control" data-action="dash" aria-label="衝刺">衝刺<br>✦</button>
      </div>
      <div class="pg-message"><span class="pg-status" role="status" aria-live="polite">旅人準備就緒。</span><span class="pg-objective">往右抵達光門 · 收集 5 枚微光</span></div>
    </div>
  `;
  var canvas = root.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  if (!ctx) {
    root.querySelector('.pg-card p').textContent = '瀏覽器未提供 Canvas 繪圖功能。請以支援 Canvas 的瀏覽器開啟。';
    root.querySelector('.pg-primary').disabled = true;
    return;
  }
  var overlay = root.querySelector('.pg-overlay');
  var heading = root.querySelector('.pg-card h3');
  var description = root.querySelector('.pg-card p');
  var primary = root.querySelector('.pg-primary');
  var pauseButton = root.querySelector('.pg-pause');
  var liveStatus = root.querySelector('.pg-status');
  var livesEl = root.querySelector('.pg-lives');
  var lightsEl = root.querySelector('.pg-lights b');
  var checkpointEl = root.querySelector('.pg-checkpoint');
  var progressEl = root.querySelector('.pg-progress span');
  var percentEl = root.querySelector('.pg-percent');

  function frozenCopy(value) {
    if (Array.isArray(value)) return Object.freeze(value.map(frozenCopy));
    if (value && typeof value === 'object') {
      var copy = {};
      Object.keys(value).forEach(function (key) { copy[key] = frozenCopy(value[key]); });
      return Object.freeze(copy);
    }
    return value;
  }
  Object.defineProperty(root, 'levelData', { value: frozenCopy({
    width: WORLD_WIDTH, height: WORLD_HEIGHT, platforms: platforms, spikes: spikes,
    lights: lights, checkpoints: checkpoints, portal: portal, spawn: spawn,
    physics: { moveSpeed: MOVE_SPEED, gravity: GRAVITY, jumpSpeed: JUMP_SPEED, dashSpeed: 680, dashDuration: .15 }
  }) });
  Object.defineProperty(root, 'getGameState', { value: function () {
    return frozenCopy({ status: status, lives: lives, health: lives, collected: collected.size,
      collectedIndices: Array.from(collected), checkpoint: checkpoint,
      player: { x: player.x, y: player.y, w: player.w, h: player.h, vx: player.vx, vy: player.vy,
        grounded: player.grounded, jumps: player.jumps, facing: player.facing,
        dashCooldown: player.dashCooldown, dashTime: player.dashTime, invincible: player.invincible },
      camera: camera, viewport: viewport, progress: Math.max(0, Math.min(1, (player.x - spawn.x) / (portal.x - spawn.x))),
      simulationTime: time
    });
  } });

  function announce(message) {
    liveStatus.textContent = message;
    root.dispatchEvent(new CustomEvent('game-state', { detail: root.getGameState() }));
  }
  function clearInput() {
    keys.clear(); touches.clear(); jumpBuffer = 0;
    root.querySelectorAll('.pg-control').forEach(function (button) { button.classList.remove('pg-held'); });
  }
  function makePlayer(x, y) {
    player = { x: x, y: y, w: 24, h: 42, vx: 0, vy: 0, grounded: true,
      jumps: 0, facing: 1, dashCooldown: 0, dashTime: 0, invincible: 0 };
    coyote = .1;
  }
  function reset() {
    clearInput(); lives = 3; checkpoint = 0; collected.clear(); particles = []; time = 0;
    makePlayer(spawn.x, spawn.y); camera = 0; accumulator = 0; lastTime = 0;
    updateHud();
  }
  function updateHud() {
    livesEl.textContent = Array.from({ length: 3 }, function (_, i) { return i < lives ? '♥' : '♡'; }).join(' ');
    livesEl.setAttribute('aria-label', '生命 ' + lives);
    lightsEl.textContent = collected.size + ' / ' + lights.length;
    checkpointEl.textContent = checkpoint ? '燈臺 ' + checkpoint + ' / 2' : '起點';
    var pct = Math.max(0, Math.min(100, Math.floor((player.x - spawn.x) / (portal.x - spawn.x) * 100)));
    progressEl.style.width = pct + '%'; percentEl.textContent = pct + '%';
  }
  function stopLoop() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0; lastTime = 0; accumulator = 0;
  }
  function showOverlay(title, text, button) {
    heading.textContent = title; description.textContent = text; primary.textContent = button;
    overlay.hidden = false;
  }
  function begin() {
    reset(); status = 'running'; overlay.hidden = true; pauseButton.disabled = false;
    pauseButton.textContent = '暫停'; root.focus({ preventScroll: true });
    announce('冒險開始。向右前進，空中可再跳一次。'); render(); startLoop();
  }
  function pause(reason) {
    if (status !== 'running') return;
    status = 'paused'; clearInput(); stopLoop(); pauseButton.textContent = '繼續';
    showOverlay('在微光裡歇一會。', reason || '冒險已暫停。準備好就繼續向前。', '繼續冒險');
    announce('遊戲已暫停。'); render();
  }
  function resume() {
    if (status !== 'paused' || document.hidden || !visible) return;
    status = 'running'; overlay.hidden = true; pauseButton.textContent = '暫停';
    clearInput(); root.focus({ preventScroll: true }); announce('冒險繼續。'); startLoop();
  }
  function finish(won) {
    status = won ? 'won' : 'gameover'; clearInput(); stopLoop(); pauseButton.disabled = true;
    if (won) {
      showOverlay('光門為你亮起。', '你走出了微光遺跡，帶回 ' + collected.size + ' / 5 枚微光。每一段路，都留下了你的腳步。', '再走一趟');
      announce('冒險完成！收集了 ' + collected.size + ' 枚微光。');
    } else {
      showOverlay('旅途還有下一次。', '這次的微光暫時熄滅了。記住斷橋的位置，再出發一次。', '重新冒險');
      announce('生命已用盡。可以重新冒險。');
    }
    updateHud(); render();
  }
  function burst(x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var angle = i / count * Math.PI * 2;
      particles.push({ x: x, y: y, vx: Math.cos(angle) * (30 + i % 5 * 12),
        vy: Math.sin(angle) * (30 + i % 4 * 18), life: .7, max: .7, color: color });
    }
  }
  function damage() {
    if (player.invincible > 0 || status !== 'running') return;
    lives--;
    if (lives <= 0) { finish(false); return; }
    var point = checkpoint ? checkpoints[checkpoint - 1] : spawn;
    makePlayer(checkpoint ? point.x - 12 : point.x, checkpoint ? point.y - 42 : point.y);
    player.invincible = 1.6; clearInput();
    camera = Math.max(0, Math.min(WORLD_WIDTH - viewport.w, player.x - viewport.w * .36));
    burst(player.x + 12, player.y + 20, '#bee7ed', 18); updateHud();
    announce('回到' + (checkpoint ? '燈臺 ' + checkpoint : '起點') + '，剩餘 ' + lives + ' 次生命。');
  }
  function hasTouch(action) {
    var found = false;
    touches.forEach(function (value) { if (value === action) found = true; });
    return found;
  }
  function dash() {
    if (status !== 'running' || player.dashCooldown > 0) return;
    player.dashTime = .15; player.dashCooldown = .8; player.vy = 0;
    burst(player.x + 12, player.y + 24, '#8ddbe6', 9);
  }
  function update(dt) {
    if (status !== 'running') return;
    time += dt;
    player.invincible = Math.max(0, player.invincible - dt);
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    jumpBuffer = Math.max(0, jumpBuffer - dt);
    coyote = player.grounded ? .1 : Math.max(0, coyote - dt);
    var left = keys.has('ArrowLeft') || keys.has('KeyA') || hasTouch('left');
    var right = keys.has('ArrowRight') || keys.has('KeyD') || hasTouch('right');
    var direction = (right ? 1 : 0) - (left ? 1 : 0);
    if (direction) player.facing = direction;
    if (jumpBuffer > 0 && (coyote > 0 || player.jumps < 2)) {
      if (coyote > 0) player.jumps = 0;
      player.vy = -JUMP_SPEED; player.jumps++; player.grounded = false;
      player.dashTime = 0; coyote = 0; jumpBuffer = 0;
      burst(player.x + 12, player.y + player.h, '#7bb2c9', 7);
    }
    var oldY = player.y;
    if (player.dashTime > 0) {
      player.dashTime = Math.max(0, player.dashTime - dt);
      player.vx = player.facing * 680; player.vy = 0;
    } else {
      player.vx += (direction * MOVE_SPEED - player.vx) * Math.min(1, dt * (player.grounded ? 22 : 12));
      if (!direction && Math.abs(player.vx) < .3) player.vx = 0;
      player.vy = Math.min(760, player.vy + GRAVITY * dt);
    }
    player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x + player.vx * dt));
    player.y += player.vy * dt; player.grounded = false;
    if (player.vy >= 0) {
      for (var i = 0; i < platforms.length; i++) {
        var platform = platforms[i];
        if (player.x + player.w > platform.x && player.x < platform.x + platform.w &&
          oldY + player.h <= platform.y + 1 && player.y + player.h >= platform.y) {
          player.y = platform.y - player.h; player.vy = 0; player.grounded = true; player.jumps = 0; break;
        }
      }
    }
    for (var s = 0; s < spikes.length; s++) {
      var spike = spikes[s];
      if (player.x + player.w - 5 > spike.x && player.x + 5 < spike.x + spike.w &&
        player.y + player.h - 3 > spike.y && player.y + 8 < spike.y + spike.h) {
        damage(); break;
      }
    }
    if (player.y > WORLD_HEIGHT + 85) damage();
    if (status !== 'running') return;
    for (var c = 0; c < checkpoints.length; c++) {
      var cp = checkpoints[c];
      if (checkpoint < c + 1 && Math.abs(player.x + 12 - cp.x) < 37 && player.y + player.h > cp.y - 65) {
        checkpoint = c + 1; burst(cp.x, cp.y - 44, '#bfe9df', 20);
        updateHud(); announce('燈臺 ' + checkpoint + ' 已點亮。失足時會回到這裡。');
      }
    }
    lights.forEach(function (light, index) {
      if (!collected.has(index) && Math.hypot(player.x + 12 - light.x, player.y + 19 - light.y) < 32) {
        collected.add(index); burst(light.x, light.y, '#d6f3d8', 18);
        updateHud(); announce('拾起一枚微光。已收集 ' + collected.size + ' / 5。');
      }
    });
    if (player.x + player.w > portal.x + 5 && player.y + player.h > portal.y && player.y < portal.y + portal.h) {
      finish(true); return;
    }
    particles = particles.filter(function (p) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; return p.life > 0; });
    var target = Math.max(0, Math.min(Math.max(0, WORLD_WIDTH - viewport.w), player.x - viewport.w * .36));
    camera += (target - camera) * Math.min(1, dt * 7);
  }

  function path(points, fill, stroke, lineWidth) {
    ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth || 1; ctx.stroke(); }
  }
  function glow(x, y, radius, color) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(115,208,220,0)');
    ctx.fillStyle = g; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  function arch(x, y, w, h, color, line) {
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + w * .53);
    ctx.bezierCurveTo(x, y - w * .2, x + w, y - w * .2, x + w, y + w * .53);
    ctx.lineTo(x + w, y + h); ctx.strokeStyle = color; ctx.lineWidth = line; ctx.stroke();
  }
  function mushroom(x, y, scale, bright) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    if (bright) glow(0, -12, 42, 'rgba(81,181,206,.17)');
    ctx.strokeStyle = '#7296ab'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-3, -8, 0, -17); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -18, 13, 8, -.12, Math.PI, Math.PI * 2);
    ctx.quadraticCurveTo(0, -11, -13, -18); ctx.fillStyle = bright ? '#81c4d0' : '#4d7e99'; ctx.fill();
    ctx.strokeStyle = '#b6dcdf'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
  function backdrop() {
    var bg = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
    bg.addColorStop(0, '#0c1425'); bg.addColorStop(.48, '#163047'); bg.addColorStop(1, '#101e30');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, viewport.w, WORLD_HEIGHT);
    glow(viewport.w * .64 - camera * .08, 180, 350, 'rgba(72,139,167,.14)');
    ctx.save(); ctx.translate(-camera * .15, 0);
    for (var i = -1; i < 15; i++) {
      var x = i * 255 + 40;
      arch(x, 105 + i % 3 * 18, 160, 340, '#284157', 16);
      arch(x + 16, 117 + i % 3 * 18, 128, 320, '#1c3348', 2);
      ctx.fillStyle = '#1c3349'; ctx.fillRect(x - 15, 275, 28, 185);
      ctx.fillStyle = '#3d5367'; ctx.globalAlpha = .2;
      ctx.fillRect(x - 14, 279, 3, 180); ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.save(); ctx.translate(-camera * .34, 0);
    for (var r = -1; r < 11; r++) {
      var rx = r * 350;
      path([[rx, 500], [rx + 25, 390], [rx + 62, 404], [rx + 74, 340], [rx + 119, 365],
        [rx + 180, 330], [rx + 217, 382], [rx + 260, 367], [rx + 330, 500]], '#1c3549');
      arch(rx + 104, 245, 80, 230, '#2c485b', 11);
    }
    ctx.restore();
    ctx.save(); ctx.translate(-camera * .5, 0);
    for (var j = 0; j < 26; j++) {
      var ceilingX = j * 154 - 40;
      path([[ceilingX, 0], [ceilingX + 17, 48 + j % 4 * 16], [ceilingX + 33, 23],
        [ceilingX + 43, 106 - j % 3 * 20], [ceilingX + 69, 21], [ceilingX + 145, 0]], '#0c1728');
      if (j % 2 === 0) {
        ctx.strokeStyle = '#36516a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ceilingX + 66, 13);
        ctx.bezierCurveTo(ceilingX + 60, 70, ceilingX + 86, 118, ceilingX + 67, 160); ctx.stroke();
        for (var k = 0; k < 5; k++) {
          ctx.beginPath(); ctx.ellipse(ceilingX + 71 + Math.sin(k) * 6, 52 + k * 18, 4, 8, k % 2 ? .6 : -.6, 0, Math.PI * 2);
          ctx.fillStyle = '#365169'; ctx.fill();
        }
      }
    }
    ctx.restore();
    // Layers of cool mist give the ruins depth without covering the route.
    for (var m = 0; m < 4; m++) {
      var mist = ctx.createLinearGradient(0, 315 + m * 33, 0, 420 + m * 16);
      mist.addColorStop(0, 'rgba(105,164,185,0)'); mist.addColorStop(.6, 'rgba(105,164,185,.035)'); mist.addColorStop(1, 'rgba(105,164,185,0)');
      ctx.fillStyle = mist; ctx.fillRect(0, 315 + m * 33, viewport.w, 120);
    }
    for (var f = 0; f < 46; f++) {
      var fx = ((f * 167.3 - camera * .22) % (viewport.w + 60) + viewport.w + 60) % (viewport.w + 60) - 30;
      var fy = 75 + (f * 73.1 % 340) + (reducedMotion ? 0 : Math.sin(time * .5 + f) * 8);
      ctx.globalAlpha = .13 + (Math.sin(f * 3 + time) + 1) * .09;
      ctx.fillStyle = '#a8cfd7'; ctx.fillRect(fx, fy, f % 4 === 0 ? 2 : 1, 2);
    }
    ctx.globalAlpha = 1;
  }
  function drawPlatform(p, index) {
    if (p.x + p.w < camera - 30 || p.x > camera + viewport.w + 30) return;
    var g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, '#3b566a'); g.addColorStop(.15, '#253c50'); g.addColorStop(1, '#111e30');
    path([[p.x, p.y + 4], [p.x + 6, p.y], [p.x + p.w - 8, p.y], [p.x + p.w, p.y + 6],
      [p.x + p.w - 2, p.y + p.h], [p.x + 3, p.y + p.h]], g);
    ctx.strokeStyle = '#688da1'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p.x + 6, p.y + 1); ctx.lineTo(p.x + p.w - 8, p.y + 1); ctx.stroke();
    ctx.strokeStyle = '#152a3e'; ctx.lineWidth = 1;
    for (var x = p.x + 18; x < p.x + p.w - 10; x += 47) {
      ctx.beginPath(); ctx.moveTo(x, p.y + 5); ctx.lineTo(x + 4, p.y + 14); ctx.lineTo(x - 1, p.y + Math.min(p.h, 27)); ctx.stroke();
    }
    if (!p.ground) {
      for (var j = 0; j < 3; j++) {
        var xx = p.x + 12 + j * 28;
        ctx.strokeStyle = '#294b5b'; ctx.beginPath(); ctx.moveTo(xx, p.y + p.h - 2);
        ctx.quadraticCurveTo(xx - 6, p.y + p.h + 12, xx + 2, p.y + p.h + 24 + j % 2 * 9); ctx.stroke();
      }
    }
    for (var n = 0; n < p.w / 90; n++) {
      var grassX = p.x + 23 + n * 83;
      ctx.strokeStyle = '#537b84'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(grassX - 4, p.y); ctx.quadraticCurveTo(grassX - 5, p.y - 10, grassX - 8, p.y - 12);
      ctx.moveTo(grassX, p.y); ctx.quadraticCurveTo(grassX + 3, p.y - 9, grassX + 6, p.y - 8); ctx.stroke();
    }
    mushroom(p.x + p.w - 22, p.y, .65 + index % 3 * .13, index % 2 === 0);
    if (p.ground) mushroom(p.x + 40, p.y, .65, true);
  }
  function drawCheckpoint(cp, index) {
    var active = checkpoint >= index + 1;
    if (active) glow(cp.x, cp.y - 47, 75, 'rgba(148,222,220,.2)');
    ctx.fillStyle = '#314658'; ctx.fillRect(cp.x - 13, cp.y - 10, 26, 10); ctx.fillRect(cp.x - 6, cp.y - 38, 12, 30);
    ctx.strokeStyle = '#7c9bb1'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cp.x - 15, cp.y - 56); ctx.lineTo(cp.x + 15, cp.y - 56);
    ctx.lineTo(cp.x + 11, cp.y - 36); ctx.lineTo(cp.x - 11, cp.y - 36); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = active ? '#d8f3de' : '#688294';
    ctx.beginPath(); ctx.ellipse(cp.x, cp.y - 46, active ? 5 : 3, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.font = '10px Arial,"Microsoft JhengHei",sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = active ? '#c8dfdb' : '#9aafbd'; ctx.fillText('燈臺 ' + (index + 1), cp.x, cp.y - 72);
  }
  function drawPortal() {
    glow(portal.x + 29, portal.y + 28, 112, 'rgba(149,219,227,.24)');
    arch(portal.x - 5, portal.y - 32, 68, 98, '#455c72', 12);
    arch(portal.x + 2, portal.y - 25, 54, 91, '#a2bdc9', 2);
    var door = ctx.createLinearGradient(0, portal.y - 8, 0, portal.y + 65);
    door.addColorStop(0, '#b6e0e066'); door.addColorStop(1, '#95d6df08'); ctx.fillStyle = door;
    ctx.beginPath(); ctx.moveTo(portal.x + 7, portal.y + 65); ctx.lineTo(portal.x + 7, portal.y + 6);
    ctx.bezierCurveTo(portal.x + 7, portal.y - 28, portal.x + 51, portal.y - 28, portal.x + 51, portal.y + 6);
    ctx.lineTo(portal.x + 51, portal.y + 65); ctx.fill();
    for (var i = 0; i < 9; i++) {
      var yy = portal.y + 58 - (time * 17 + i * 12) % 82;
      ctx.fillStyle = '#c4eef1'; ctx.globalAlpha = .3 + i % 3 * .12;
      ctx.fillRect(portal.x + 14 + i * 17 % 33, yy, 2, 3);
    }
    ctx.globalAlpha = 1; ctx.fillStyle = '#c4dce0'; ctx.font = '11px Arial,"Microsoft JhengHei",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('光 門', portal.x + 29, portal.y - 52);
  }
  function drawPlayer() {
    if (player.invincible > 0 && Math.floor(time * 12) % 2 === 0) ctx.globalAlpha = .45;
    var px = player.x + 12; var py = player.y;
    var bob = player.grounded && Math.abs(player.vx) > 10 ? Math.sin(time * 18) * 1.5 : 0;
    ctx.save(); ctx.translate(px, py + bob); ctx.scale(player.facing, 1);
    if (player.dashTime > 0) {
      for (var i = 1; i <= 3; i++) {
        ctx.globalAlpha = .12 / i; ctx.fillStyle = '#aad7e5'; ctx.beginPath(); ctx.ellipse(-i * 12, 23, 11, 18, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // The small pilgrim wears a blue ragged cloak and an ivory seed-shaped mask.
    ctx.fillStyle = '#080f1d'; ctx.beginPath(); ctx.ellipse(0, 41, 15, 3, 0, 0, Math.PI * 2); ctx.fill();
    path([[-8, 21], [7, 20], [12 + Math.min(4, Math.abs(player.vx) / 80), 39], [4, 36], [-1, 42], [-6, 38], [-13, 40]], '#344d6b', '#7c96ab', 1);
    ctx.strokeStyle = '#151d31'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-4, 37); ctx.lineTo(-4 + Math.sin(time * 18) * (player.grounded ? 3 : 0), 42);
    ctx.moveTo(4, 36); ctx.lineTo(4 - Math.sin(time * 18) * (player.grounded ? 3 : 0), 42); ctx.stroke();
    path([[-10, 19], [-17 - Math.min(10, Math.abs(player.vx) / 25), 25], [-15, 27], [-5, 23], [8, 24], [9, 19]], '#819bab');
    ctx.fillStyle = '#dce9e6'; ctx.strokeStyle = '#a5c4cc'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-9, 7); ctx.quadraticCurveTo(-13, -5, -8, -7);
    ctx.quadraticCurveTo(-3, -5, -4, 3); ctx.quadraticCurveTo(1, 0, 5, 3);
    ctx.quadraticCurveTo(7, -6, 11, -5); ctx.quadraticCurveTo(15, -2, 11, 8);
    ctx.quadraticCurveTo(14, 19, 2, 23); ctx.quadraticCurveTo(-11, 21, -9, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#111d2b'; ctx.beginPath(); ctx.ellipse(-4, 12, 2.3, 4, .12, 0, Math.PI * 2);
    ctx.ellipse(6, 11, 2.3, 3.8, -.12, 0, Math.PI * 2); ctx.fill();
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function render() {
    ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    var scale = canvas.height / viewport.dpr / WORLD_HEIGHT;
    ctx.scale(scale, scale); backdrop();
    ctx.save(); ctx.translate(-camera, 0);
    platforms.forEach(drawPlatform);
    spikes.forEach(function (spike) {
      for (var i = 0; i < spike.w; i += 12) {
        path([[spike.x + i, spike.y + spike.h], [spike.x + i + 6, spike.y], [spike.x + i + 12, spike.y + spike.h]], '#6d8297', '#b0bacc', 1);
      }
    });
    checkpoints.forEach(drawCheckpoint); drawPortal();
    lights.forEach(function (light, index) {
      if (collected.has(index)) return;
      var bob = reducedMotion ? 0 : Math.sin(time * 2 + index) * 4;
      glow(light.x, light.y + bob, 42, 'rgba(180,234,209,.22)');
      path([[light.x, light.y - 9 + bob], [light.x + 5, light.y + bob], [light.x, light.y + 9 + bob], [light.x - 5, light.y + bob]], '#d4f1d7');
      ctx.strokeStyle = '#a5d5d9'; ctx.globalAlpha = .5; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(light.x, light.y + bob, 12, 12, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    });
    particles.forEach(function (p) { ctx.globalAlpha = p.life / p.max; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 2, 2); });
    ctx.globalAlpha = 1; drawPlayer(); ctx.restore();
    // A soft vignette frames the playable cavern.
    var shade = ctx.createLinearGradient(0, 0, 0, 500);
    shade.addColorStop(0, 'rgba(3,9,20,.35)'); shade.addColorStop(.3, 'rgba(3,9,20,0)'); shade.addColorStop(.8, 'rgba(3,9,20,0)'); shade.addColorStop(1, 'rgba(3,9,20,.3)');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, viewport.w, 500);
  }
  function tick(stamp) {
    frame = 0;
    if (status !== 'running' || document.hidden || !visible) return;
    if (!lastTime) lastTime = stamp;
    accumulator += Math.min(.05, (stamp - lastTime) / 1000); lastTime = stamp;
    while (accumulator >= STEP && status === 'running') { update(STEP); accumulator -= STEP; }
    render(); updateHud();
    if (status === 'running') frame = window.requestAnimationFrame(tick);
  }
  function startLoop() {
    if (!frame && status === 'running' && !document.hidden && visible) {
      lastTime = 0; accumulator = 0; frame = window.requestAnimationFrame(tick);
    }
  }
  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    viewport.dpr = Math.min(2, window.devicePixelRatio || 1);
    viewport.w = WORLD_HEIGHT * rect.width / rect.height;
    canvas.width = Math.round(rect.width * viewport.dpr); canvas.height = Math.round(rect.height * viewport.dpr);
    camera = Math.max(0, Math.min(Math.max(0, WORLD_WIDTH - viewport.w), player.x - viewport.w * .36));
    render();
  }
  primary.addEventListener('click', function () { if (status === 'paused') resume(); else begin(); });
  pauseButton.addEventListener('click', function () { if (status === 'running') pause(); else resume(); });
  root.querySelector('.pg-restart').addEventListener('click', begin);
  canvas.addEventListener('pointerdown', function () { root.focus({ preventScroll: true }); });
  var activeCodes = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'KeyA', 'KeyD', 'KeyW', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyX', 'KeyP'];
  document.addEventListener('keydown', function (event) {
    if (!root.contains(document.activeElement) && !root.contains(event.target)) return;
    if (!activeCodes.includes(event.code)) return;
    event.preventDefault();
    if (event.code === 'KeyP' && !event.repeat) { if (status === 'running') pause(); else resume(); return; }
    if (status !== 'running') return;
    keys.add(event.code);
    if (!event.repeat && ['Space', 'KeyW', 'ArrowUp'].includes(event.code)) jumpBuffer = .14;
    if (!event.repeat && ['ShiftLeft', 'ShiftRight', 'KeyX'].includes(event.code)) dash();
  });
  document.addEventListener('keyup', function (event) { keys.delete(event.code); });
  root.querySelectorAll('.pg-control').forEach(function (button) {
    button.addEventListener('pointerdown', function (event) {
      event.preventDefault();
      if (status !== 'running') return;
      root.focus({ preventScroll: true });
      var action = button.dataset.action;
      touches.set(event.pointerId, action); button.classList.add('pg-held');
      if (button.setPointerCapture) button.setPointerCapture(event.pointerId);
      if (action === 'jump') jumpBuffer = .14;
      if (action === 'dash') dash();
    });
    function release(event) {
      touches.delete(event.pointerId);
      if (!hasTouch(button.dataset.action)) button.classList.remove('pg-held');
    }
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    button.addEventListener('click', function (event) {
      // Keyboard activation of the touch controls remains usable.
      if (event.detail !== 0 || status !== 'running') return;
      if (button.dataset.action === 'jump') jumpBuffer = .14;
      if (button.dataset.action === 'dash') dash();
    });
  });
  root.addEventListener('focusout', function (event) { if (!root.contains(event.relatedTarget)) clearInput(); });
  window.addEventListener('blur', function () { clearInput(); if (status === 'running') pause('視窗已離開焦點。按下繼續冒險，再接著走。'); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause('頁面已暫時離開。回來後，按下繼續冒險。'); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (!visible) pause('遊戲已離開畫面。回到這裡後，按下繼續冒險。');
    }, { threshold: .08 }).observe(root);
  }
  reset();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  resize();
}());
