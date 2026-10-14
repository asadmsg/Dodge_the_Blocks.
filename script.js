const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const livesEl = document.getElementById('lives');
const finalScoreEl = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverEl = document.getElementById('gameOver');

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

let player = {
    x: canvasWidth / 2 - 25,
    y: canvasHeight - 60,
    width: 50,
    height: 40,
    speed: 7,
    color: '#00d9ff',
    dx: 0
};

let blocks = [];
let particles = [];
let score = 0;
let highScore = localStorage.getItem('dodgeHighScore') || 0;
let lives = 3;
let gameRunning = false;
let animationId = null;
let spawnTimer = 0;
let spawnInterval = 1500;
let difficultyTimer = 0;
let keys = { left: false, right: false };

highScoreEl.textContent = highScore;

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    
    const gradient = ctx.createLinearGradient(-player.width/2, 0, player.width/2, 0);
    gradient.addColorStop(0, '#00d9ff');
    gradient.addColorStop(0.5, '#00ffff');
    gradient.addColorStop(1, '#00d9ff');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-player.width/2, player.height/2);
    ctx.lineTo(0, -player.height/2);
    ctx.lineTo(player.width/2, player.height/2);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-10, -5, 4, 0, Math.PI * 2);
    ctx.arc(10, -5, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-10, -5, 2, 0, Math.PI * 2);
    ctx.arc(10, -5, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawBlocks() {
    blocks.forEach(block => {
        const gradient = ctx.createLinearGradient(block.x, block.y, block.x, block.y + block.height);
        gradient.addColorStop(0, '#ff4757');
        gradient.addColorStop(1, '#c73659');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(block.x, block.y, block.width, block.height);
        
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(block.x, block.y, block.width, 5);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(block.x, block.y, block.width, block.height);
    });
}

function drawParticles() {
    particles.forEach((p, i) => {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

function updatePlayer() {
    if (keys.left && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.right && player.x < canvasWidth - player.width) {
        player.x += player.speed;
    }
}

function spawnBlock() {
    const width = 40 + Math.random() * 60;
    const x = Math.random() * (canvasWidth - width);
    const speed = 3 + Math.random() * 4 + score * 0.02;
    
    blocks.push({
        x: x,
        y: -50,
        width: width,
        height: 40,
        speed: speed,
        passed: false
    });
}

function updateBlocks() {
    blocks.forEach((block, i) => {
        block.y += block.speed;
        
        if (block.y > canvasHeight && !block.passed) {
            block.passed = true;
            score += 10;
            scoreEl.textContent = score;
            
            if (score > highScore) {
                highScore = score;
                highScoreEl.textContent = highScore;
                localStorage.setItem('dodgeHighScore', highScore);
            }
        }
        
        if (block.y > canvasHeight + 50) {
            blocks.splice(i, 1);
        }
    });
}

function checkCollisions() {
    blocks.forEach((block, i) => {
        if (player.x < block.x + block.width &&
            player.x + player.width > block.x &&
            player.y < block.y + block.height &&
            player.y + player.height > block.y) {
            
            createExplosion(block.x + block.width/2, block.y + block.height/2, '#ff4757');
            blocks.splice(i, 1);
            lives--;
            livesEl.textContent = lives;
            
            if (lives <= 0) {
                gameOver();
            } else {
                flashScreen();
            }
        }
    });
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            size: 2 + Math.random() * 6,
            color: color,
            speedX: (Math.random() - 0.5) * 10,
            speedY: (Math.random() - 0.5) * 10,
            life: 30 + Math.random() * 30,
            maxLife: 60
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.2;
        p.life--;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function flashScreen() {
    canvas.style.boxShadow = 'inset 0 0 50px rgba(255, 71, 87, 0.8), 0 0 30px rgba(255, 71, 87, 0.5)';
    setTimeout(() => {
        canvas.style.boxShadow = 'inset 0 0 20px rgba(0, 0, 0, 0.5)';
    }, 150);
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    finalScoreEl.textContent = score;
    gameOverEl.classList.remove('hidden');
    startBtn.style.display = 'none';
    restartBtn.style.display = 'inline-block';
}

function restartGame() {
    player.x = canvasWidth / 2 - 25;
    blocks = [];
    particles = [];
    score = 0;
    lives = 3;
    spawnInterval = 1500;
    difficultyTimer = 0;
    
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    gameOverEl.classList.add('hidden');
    startBtn.style.display = 'none';
    restartBtn.style.display = 'none';
    
    gameRunning = true;
    gameLoop();
}

function startGame() {
    startBtn.style.display = 'none';
    restartBtn.style.display = 'none';
    gameRunning = true;
    gameLoop();
}

function drawBackground() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.fillStyle = 'rgba(0, 217, 255, 0.03)';
    for (let i = 0; i < canvasWidth; i += 40) {
        ctx.fillRect(i, 0, 1, canvasHeight);
    }
    for (let i = 0; i < canvasHeight; i += 40) {
        ctx.fillRect(0, i, canvasWidth, 1);
    }
}

function gameLoop() {
    if (!gameRunning) return;
    
    drawBackground();
    drawPlayer();
    drawBlocks();
    drawParticles();
    
    updatePlayer();
    updateBlocks();
    updateParticles();
    checkCollisions();
    
    spawnTimer += 16;
    if (spawnTimer >= spawnInterval) {
        spawnBlock();
        spawnTimer = 0;
    }
    
    difficultyTimer += 16;
    if (difficultyTimer >= 10000 && spawnInterval > 500) {
        spawnInterval -= 50;
        difficultyTimer = 0;
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = false;
    }
});

canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    if (x < canvasWidth / 2) keys.left = true;
    else keys.right = true;
    e.preventDefault();
});

canvas.addEventListener('touchend', () => {
    keys.left = false;
    keys.right = false;
});

canvas.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    keys.left = x < canvasWidth / 2;
    keys.right = x >= canvasWidth / 2;
    e.preventDefault();
});