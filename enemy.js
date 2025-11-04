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

        // Increase difficulty over time
        if (this.difficultyTimer > GameConfig.spawning.difficultyIncreaseInterval) {
            this.difficulty += GameConfig.spawning.difficultyIncrement;
            this.spawnInterval = Math.max(
                GameConfig.spawning.minSpawnInterval,
                this.spawnInterval * GameConfig.spawning.spawnIntervalDecay
            );
            this.difficultyTimer = 0;
            this.waveNumber++;
        }

        // Spawn boss
        if (this.bossTimer > this.bossInterval) {
            this.bossTimer = 0;
            this.spawnBoss(player, canvas);
        }

        // Spawn enemies
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy(player, canvas);
        }

        // Update enemies
        for (let enemy of this.enemies) {
            enemy.update(dt, player);
        }

        // Remove dead enemies
        this.enemies = this.enemies.filter(e => !e.dead);
    }

    spawnEnemy(player, canvas) {
        // Spawn outside screen
        const side = randomInt(0, 3);
        let x, y;

        const margin = GameConfig.spawning.spawnMargin;
        switch (side) {
            case 0: // Top
                x = randomRange(-margin, canvas.width + margin);
                y = -margin;
                break;
            case 1: // Right
                x = canvas.width + margin;
                y = randomRange(-margin, canvas.height + margin);
                break;
            case 2: // Bottom
                x = randomRange(-margin, canvas.width + margin);
                y = canvas.height + margin;
                break;
            case 3: // Left
                x = -margin;
                y = randomRange(-margin, canvas.height + margin);
                break;
        }

        // Choose enemy type based on difficulty using helper function
        const type = selectEnemyType(this.difficulty);

        const enemy = new Enemy(x, y, type);
        // Scale with difficulty
        const scaling = 1 + (this.difficulty - 1) * GameConfig.spawning.enemyHpScaling;
        enemy.hp *= scaling;
        enemy.maxHp *= scaling;

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
        const scaling = 1 + (this.difficulty - 1) * GameConfig.spawning.bossHpScaling;
        boss.hp *= scaling;
        boss.maxHp *= scaling;
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
