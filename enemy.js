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
        const configs = {
            basic: {
                maxHp: 30,
                speed: 80,
                damage: 10,
                size: 15,
                color: '#ff3366',
                xpValue: 5,
                goldValue: 1
            },
            fast: {
                maxHp: 15,
                speed: 150,
                damage: 5,
                size: 12,
                color: '#ffaa00',
                xpValue: 3,
                goldValue: 2
            },
            tank: {
                maxHp: 100,
                speed: 40,
                damage: 20,
                size: 25,
                color: '#8844ff',
                xpValue: 15,
                goldValue: 5
            },
            swarm: {
                maxHp: 10,
                speed: 100,
                damage: 5,
                size: 10,
                color: '#00ff88',
                xpValue: 2,
                goldValue: 1
            }
        };

        return configs[this.type] || configs.basic;
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

        // Draw enemy body
        ctx.fillStyle = this.config.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.config.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw HP bar
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barY = this.y - this.size - 10;

        ctx.fillStyle = '#333';
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
        this.spawnInterval = 1.0;
        this.difficultyTimer = 0;
        this.difficulty = 1;
    }

    update(dt, player, canvas) {
        this.spawnTimer += dt;
        this.difficultyTimer += dt;

        // Increase difficulty over time
        if (this.difficultyTimer > 10) {
            this.difficulty += 0.1;
            this.spawnInterval = Math.max(0.3, this.spawnInterval * 0.98);
            this.difficultyTimer = 0;
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

        const margin = 50;
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

        // Choose enemy type based on difficulty
        let type = 'basic';
        const rand = Math.random();

        if (this.difficulty > 2) {
            if (rand < 0.3) type = 'fast';
            else if (rand < 0.5) type = 'swarm';
            else if (rand < 0.6) type = 'tank';
        } else if (this.difficulty > 1.5) {
            if (rand < 0.4) type = 'fast';
            else if (rand < 0.6) type = 'swarm';
        }

        const enemy = new Enemy(x, y, type);
        // Scale with difficulty
        enemy.hp *= (1 + (this.difficulty - 1) * 0.3);
        enemy.maxHp *= (1 + (this.difficulty - 1) * 0.3);

        this.enemies.push(enemy);
    }

    draw(ctx) {
        for (let enemy of this.enemies) {
            enemy.draw(ctx);
        }
    }

    getEnemies() {
        return this.enemies;
    }

    clear() {
        this.enemies = [];
    }
}
