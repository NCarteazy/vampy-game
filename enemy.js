// Enemy System

class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.dead = false;

        this.config = this.getConfig();
        this.hp = this.config.maxHp;
        this.maxHp = this.config.maxHp;
        this.size = this.config.size;
        this.speed = this.config.speed;
        this.damage = this.config.damage;
        this.xpValue = this.config.xpValue;
        this.goldValue = this.config.goldValue;
    }

    getConfig() {
        // Use centralized enemy configs
        const config = EnemyConfigs[this.type];
        if (!config) {
            console.error(`Unknown enemy type: ${this.type}`);
            return EnemyConfigs.basic; // Fallback to basic
        }
        return config;
    }

    update(dt, player) {
        if (this.dead) return;

        // Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        // Check collision with player
        if (circleCollision(this.x, this.y, this.size, player.x, player.y, player.size)) {
            player.takeDamage(this.damage * dt);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.dead = true;
        }
    }

    draw(ctx) {
        if (this.dead) return;

        // Draw enemy as emoji
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.config.color;
        ctx.font = `${this.size * 2.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.emoji, this.x, this.y);
        ctx.shadowBlur = 0;

        // Draw HP bar
        const barWidth = this.size * 2.5;
        const barHeight = 4;
        const barY = this.y - this.size - 8;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);

        ctx.fillStyle = '#ff3366';
        const hpPercent = this.hp / this.maxHp;
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth * hpPercent, barHeight);
    }
}

/**
 * EnemySpawner - Manages enemy spawning and difficulty scaling
 *
 * Difficulty System:
 * - Starts at difficulty 1.0
 * - Increases by 0.1 every 10 seconds
 * - Spawn rate increases (interval decreases) with difficulty
 * - Enemy HP scales up with difficulty
 * - Enemy type distribution changes based on difficulty tier
 *
 * Boss System:
 * - Bosses spawn every 30 seconds
 * - Have significantly more HP that scales with difficulty
 * - Drop power-ups when defeated
 */
class EnemySpawner {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = GameConfig.spawning.baseSpawnInterval;
        this.difficultyTimer = 0;
        this.difficulty = 1;
        this.waveNumber = 1;
        this.bossTimer = 0;
        this.bossInterval = GameConfig.spawning.bossInterval;
    }

    update(dt, player, canvas) {
        this.spawnTimer += dt;
        this.difficultyTimer += dt;
        this.bossTimer += dt;

        // ========== DIFFICULTY SCALING ==========
        // Every 10 seconds, increase difficulty and spawn rate
        // This creates progressive challenge without overwhelming early game
        if (this.difficultyTimer > GameConfig.spawning.difficultyIncreaseInterval) {
            this.difficulty += GameConfig.spawning.difficultyIncrement;

            // Spawn interval decreases (enemies spawn faster)
            // Capped at minSpawnInterval to prevent impossible spawn rates
            this.spawnInterval = Math.max(
                GameConfig.spawning.minSpawnInterval,
                this.spawnInterval * GameConfig.spawning.spawnIntervalDecay
            );

            this.difficultyTimer = 0;
            this.waveNumber++;
        }

        // ========== BOSS SPAWNING ==========
        // Bosses spawn on a fixed timer (30s)
        // Independent of regular enemy spawning
        if (this.bossTimer > this.bossInterval) {
            this.bossTimer = 0;
            this.spawnBoss(player, canvas);
        }

        // ========== REGULAR ENEMY SPAWNING ==========
        // Spawn rate increases with difficulty
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy(player, canvas);
        }

        // Update all enemies
        for (let enemy of this.enemies) {
            enemy.update(dt, player);
        }

        // Clean up dead enemies
        // Note: Dead enemies are kept temporarily for particle effects,
        // then removed by game.js after processing drops
        this.enemies = this.enemies.filter(e => !e.dead);
    }

    /**
     * Spawns a regular enemy off-screen
     *
     * Spawn Algorithm:
     * 1. Pick random screen edge (top, right, bottom, left)
     * 2. Spawn 50px outside visible area
     * 3. Select enemy type based on difficulty tier
     * 4. Scale enemy HP based on current difficulty
     *
     * This ensures enemies enter from off-screen and difficulty scales smoothly
     */
    spawnEnemy(player, canvas) {
        // ========== SPAWN POSITION ==========
        // Randomly choose which edge of screen to spawn from
        const side = randomInt(0, 3);
        let x, y;

        const margin = GameConfig.spawning.spawnMargin; // 50px outside visible area

        switch (side) {
            case 0: // Top edge
                x = randomRange(-margin, canvas.width + margin);
                y = -margin;
                break;
            case 1: // Right edge
                x = canvas.width + margin;
                y = randomRange(-margin, canvas.height + margin);
                break;
            case 2: // Bottom edge
                x = randomRange(-margin, canvas.width + margin);
                y = canvas.height + margin;
                break;
            case 3: // Left edge
                x = -margin;
                y = randomRange(-margin, canvas.height + margin);
                break;
        }

        // ========== ENEMY TYPE SELECTION ==========
        // Uses difficulty-based spawn weights from enemyConfigs.js
        // Early game: Mostly basic enemies
        // Mid game: Mix of fast, swarm, basic
        // Late game: All types including tanks
        const type = selectEnemyType(this.difficulty);

        // ========== STAT SCALING ==========
        // Create enemy and scale stats based on difficulty
        // HP: 50% increase per difficulty level above 1.0
        // Damage: 30% increase per difficulty level above 1.0
        const enemy = new Enemy(x, y, type);
        const hpScaling = 1 + (this.difficulty - 1) * GameConfig.spawning.enemyHpScaling;
        const damageScaling = 1 + (this.difficulty - 1) * 0.3; // HARDER: Damage scales with difficulty

        enemy.hp *= hpScaling;
        enemy.maxHp *= hpScaling;
        enemy.damage *= damageScaling;

        this.enemies.push(enemy);
    }

    draw(ctx) {
        for (let enemy of this.enemies) {
            enemy.draw(ctx);
        }
    }

    spawnBoss(player, canvas) {
        // Spawn at random edge
        const side = randomInt(0, 3);
        let x, y;
        const margin = GameConfig.spawning.bossSpawnMargin;

        switch (side) {
            case 0: x = randomRange(-margin, canvas.width + margin); y = -margin; break;
            case 1: x = canvas.width + margin; y = randomRange(-margin, canvas.height + margin); break;
            case 2: x = randomRange(-margin, canvas.width + margin); y = canvas.height + margin; break;
            case 3: x = -margin; y = randomRange(-margin, canvas.height + margin); break;
        }

        const boss = new Enemy(x, y, 'boss');
        const hpScaling = 1 + (this.difficulty - 1) * GameConfig.spawning.bossHpScaling;
        const damageScaling = 1 + (this.difficulty - 1) * 0.4; // HARDER: Boss damage scales 40% per difficulty

        boss.hp *= hpScaling;
        boss.maxHp *= hpScaling;
        boss.damage *= damageScaling;
        this.enemies.push(boss);
    }

    getEnemies() {
        return this.enemies;
    }

    getWaveNumber() {
        return this.waveNumber;
    }

    clear() {
        this.enemies = [];
    }
}
