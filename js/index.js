// --------------------------
// 🔊 오디오 설정
// --------------------------
let bgm = new Audio('./sound/bgm.mp3');
bgm.loop = true;
bgm.volume = 0.4;

let popSound = new Audio('./sound/pop.mp3');  // 터지는 효과음
popSound.volume = 0.7;


// --------------------------
// 게임 리소스
// --------------------------
const spriteSpecs = [
    'img:./img/charater-01.png', // 인덱스 0 -> -10점
    'img:./img/charater-02.png',
    'img:./img/charater-03.png',
    'img:./img/charater-04.png'
];

const explosionGifs = [
    './img/effect-01.gif',
    './img/effect-02.gif',
    './img/effect-03.gif',
    './img/effect-04.gif'
];

const GAME_DURATION = 30;

const arena = document.getElementById('arena');
const timeEl = document.getElementById('time');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const endOverlay = document.getElementById('endOverlay');
const retryBtn = document.getElementById('retryBtn');
const resetBtn = document.getElementById('resetBtn');
const startOverlay = document.getElementById('startOverlay');
const mainStartBtn = document.getElementById('mainStartBtn');

let spawnTimer = null;
let gameTimer = null;
let startTs = 0;
let timeLeft = GAME_DURATION;
let score = 0;
let idSeq = 1;

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
}

function updateHud() {
    timeEl.textContent = formatTime(timeLeft);
    scoreEl.textContent = score;
}

function showFloat(xPct, yPct, text, positive) {
    const id = 'f' + (idSeq++);
    const el = document.createElement('div');
    el.className = 'float-score';
    el.id = id;
    el.style.left = xPct + '%';
    el.style.top = yPct + '%';
    el.style.color = positive ? '#10b981' : '#ef4444';
    el.textContent = text;
    arena.appendChild(el);
    requestAnimationFrame(() => {
        el.style.transform = 'translate(-50%,-180%) scale(1.02)';
        el.style.opacity = '0';
    });
    setTimeout(() => { try { el.remove(); } catch (e) {} }, 900);
}


// -----------------------------------------------------
// 🎯 스프라이트 클릭 / 터치 처리 (핵심 최적화 부분)
// -----------------------------------------------------
function handleSpriteTap(ev) {
    ev.stopPropagation();
    ev.preventDefault();

    const btn = ev.currentTarget;
    if (btn.disabled) return;
    btn.disabled = true;
    btn.remove();

    const idx = Number(btn.dataset.type) || 0;
    const x = Number(btn.dataset.x);
    const y = Number(btn.dataset.y);

    if (idx === 0) {
        score -= 10;
        showFloat(x, y, '-10', false);
    } else {
        score += 10;
        showFloat(x, y, '+10', true);
    }
    updateHud();

    const gif = explosionGifs[idx];
    if (gif) addExplosionGif(x, y, gif, 1000);

    playPop();
}


// --------------------------
// 스프라이트 생성
// --------------------------
function spawnSprite() {
    const id = idSeq++;
    const x = rand(6, 94);
    const y = rand(8, 92);
    const typeIndex = Math.floor(rand(0, spriteSpecs.length));
    const spec = spriteSpecs[typeIndex] || '';
    const btn = document.createElement('button');

    btn.className = 'sprite-btn';
    btn.style.left = x + '%';
    btn.style.top = y + '%';
    btn.dataset.sid = id;
    btn.dataset.type = typeIndex;
    btn.dataset.x = x;
    btn.dataset.y = y;

    if (spec.startsWith('img:')) {
        const src = spec.slice(4);
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'sprite';
        img.onerror = function() {
            const p = document.createElement('div');
            p.className = 'sprite-box placeholder';
            p.textContent = 'NO IMG';
            btn.innerHTML = '';
            btn.appendChild(p);
        };
        btn.appendChild(img);
    }

    // ✔ click + touch 모두 지원
    btn.addEventListener('click', handleSpriteTap);
    btn.addEventListener('touchstart', handleSpriteTap);

    arena.appendChild(btn);

    // 자동 제거
    setTimeout(() => {
        try { if (btn.parentNode) btn.remove(); } catch (e) {}
    }, 5000);
}


// --------------------------
// 폭발 GIF
// --------------------------
function addExplosionGif(x, y, src, duration = 2000) {
    const id = 'g' + (idSeq++);
    const img = document.createElement('img');
    img.className = 'explosion-gif';
    img.src = src;
    img.style.left = x + '%';
    img.style.top = y + '%';
    img.id = id;
    img.onerror = function() {
        img.remove();
    };
    arena.appendChild(img);
    setTimeout(() => { try { img.remove(); } catch (e) {} }, duration);
}


// --------------------------
// 🔊 터짐 효과음 PLAY
// --------------------------
function playPop() {
    popSound.currentTime = 0;
    popSound.play().catch(e => {});
}


// --------------------------
// 게임 시작
// --------------------------
function startGame() {
    clearIntervals();
    arena.innerHTML = '';
    score = 0;
    timeLeft = GAME_DURATION;
    updateHud();
    endOverlay.style.display = 'none';

    if (startOverlay) startOverlay.style.display = 'none';

    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-block';

    // BGM 재생
    bgm.currentTime = 0;
    bgm.play().catch(e => {});

    spawnTimer = setInterval(() => {
        const count = Math.random() < 0.7 ? 1 : 2;
        for (let i = 0; i < count; i++) spawnSprite();
    }, 700);

    startTs = Date.now();
    gameTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTs) / 1000);
        const left = Math.max(0, GAME_DURATION - elapsed);
        timeLeft = left;
        updateHud();
        if (left <= 0) finishGame();
    }, 250);
}

function stopGame() {
    clearIntervals();
    arena.innerHTML = '';
    startBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';

    bgm.pause();
}

function finishGame() {
    clearIntervals();
    Array.from(arena.querySelectorAll('.sprite-btn')).forEach(n => n.remove());
    finalScoreEl.textContent = score;
    endOverlay.style.display = 'flex';

    startBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';

    bgm.pause();
}

function clearIntervals() {
    if (spawnTimer) {
        clearInterval(spawnTimer);
        spawnTimer = null;
    }
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}


// --------------------------
// 이벤트 바인딩 (✔ 터치 지원 강화)
// --------------------------
function bindDualEvent(element, event, handler) {
    element.addEventListener(event, handler);
    element.addEventListener('touchstart', handler);
}

bindDualEvent(mainStartBtn, 'click', startGame);
bindDualEvent(startBtn, 'click', startGame);

bindDualEvent(stopBtn, 'click', () => {
    stopGame();
    endOverlay.style.display = 'none';
});

bindDualEvent(retryBtn, 'click', startGame);

bindDualEvent(resetBtn, 'click', () => {
    endOverlay.style.display = 'none';
    if (startOverlay) startOverlay.style.display = 'flex';
    startBtn.style.display = 'none';
    stopBtn.style.display = 'none';
    score = 0;
    timeLeft = GAME_DURATION;
    updateHud();
    arena.innerHTML = '';
});

updateHud();


// -----------------------------------------------------
// 📌 터치 스크롤/확대 방지 (키오스크 필수)
// -----------------------------------------------------
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

// 배경 터치해도 클릭 안 생기게
arena.addEventListener('mousedown', e => e.preventDefault());
arena.addEventListener('touchstart', e => e.preventDefault());
