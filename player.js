// Player Character

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = GameConfig.player.baseSize;
        this.speed = GameConfig.player.baseSpeed;

        // Stats
        this.maxHp = GameConfig.player.baseMaxHp;
        this.hp = this.maxHp;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = GameConfig.player.initialXpToNextLevel;

        // Weapons
        this.weapons = [new Weapon(GameConfig.player.startingWeapon)];

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

    /**
     * Apply permanent bonuses from village buildings
     *
     * Village System:
     * - Armory: +10% damage per level
     * - Temple: +10% max HP per level
     * - Academy: +15% XP gain per level
     * - Workshop: +10% attack speed per level
     *
     * HP Preservation:
     * When HP bonus changes, maintains same HP percentage
     * Example: If at 50% HP with 100 max, stays at 50% with new max
     */
    applyVillageBonuses(village) {
        const armoryLevel = village.buildings.armory.level;
        const templeLevel = village.buildings.temple.level;
        const academyLevel = village.buildings.academy.level;
        const workshopLevel = village.buildings.workshop.level;

        // Calculate multipliers (1.0 + level * bonus_per_level)
        this.damageBonus = 1 + armoryLevel * GameConfig.village.armoryDamagePerLevel;
        this.hpBonus = 1 + templeLevel * GameConfig.village.templeHpPerLevel;
        this.xpBonus = 1 + academyLevel * GameConfig.village.academyXpPerLevel;
        this.attackSpeedBonus = 1 + workshopLevel * GameConfig.village.workshopAttackSpeedPerLevel;

        // ========== HP BONUS APPLICATION ==========
        // Preserve HP percentage when max HP changes
        // This prevents healing/damage when entering a run with different temple levels
        const newMaxHp = GameConfig.player.baseMaxHp * this.hpBonus;
        const hpRatio = this.hp / this.maxHp; // Current HP percentage
        this.maxHp = newMaxHp;
        this.hp = newMaxHp * hpRatio; // Maintain same percentage
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
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * GameConfig.player.xpLevelScaling);

        // Heal on level up
        this.heal(this.maxHp * GameConfig.player.levelUpHealPercent);
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
        ctx.shadowBlur = GameConfig.visual.playerShadowBlur;
        ctx.shadowColor = this.invincible ?
            GameConfig.visual.playerInvincibleColor :
            GameConfig.visual.playerNormalColor;
        ctx.font = `${this.size * GameConfig.player.emojiSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Flash when invincible
        if (!this.invincible || Math.floor(Date.now() / GameConfig.visual.invincibleFlashInterval) % 2 === 0) {
            ctx.fillText(GameConfig.player.emoji, this.x, this.y);
        }
        ctx.shadowBlur = 0;

        // Draw weapons
        for (let weapon of this.weapons) {
            weapon.draw(ctx);
        }
    }
}
