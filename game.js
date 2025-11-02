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

        // Stats
        this.time = 0;
        this.kills = 0;
        this.gold = 0;

        // Upgrade system
        this.availableUpgrades = [
            { type: 'weapon', id: 'fireball', name: 'Fireball', description: 'Shoots fireballs that pierce enemies' },
            { type: 'weapon', id: 'lightning', name: 'Lightning', description: 'Fast lightning bolts' },
            { type: 'weapon', id: 'axe', name: 'Spinning Axe', description: 'Heavy axes that pierce many enemies' },
            { type: 'weapon', id: 'holy', name: 'Holy Water', description: 'Rapid holy water shots' },
            { type: 'stat', id: 'maxHp', name: 'Max HP +20', description: 'Increase maximum health', amount: 20 },
            { type: 'stat', id: 'speed', name: 'Speed +30', description: 'Increase movement speed', amount: 30 },
            { type: 'stat', id: 'damage', name: 'Damage +15%', description: 'Increase all damage', amount: 0.15 }
        ];
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        console.log('Canvas resized:', this.canvas.width, 'x', this.canvas.height);
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
        console.log('Game starting...');
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
        console.log('Player created at:', this.player.x, this.player.y);

        // Create enemy spawner
        this.enemySpawner = new EnemySpawner();

        // Clear pickups
        this.pickups = [];

        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop();
        console.log('Game loop started');
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

                // Drop XP
                this.dropXP(enemy.x, enemy.y, enemy.xpValue);

                // Chance to drop gold pickup
                if (Math.random() < 0.3) {
                    this.dropGold(enemy.x, enemy.y, enemy.goldValue * 2);
                }

                enemies.splice(i, 1);
            }
        }

        // Update pickups
        for (let pickup of this.pickups) {
            // Move towards player if close
            const dist = distance(pickup.x, pickup.y, this.player.x, this.player.y);
            if (dist < 100) {
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

        // Update UI
        this.updateUI();

        // Check game over
        if (this.player.hp <= 0) {
            this.gameOver();
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0e27';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Debug: Draw a test rectangle to verify rendering
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(50, 50, 100, 100);

        // Draw grid for depth
        this.ctx.strokeStyle = 'rgba(100, 100, 150, 0.1)';
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
        for (let pickup of this.pickups) {
            this.ctx.fillStyle = pickup.type === 'xp' ? '#00ff00' : '#ffd700';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = pickup.type === 'xp' ? '#00ff00' : '#ffd700';
            this.ctx.beginPath();
            this.ctx.arc(pickup.x, pickup.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        // Draw enemies
        this.enemySpawner.draw(this.ctx);

        // Draw player
        this.player.draw(this.ctx);
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
