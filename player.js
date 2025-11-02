// Player Character

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.speed = 200;

        // Stats
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 10;

        // Weapons
        this.weapons = [new Weapon('dagger')];

        // Power-up states
        this.speedMultiplier = 1;
        this.invincible = false;

        // Bonuses from village
        this.damageBonus = 1;
        this.hpBonus = 1;
        this.xpBonus = 1;
        this.attackSpeedBonus = 1;

        // Movement
        this.vx = 0;
        this.vy = 0;

        // Stats
        this.kills = 0;
        this.goldCollected = 0;
    }

    applyVillageBonuses(village) {
        const armoryLevel = village.buildings.armory.level;
        const templeLevel = village.buildings.temple.level;
        const academyLevel = village.buildings.academy.level;
        const workshopLevel = village.buildings.workshop.level;

        this.damageBonus = 1 + armoryLevel * 0.1;
        this.hpBonus = 1 + templeLevel * 0.1;
        this.xpBonus = 1 + academyLevel * 0.15;
        this.attackSpeedBonus = 1 + workshopLevel * 0.1;

        // Apply HP bonus
        const newMaxHp = 100 * this.hpBonus;
        const hpRatio = this.hp / this.maxHp;
        this.maxHp = newMaxHp;
        this.hp = newMaxHp * hpRatio;
    }

    update(dt, keys, canvas) {
        // Movement
        let dx = 0;
        let dy = 0;

        if (keys['ArrowUp'] || keys['w'] || keys['W']) dy -= 1;
        if (keys['ArrowDown'] || keys['s'] || keys['S']) dy += 1;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= 1;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;

        // Normalize diagonal movement
        if (dx !== 0 || dy !== 0) {
            const normalized = normalizeVector(dx, dy);
            this.vx = normalized.x * this.speed * this.speedMultiplier;
            this.vy = normalized.y * this.speed * this.speedMultiplier;
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Keep in bounds
        this.x = clamp(this.x, this.size, canvas.width - this.size);
        this.y = clamp(this.y, this.size, canvas.height - this.size);
    }

    updateWeapons(dt, enemies) {
        for (let weapon of this.weapons) {
            weapon.update(dt, this, enemies);
        }
    }

    takeDamage(amount) {
        if (this.invincible) return;
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }

    gainXP(amount) {
        this.xp += amount * this.xpBonus;

        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
            return true;
        }
        return false;
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);

        // Heal on level up
        this.heal(this.maxHp * 0.2);
    }

    addWeapon(type) {
        // Check if already has weapon
        const existing = this.weapons.find(w => w.type === type);
        if (existing) {
            existing.upgrade();
        } else {
            this.weapons.push(new Weapon(type));
        }
    }

    gainStat(stat, amount) {
        switch (stat) {
            case 'maxHp':
                this.maxHp += amount;
                this.hp += amount;
                break;
            case 'speed':
                this.speed += amount;
                break;
            case 'damage':
                this.damageBonus += amount;
                break;
        }
    }

    draw(ctx) {
        // Draw player as vampire emoji
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.invincible ? '#ffff00' : '#ff3366';
        ctx.font = `${this.size * 2.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Flash when invincible
        if (!this.invincible || Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillText('🧛', this.x, this.y);
        }
        ctx.shadowBlur = 0;

        // Draw weapons
        for (let weapon of this.weapons) {
            weapon.draw(ctx);
        }
    }
}
