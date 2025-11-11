// Weapon System

class Weapon {
    constructor(type, level = 1) {
        this.type = type;
        this.level = level;
        this.cooldown = 0;
        this.projectiles = [];

        this.config = this.getConfig();
    }

    getConfig() {
        const configs = {
            dagger: {
                name: 'Dagger',
                damage: 10,
                speed: 400,
                cooldownTime: 0.5,
                range: 300,
                pierce: 0,
                projectileSize: 8,
                color: '#cccccc',
                description: 'Throws daggers at nearest enemy'
            },
            fireball: {
                name: 'Fireball',
                damage: 25,
                speed: 250,
                cooldownTime: 1.5,
                range: 400,
                pierce: 1,
                projectileSize: 12,
                color: '#ff6600',
                description: 'Shoots fireballs that pierce enemies'
            },
            lightning: {
                name: 'Lightning',
                damage: 15,
                speed: 600,
                cooldownTime: 0.8,
                range: 350,
                pierce: 2,
                projectileSize: 10,
                color: '#00ffff',
                description: 'Fast lightning bolts that chain'
            },
            axe: {
                name: 'Spinning Axe',
                damage: 30,
                speed: 200,
                cooldownTime: 2.0,
                range: 500,
                pierce: 5,
                projectileSize: 15,
                color: '#888888',
                description: 'Heavy axes that pierce multiple enemies'
            },
            holy: {
                name: 'Holy Water',
                damage: 8,
                speed: 300,
                cooldownTime: 0.3,
                range: 250,
                pierce: 0,
                projectileSize: 10,
                color: '#66ff66',
                description: 'Rapid holy water shots'
            }
        };

        return configs[this.type] || configs.dagger;
    }

    getDamage(player) {
        // Base damage scaled by level
        let damage = this.config.damage * (1 + (this.level - 1) * 0.3);

        // Apply equipment damage bonus
        if (player && player.damageBonus) {
            damage *= player.damageBonus;
        }

        return damage;
    }

    getCooldownTime(player) {
        let cooldown = this.config.cooldownTime * Math.pow(0.95, this.level - 1);

        // Apply attack speed bonus (reduces cooldown)
        if (player && player.attackSpeedBonus) {
            cooldown /= player.attackSpeedBonus;
        }

        // Apply cooldown reduction
        if (player && player.cooldownReduction) {
            cooldown *= (1 - player.cooldownReduction);
        }

        return cooldown;
    }

    rollCritical(player) {
        if (!player || !player.critChance) return false;
        return Math.random() * 100 < player.critChance;
    }

    getCritMultiplier(player) {
        return (player && player.critMultiplier) ? player.critMultiplier : 1;
    }

    applyLifesteal(player, damageDealt) {
        if (!player || !player.lifestealPercent || player.lifestealPercent <= 0) return;

        const healAmount = damageDealt * (player.lifestealPercent / 100);
        if (player.heal) {
            player.heal(healAmount);
        }
    }

    update(dt, player, enemies) {
        this.cooldown -= dt;

        // Calculate bonuses
        const bonusRange = (player && player.bonusRange) ? player.bonusRange : 0;
        const bonusPierce = (player && player.bonusPierce) ? player.bonusPierce : 0;
        const effectiveRange = this.config.range + bonusRange;
        const effectivePierce = this.config.pierce + bonusPierce;

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;
            proj.traveled += this.config.speed * dt;

            // Remove if out of range (with bonus range)
            if (proj.traveled > effectiveRange) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Check collisions with enemies
            for (let enemy of enemies) {
                if (enemy.dead) continue;

                if (circleCollision(proj.x, proj.y, this.config.projectileSize,
                                   enemy.x, enemy.y, enemy.size)) {
                    // Calculate damage with equipment scaling
                    let damage = this.getDamage(player);

                    // Roll for critical strike
                    const isCrit = this.rollCritical(player);
                    if (isCrit) {
                        damage *= this.getCritMultiplier(player);
                        proj.isCrit = true; // Mark for visual effect
                    }

                    // Deal damage
                    enemy.takeDamage(damage);

                    // Apply lifesteal
                    this.applyLifesteal(player, damage);

                    proj.hits++;

                    // Check pierce (with bonus pierce)
                    if (proj.hits > effectivePierce) {
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // Shoot at nearest enemy
        if (this.cooldown <= 0 && enemies.length > 0) {
            const target = this.findNearestEnemy(player, enemies);
            if (target && distance(player.x, player.y, target.x, target.y) < effectiveRange) {
                this.shoot(player, target);
                this.cooldown = this.getCooldownTime(player);
            }
        }
    }

    findNearestEnemy(player, enemies) {
        let nearest = null;
        let minDist = Infinity;

        for (let enemy of enemies) {
            if (enemy.dead) continue;
            const dist = distance(player.x, player.y, enemy.x, enemy.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }

        return nearest;
    }

    shoot(player, target) {
        const angle = Math.atan2(target.y - player.y, target.x - player.x);
        const vx = Math.cos(angle) * this.config.speed;
        const vy = Math.sin(angle) * this.config.speed;

        this.projectiles.push({
            x: player.x,
            y: player.y,
            vx: vx,
            vy: vy,
            traveled: 0,
            hits: 0
        });
    }

    draw(ctx) {
        for (let proj of this.projectiles) {
            // Critical strikes have enhanced visuals
            if (proj.isCrit) {
                ctx.fillStyle = '#ffff00'; // Yellow for crits
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ffff00';

                // Draw outer ring for crits
                ctx.strokeStyle = '#ff9900';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, this.config.projectileSize + 3, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.fillStyle = this.config.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.config.color;
            }

            ctx.beginPath();
            ctx.arc(proj.x, proj.y, this.config.projectileSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
    }

    upgrade() {
        this.level++;
    }
}
