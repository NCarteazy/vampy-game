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

    applyEquipmentBonuses(equipment) {
        if (!equipment) return;

        const stats = equipment.getTotalStats();

        // Apply percentage damage bonus
        if (stats.damagePercent) {
            this.damageBonus *= (1 + stats.damagePercent / 100);
        }

        // Apply flat max HP
        if (stats.maxHpFlat) {
            this.maxHp += stats.maxHpFlat;
            this.hp += stats.maxHpFlat; // Also increase current HP
        }

        // Apply percentage max HP
        if (stats.maxHpPercent) {
            const bonus = 1 + stats.maxHpPercent / 100;
            this.maxHp *= bonus;
            this.hp *= bonus;
        }

        // Apply attack speed bonus
        if (stats.attackSpeedPercent) {
            this.attackSpeedBonus *= (1 + stats.attackSpeedPercent / 100);
        }

        // Apply movement speed
        if (stats.moveSpeedFlat) {
            this.speed += stats.moveSpeedFlat;
        }

        // Apply XP bonus
        if (stats.xpGainPercent) {
            this.xpBonus *= (1 + stats.xpGainPercent / 100);
        }

        // Store other stats for use during gameplay
        this.critChance = (stats.critChance || 0);
        this.critMultiplier = 1 + (stats.critMultiplier || 0) / 100;
        this.hpRegenPerSec = (stats.hpRegenPerSec || 0);
        this.lifestealPercent = (stats.lifestealPercent || 0);
        this.cooldownReduction = (stats.cooldownReductionPercent || 0) / 100;
        this.bonusRange = (stats.rangeFlat || 0);
        this.bonusPierce = (stats.pierceFlat || 0);
        this.dropChanceBonus = 1 + (stats.dropChancePercent || 0) / 100;
        this.goldGainBonus = 1 + (stats.goldGainPercent || 0) / 100;
    }

    update(dt, keys, canvas) {
        // HP Regeneration from equipment
        if (this.hpRegenPerSec && this.hpRegenPerSec > 0) {
            this.heal(this.hpRegenPerSec * dt);
        }

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
            this.vx = normalized.x * this.speed;
            this.vy = normalized.y * this.speed;
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
        // Draw player
        ctx.fillStyle = '#00aaff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00aaff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw direction indicator
        if (this.vx !== 0 || this.vy !== 0) {
            const angle = Math.atan2(this.vy, this.vx);
            const tipX = this.x + Math.cos(angle) * this.size;
            const tipY = this.y + Math.sin(angle) * this.size;

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
        }

        // Draw weapons
        for (let weapon of this.weapons) {
            weapon.draw(ctx);
        }
    }
}
