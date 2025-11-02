// Main Game Class

class Game {
    constructor(canvas, village) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.village = village;

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Game state
        this.running = false;
        this.paused = false;

        // Input
        this.keys = {};
        this.setupInput();

        // Game objects
        this.player = null;
        this.enemySpawner = null;

        // Pickups
        this.pickups = [];

        // Particles
        this.particles = [];

        // Power-ups
        this.powerUps = [];
        this.activePowerUps = {
            speed: 0,
            invincible: 0,
            magnet: 0
        };

        // Stats
        this.time = 0;
        this.kills = 0;
        this.gold = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.screenShake = 0;

        // Upgrade system
        this.availableUpgrades = [
            { type: 'weapon', id: 'fireball', name: '🔥 Fireball', description: 'Shoots fireballs that pierce enemies' },
            { type: 'weapon', id: 'lightning', name: '⚡ Lightning', description: 'Fast lightning bolts' },
            { type: 'weapon', id: 'axe', name: '🪓 Spinning Axe', description: 'Heavy axes that pierce many enemies' },
            { type: 'weapon', id: 'holy', name: '💧 Holy Water', description: 'Rapid holy water shots' },
            { type: 'stat', id: 'maxHp', name: '❤️ Max HP +20', description: 'Increase maximum health', amount: 20 },
            { type: 'stat', id: 'speed', name: '💨 Speed +30', description: 'Increase movement speed', amount: 30 },
            { type: 'stat', id: 'damage', name: '💪 Damage +15%', description: 'Increase all damage', amount: 0.15 }
        ];
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    start() {
        this.running = true;
        this.paused = false;
        this.time = 0;
        this.kills = 0;
        this.gold = 0;

        // Ensure canvas is properly sized
        this.resizeCanvas();

        // Create player
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        this.player.applyVillageBonuses(this.village);

        // Create enemy spawner
        this.enemySpawner = new EnemySpawner();

        // Clear pickups and particles
        this.pickups = [];
        this.particles = [];
        this.powerUps = [];
        this.activePowerUps = { speed: 0, invincible: 0, magnet: 0 };
        this.combo = 0;
        this.comboTimer = 0;
        this.screenShake = 0;

        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop();
    }

    gameLoop() {
        if (!this.running) return;

        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;

        if (!this.paused) {
            this.update(dt);
        }

        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }

    update(dt) {
        this.time += dt;
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
            this.combo = 0;
        }

        // Update screen shake
        this.screenShake = Math.max(0, this.screenShake - dt * 10);

        // Update active power-ups
        for (let key in this.activePowerUps) {
            this.activePowerUps[key] = Math.max(0, this.activePowerUps[key] - dt);
        }

        // Apply power-up effects
        const speedMultiplier = this.activePowerUps.speed > 0 ? 1.5 : 1;
        this.player.speedMultiplier = speedMultiplier;
        this.player.invincible = this.activePowerUps.invincible > 0;

        // Update player
        this.player.update(dt, this.keys, this.canvas);

        // Update enemies
        this.enemySpawner.update(dt, this.player, this.canvas);

        // Update weapons
        this.player.updateWeapons(dt, this.enemySpawner.getEnemies());

        // Check for dead enemies
        const enemies = this.enemySpawner.getEnemies();
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (enemy.dead) {
                this.kills++;
                this.gold += enemy.goldValue;

                // Combo system
                this.combo++;
                this.comboTimer = 2.0; // 2 seconds to keep combo

                // Create death particles
                this.createDeathParticles(enemy.x, enemy.y, enemy.config.emoji);

                // Drop XP (more with combo)
                const xpBonus = 1 + (this.combo * 0.1);
                this.dropXP(enemy.x, enemy.y, Math.floor(enemy.xpValue * xpBonus));

                // Chance to drop gold pickup
                if (Math.random() < 0.3) {
                    this.dropGold(enemy.x, enemy.y, enemy.goldValue * 2);
                }

                // Boss drops power-up
                if (enemy.type === 'boss') {
                    this.dropPowerUp(enemy.x, enemy.y);
                    this.screenShake = 1.0;
                }

                enemies.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt; // Gravity

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update pickups
        const magnetRange = this.activePowerUps.magnet > 0 ? 300 : 100;
        for (let pickup of this.pickups) {
            // Move towards player if close
            const dist = distance(pickup.x, pickup.y, this.player.x, this.player.y);
            if (dist < magnetRange) {
                const dx = this.player.x - pickup.x;
                const dy = this.player.y - pickup.y;
                const norm = normalizeVector(dx, dy);
                pickup.x += norm.x * 300 * dt;
                pickup.y += norm.y * 300 * dt;
            }

            // Check collision with player
            if (circleCollision(pickup.x, pickup.y, 10, this.player.x, this.player.y, this.player.size)) {
                if (pickup.type === 'xp') {
                    const leveledUp = this.player.gainXP(pickup.value);
                    if (leveledUp) {
                        this.showLevelUpScreen();
                    }
                } else if (pickup.type === 'gold') {
                    this.gold += pickup.value;
                }
                pickup.collected = true;
            }
        }

        this.pickups = this.pickups.filter(p => !p.collected);

        // Update power-ups
        for (let powerUp of this.powerUps) {
            const dist = distance(powerUp.x, powerUp.y, this.player.x, this.player.y);
            if (dist < 150) {
                const dx = this.player.x - powerUp.x;
                const dy = this.player.y - powerUp.y;
                const norm = normalizeVector(dx, dy);
                powerUp.x += norm.x * 200 * dt;
                powerUp.y += norm.y * 200 * dt;
            }

            if (circleCollision(powerUp.x, powerUp.y, 15, this.player.x, this.player.y, this.player.size)) {
                this.activatePowerUp(powerUp.type);
                powerUp.collected = true;
            }
        }

        this.powerUps = this.powerUps.filter(p => !p.collected);

        // Update UI
        this.updateUI();

        // Check game over
        if (this.player.hp <= 0) {
            this.gameOver();
        }
    }

    draw() {
        // Apply screen shake
        this.ctx.save();
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake * 20;
            const shakeY = (Math.random() - 0.5) * this.screenShake * 20;
            this.ctx.translate(shakeX, shakeY);
        }

        // Clear canvas
        this.ctx.fillStyle = '#0a0e27';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw stars background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 100; i++) {
            const x = (i * 173) % this.canvas.width;
            const y = (i * 271) % this.canvas.height;
            const size = (i % 3) + 1;
            this.ctx.fillRect(x, y, size, size);
        }

        // Draw grid for depth
        this.ctx.strokeStyle = 'rgba(100, 100, 150, 0.05)';
        this.ctx.lineWidth = 1;
        const gridSize = 50;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw pickups
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        for (let pickup of this.pickups) {
            const emoji = pickup.type === 'xp' ? '💎' : '🪙';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = pickup.type === 'xp' ? '#00ff00' : '#ffd700';
            this.ctx.fillText(emoji, pickup.x, pickup.y);
            this.ctx.shadowBlur = 0;
        }

        // Draw power-ups
        this.ctx.font = '28px Arial';
        for (let powerUp of this.powerUps) {
            const emojis = { speed: '⚡', invincible: '⭐', magnet: '🧲' };
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#ffff00';
            this.ctx.fillText(emojis[powerUp.type], powerUp.x, powerUp.y);
            this.ctx.shadowBlur = 0;
        }

        // Draw enemies
        this.enemySpawner.draw(this.ctx);

        // Draw player
        this.player.draw(this.ctx);

        // Draw particles
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        for (let p of this.particles) {
            const alpha = p.life / p.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillText(p.emoji, p.x, p.y);
        }
        this.ctx.globalAlpha = 1;

        this.ctx.restore();
    }

    dropXP(x, y, amount) {
        this.pickups.push({
            x: x,
            y: y,
            type: 'xp',
            value: amount,
            collected: false
        });
    }

    dropGold(x, y, amount) {
        this.pickups.push({
            x: x,
            y: y,
            type: 'gold',
            value: amount,
            collected: false
        });
    }

    dropPowerUp(x, y) {
        const types = ['speed', 'invincible', 'magnet'];
        const type = randomChoice(types);
        this.powerUps.push({
            x: x,
            y: y,
            type: type,
            collected: false
        });
    }

    activatePowerUp(type) {
        const duration = 10; // 10 seconds
        this.activePowerUps[type] = duration;

        // Create particles
        const emojis = { speed: '⚡', invincible: '⭐', magnet: '🧲' };
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const speed = randomRange(100, 200);
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                maxLife: 1.0,
                emoji: emojis[type]
            });
        }
    }

    createDeathParticles(x, y, emoji) {
        // Create multiple particles
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = randomRange(50, 150);
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 100,
                life: randomRange(0.5, 1.0),
                maxLife: 1.0,
                emoji: emoji
            });
        }
    }

    showLevelUpScreen() {
        this.paused = true;
        const screen = document.getElementById('levelup-screen');
        const upgradeChoices = document.getElementById('upgrade-choices');

        // Generate 3 random upgrades
        const choices = [];
        const availableOptions = [...this.availableUpgrades];

        for (let i = 0; i < 3 && availableOptions.length > 0; i++) {
            const index = randomInt(0, availableOptions.length - 1);
            choices.push(availableOptions[index]);
            availableOptions.splice(index, 1);
        }

        // Create upgrade cards
        upgradeChoices.innerHTML = '';
        for (let upgrade of choices) {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <h3>${upgrade.name}</h3>
                <p>${upgrade.description}</p>
            `;

            card.addEventListener('click', () => {
                this.selectUpgrade(upgrade);
                screen.classList.remove('active');
                this.paused = false;
            });

            upgradeChoices.appendChild(card);
        }

        screen.classList.add('active');
    }

    selectUpgrade(upgrade) {
        if (upgrade.type === 'weapon') {
            this.player.addWeapon(upgrade.id);
        } else if (upgrade.type === 'stat') {
            this.player.gainStat(upgrade.id, upgrade.amount);
        }
    }

    updateUI() {
        // Update HP bar
        const hpPercent = (this.player.hp / this.player.maxHp) * 100;
        document.getElementById('hp-fill').style.width = hpPercent + '%';
        document.getElementById('hp-text').textContent =
            `${Math.ceil(this.player.hp)}/${Math.ceil(this.player.maxHp)}`;

        // Update XP bar
        const xpPercent = (this.player.xp / this.player.xpToNextLevel) * 100;
        document.getElementById('xp-fill').style.width = xpPercent + '%';
        document.getElementById('xp-text').textContent = `Level ${this.player.level}`;

        // Update stats
        document.getElementById('time-display').textContent = formatTime(this.time);
        document.getElementById('kills-display').textContent = this.kills;
        document.getElementById('game-gold-display').textContent = this.gold;

        // Update wave and combo
        const waveDisplay = document.getElementById('wave-display');
        const comboDisplay = document.getElementById('combo-display');
        if (waveDisplay) waveDisplay.textContent = this.enemySpawner.getWaveNumber();
        if (comboDisplay) {
            comboDisplay.textContent = this.combo > 1 ? `${this.combo}x COMBO!` : '';
            comboDisplay.style.display = this.combo > 1 ? 'block' : 'none';
        }

        // Update power-up indicators
        const powerUpDisplay = document.getElementById('powerup-display');
        if (powerUpDisplay) {
            let text = '';
            if (this.activePowerUps.speed > 0) text += '⚡ ';
            if (this.activePowerUps.invincible > 0) text += '⭐ ';
            if (this.activePowerUps.magnet > 0) text += '🧲 ';
            powerUpDisplay.textContent = text;
            powerUpDisplay.style.display = text ? 'block' : 'none';
        }
    }

    gameOver() {
        this.running = false;

        // Add gold to village
        this.village.addGold(this.gold);
        this.village.updateBestTime(this.time);

        // Show game over screen
        const screen = document.getElementById('gameover-screen');
        document.getElementById('final-time').textContent = formatTime(this.time);
        document.getElementById('final-kills').textContent = this.kills;
        document.getElementById('final-gold').textContent = this.gold;

        screen.classList.add('active');
    }

    stop() {
        this.running = false;
    }
}
