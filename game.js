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
        this.explosions = [];

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

        // Upgrade system - weapons from config, stats from config
        this.availableUpgrades = [];

        // Add all weapons from WeaponConfigs
        for (const [id, config] of Object.entries(WeaponConfigs)) {
            this.availableUpgrades.push({
                type: 'weapon',
                id: id,
                name: `${config.emoji} ${config.name}`,
                description: config.description
            });
        }

        // Add stat upgrades from config
        for (const [id, config] of Object.entries(GameConfig.ui.statUpgrades)) {
            this.availableUpgrades.push({
                type: 'stat',
                id: id,
                name: `${config.emoji} ${config.name}`,
                description: config.description,
                amount: config.amount
            });
        }
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
        this.explosions = [];
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
        const dt = Math.min((now - this.lastTime) / 1000, GameConfig.performance.maxDeltaTime);
        this.lastTime = now;

        if (!this.paused) {
            this.update(dt);
        }

        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Main game update loop
     *
     * Handles:
     * - Combo system (resets after 2s of no kills)
     * - Screen shake effects
     * - Power-up timers
     * - Player/enemy updates
     * - Collision detection
     * - Particle effects
     * - Pickup magnetism
     * - Level-up detection
     */
    update(dt) {
        this.time += dt;

        // ========== COMBO SYSTEM ==========
        // Combo increases with each kill, providing XP bonus
        // Resets if no kill within timeout period (2 seconds)
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
            this.combo = 0;
        }

        // ========== SCREEN SHAKE ==========
        // Decays naturally over time
        this.screenShake = Math.max(0, this.screenShake - dt * GameConfig.combat.screenShakeDecay);

        // Update active power-ups
        for (let key in this.activePowerUps) {
            this.activePowerUps[key] = Math.max(0, this.activePowerUps[key] - dt);
        }

        // Apply power-up effects
        const speedMultiplier = this.activePowerUps.speed > 0 ? GameConfig.powerUps.speedMultiplier : 1;
        this.player.speedMultiplier = speedMultiplier;
        this.player.invincible = this.activePowerUps.invincible > 0;

        // Update player
        this.player.update(dt, this.keys, this.canvas);

        // Update enemies
        this.enemySpawner.update(dt, this.player, this.canvas);

        // Update weapons
        this.player.updateWeapons(dt, this.enemySpawner.getEnemies());

        // ========== ENEMY DEATH HANDLING ==========
        // Process all dead enemies and create drops/effects
        const enemies = this.enemySpawner.getEnemies();
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (enemy.dead) {
                this.kills++;
                this.gold += enemy.goldValue;

                // ========== COMBO SYSTEM ==========
                // Increment combo and reset timer
                // Each kill extends the combo window by 2 seconds
                this.combo++;
                this.comboTimer = GameConfig.combat.comboTimeout;

                // Create death particles for visual feedback
                this.createDeathParticles(enemy.x, enemy.y, enemy.config.emoji);

                // ========== XP DROP WITH COMBO BONUS ==========
                // Base XP + 10% per combo count
                // Example: 5x combo = 150% XP (50% bonus)
                const xpBonus = 1 + (this.combo * GameConfig.combat.comboXpBonus);
                this.dropXP(enemy.x, enemy.y, Math.floor(enemy.xpValue * xpBonus));

                // ========== GOLD DROP ==========
                // 30% chance to drop gold worth 2x enemy's gold value
                if (Math.random() < GameConfig.pickups.goldDropChance) {
                    this.dropGold(enemy.x, enemy.y, enemy.goldValue * GameConfig.pickups.goldDropMultiplier);
                }

                // ========== BOSS REWARDS ==========
                // Bosses always drop power-ups and trigger screen shake
                if (enemy.type === 'boss') {
                    this.dropPowerUp(enemy.x, enemy.y);
                    this.screenShake = GameConfig.combat.screenShakeDuration;
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
            p.vy += GameConfig.pickups.particleGravity * dt; // Gravity

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const exp = this.explosions[i];
            exp.life -= dt;
            exp.radius += dt * GameConfig.visual.explosionGrowthRate;

            if (exp.life <= 0) {
                this.explosions.splice(i, 1);
            }
        }

        // ========== PICKUP MAGNETISM SYSTEM ==========
        // Pickups are attracted to player when within range
        // Magnet power-up increases range from 100px to 300px
        const magnetRange = this.activePowerUps.magnet > 0 ?
            GameConfig.powerUps.magnetRange :
            GameConfig.powerUps.normalMagnetRange;

        for (let pickup of this.pickups) {
            // ========== MAGNETIC ATTRACTION ==========
            // Move pickups towards player if within range
            // Creates satisfying vacuum effect
            const dist = distance(pickup.x, pickup.y, this.player.x, this.player.y);
            if (dist < magnetRange) {
                const dx = this.player.x - pickup.x;
                const dy = this.player.y - pickup.y;
                const norm = normalizeVector(dx, dy);
                // Move at constant speed (300 px/s) regardless of distance
                pickup.x += norm.x * GameConfig.pickups.pickupMagnetSpeed * dt;
                pickup.y += norm.y * GameConfig.pickups.pickupMagnetSpeed * dt;
            }

            // ========== PICKUP COLLECTION ==========
            // Check collision with player hitbox
            if (circleCollision(pickup.x, pickup.y, GameConfig.pickups.pickupSize, this.player.x, this.player.y, this.player.size)) {
                if (pickup.type === 'xp') {
                    // Gain XP and check for level up
                    const leveledUp = this.player.gainXP(pickup.value);
                    if (leveledUp) {
                        this.showLevelUpScreen(); // Pause and show upgrade choices
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
        for (let i = 0; i < GameConfig.visual.starCount; i++) {
            const x = (i * 173) % this.canvas.width;
            const y = (i * 271) % this.canvas.height;
            const size = (i % 3) + 1;
            this.ctx.fillRect(x, y, size, size);
        }

        // Draw grid for depth
        this.ctx.strokeStyle = `rgba(100, 100, 150, ${GameConfig.visual.gridOpacity})`;
        this.ctx.lineWidth = 1;
        const gridSize = GameConfig.visual.gridSize;
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
            const emoji = pickup.type === 'xp' ? GameConfig.pickups.xpEmoji : GameConfig.pickups.goldEmoji;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = pickup.type === 'xp' ? '#00ff00' : '#ffd700';
            this.ctx.fillText(emoji, pickup.x, pickup.y);
            this.ctx.shadowBlur = 0;
        }

        // Draw power-ups
        this.ctx.font = '28px Arial';
        for (let powerUp of this.powerUps) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#ffff00';
            this.ctx.fillText(GameConfig.powerUps.emojis[powerUp.type], powerUp.x, powerUp.y);
            this.ctx.shadowBlur = 0;
        }

        // Draw enemies
        this.enemySpawner.draw(this.ctx);

        // Draw player
        this.player.draw(this.ctx);

        // Draw explosions
        for (let exp of this.explosions) {
            const alpha = exp.life / exp.maxLife * 0.5;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = exp.color;
            this.ctx.beginPath();
            this.ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;

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
        const type = randomChoice(GameConfig.powerUps.types);
        this.powerUps.push({
            x: x,
            y: y,
            type: type,
            collected: false
        });
    }

    activatePowerUp(type) {
        this.activePowerUps[type] = GameConfig.powerUps.duration;

        // Create particles
        for (let i = 0; i < GameConfig.powerUps.particleCount; i++) {
            const angle = (Math.PI * 2 * i) / GameConfig.powerUps.particleCount;
            const speed = randomRange(GameConfig.pickups.particleSpeedMin, GameConfig.pickups.particleSpeedMax);
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                maxLife: 1.0,
                emoji: GameConfig.powerUps.emojis[type]
            });
        }
    }

    createDeathParticles(x, y, emoji) {
        // Create multiple particles
        for (let i = 0; i < GameConfig.pickups.deathParticleCount; i++) {
            const angle = (Math.PI * 2 * i) / GameConfig.pickups.deathParticleCount;
            const speed = randomRange(GameConfig.pickups.particleSpeedMin, GameConfig.pickups.particleSpeedMax);
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed + GameConfig.pickups.particleUpwardVelocity,
                life: randomRange(GameConfig.pickups.particleLifetimeMin, GameConfig.pickups.particleLifetimeMax),
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
        const availableOptions = [];

        // Add weapon upgrades that can still be upgraded
        for (let upgrade of this.availableUpgrades) {
            if (upgrade.type === 'weapon') {
                const weapon = this.player.weapons.find(w => w.type === upgrade.id);
                if (weapon && weapon.canUpgrade()) {
                    availableOptions.push({...upgrade, weapon: weapon});
                } else if (!weapon) {
                    availableOptions.push(upgrade);
                }
            } else {
                availableOptions.push(upgrade);
            }
        }

        // Pick random upgrade choices
        for (let i = 0; i < GameConfig.ui.upgradeChoiceCount && availableOptions.length > 0; i++) {
            const index = randomInt(0, availableOptions.length - 1);
            choices.push(availableOptions[index]);
            availableOptions.splice(index, 1);
        }

        // Create upgrade cards
        upgradeChoices.innerHTML = '';
        for (let upgrade of choices) {
            const card = document.createElement('div');
            card.className = 'upgrade-card';

            let weaponInfo = '';
            if (upgrade.type === 'weapon') {
                const weapon = this.player.weapons.find(w => w.type === upgrade.id);
                if (weapon) {
                    const nextLevel = weapon.level + 1;
                    const displayName = weapon.getDisplayName();
                    if (nextLevel === weapon.maxLevel) {
                        weaponInfo = `<p class="evolution-text">⚡ EVOLVES! ⚡</p>`;
                    }
                    weaponInfo += `<p class="level-info">Lv ${weapon.level} → ${nextLevel}</p>`;
                } else {
                    weaponInfo = '<p class="level-info">NEW!</p>';
                }
            }

            card.innerHTML = `
                <h3>${upgrade.name}</h3>
                <p>${upgrade.description}</p>
                ${weaponInfo}
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

        // Update weapon display
        const weaponDisplay = document.getElementById('weapon-display');
        if (weaponDisplay) {
            weaponDisplay.innerHTML = '';
            for (let weapon of this.player.weapons) {
                const weaponItem = document.createElement('div');
                weaponItem.className = 'weapon-item';
                const displayName = weapon.getDisplayName();
                const emoji = weapon.getEmoji();
                const isEvolved = weapon.isEvolved();
                const evolvedClass = isEvolved ? 'weapon-evolved' : '';
                weaponItem.innerHTML = `
                    <span class="weapon-emoji">${emoji}</span>
                    <span class="${evolvedClass}">${displayName}</span>
                    <span class="weapon-level">Lv${weapon.level}</span>
                `;
                weaponDisplay.appendChild(weaponItem);
            }
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
