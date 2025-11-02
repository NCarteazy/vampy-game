// Weapon System

class Weapon {
    constructor(type, level = 1) {
        this.type = type;
        this.level = level;
        this.maxLevel = 8;
        this.cooldown = 0;
        this.projectiles = [];
        this.orbitAngle = 0; // For orbital weapons

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
                emoji: '🗡️',
                evolvedEmoji: '⚔️',
                evolvedName: 'Twin Blades',
                description: 'Throws daggers at nearest enemy',
                mechanic: 'multishot' // Shoots multiple projectiles
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
                emoji: '🔥',
                evolvedEmoji: '💥',
                evolvedName: 'Meteor',
                description: 'Shoots fireballs that pierce enemies',
                mechanic: 'explosion' // Explodes on impact
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
                emoji: '⚡',
                evolvedEmoji: '⚡',
                evolvedName: 'Thunder Storm',
                description: 'Fast lightning bolts that chain',
                mechanic: 'chain' // Chains to nearby enemies
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
                emoji: '🪓',
                evolvedEmoji: '🌀',
                evolvedName: 'Orbital Blades',
                description: 'Heavy axes that pierce multiple enemies',
                mechanic: 'boomerang' // Returns to player, evolves to orbit
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
                emoji: '💧',
                evolvedEmoji: '✨',
                evolvedName: 'Divine Light',
                description: 'Rapid holy water shots',
                mechanic: 'puddle' // Leaves damaging puddles
            }
        };

        return configs[this.type] || configs.dagger;
    }

    isEvolved() {
        return this.level >= this.maxLevel;
    }

    getDisplayName() {
        return this.isEvolved() ? this.config.evolvedName : this.config.name;
    }

    getEmoji() {
        return this.isEvolved() ? this.config.evolvedEmoji : this.config.emoji;
    }

    getDamage() {
        let damage = this.config.damage * (1 + (this.level - 1) * 0.4);
        // Evolved weapons get 2x damage
        if (this.isEvolved()) damage *= 2;
        return damage;
    }

    getCooldownTime() {
        let cooldown = this.config.cooldownTime * Math.pow(0.92, this.level - 1);
        // Evolved weapons fire faster
        if (this.isEvolved()) cooldown *= 0.7;
        return cooldown;
    }

    getProjectileCount() {
        // More projectiles at higher levels
        if (this.config.mechanic === 'multishot') {
            return 1 + Math.floor(this.level / 2);
        }
        return 1;
    }

    getPierce() {
        return this.config.pierce + Math.floor(this.level / 3);
    }

    getRange() {
        return this.config.range * (1 + this.level * 0.1);
    }

    update(dt, player, enemies) {
        this.cooldown -= dt;

        // Orbital weapons (evolved axes)
        if (this.isEvolved() && this.config.mechanic === 'boomerang') {
            this.orbitAngle += dt * 2;
            // Keep 3 axes orbiting
            while (this.projectiles.length < 3) {
                const angle = this.orbitAngle + (this.projectiles.length * Math.PI * 2 / 3);
                this.projectiles.push({
                    x: player.x,
                    y: player.y,
                    orbital: true,
                    angle: angle,
                    hits: 0,
                    hitCooldown: 0
                });
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];

            // Orbital projectiles
            if (proj.orbital) {
                const radius = 80;
                proj.angle += dt * 2;
                proj.x = player.x + Math.cos(proj.angle) * radius;
                proj.y = player.y + Math.sin(proj.angle) * radius;
                proj.hitCooldown -= dt;

                // Check collisions
                if (proj.hitCooldown <= 0) {
                    for (let enemy of enemies) {
                        if (enemy.dead) continue;
                        if (circleCollision(proj.x, proj.y, this.config.projectileSize * 2,
                                           enemy.x, enemy.y, enemy.size)) {
                            const isCrit = Math.random() < 0.2;
                            const damage = this.getDamage() * (isCrit ? 2 : 1);
                            enemy.takeDamage(damage);
                            proj.hitCooldown = 0.2; // Hit same enemy max once per 0.2s
                            break;
                        }
                    }
                }
                continue;
            }

            // Boomerang mechanic
            if (this.config.mechanic === 'boomerang' && !this.isEvolved()) {
                proj.lifetime = (proj.lifetime || 0) + dt;
                if (proj.lifetime > 1.0) {
                    // Return to player
                    const dx = player.x - proj.x;
                    const dy = player.y - proj.y;
                    const norm = normalizeVector(dx, dy);
                    proj.vx = norm.x * this.config.speed * 1.5;
                    proj.vy = norm.y * this.config.speed * 1.5;

                    if (distance(proj.x, proj.y, player.x, player.y) < 30) {
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                }
            }

            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;
            proj.traveled += this.config.speed * dt;

            // Remove if out of range
            if (proj.traveled > this.getRange()) {
                // Explosion mechanic
                if (this.config.mechanic === 'explosion') {
                    this.createExplosion(proj.x, proj.y, enemies);
                }
                this.projectiles.splice(i, 1);
                continue;
            }

            // Check collisions with enemies
            for (let enemy of enemies) {
                if (enemy.dead) continue;

                if (circleCollision(proj.x, proj.y, this.config.projectileSize,
                                   enemy.x, enemy.y, enemy.size)) {
                    // Critical hit (20% chance for 2x damage)
                    const isCrit = Math.random() < 0.2;
                    const damage = this.getDamage() * (isCrit ? 2 : 1);
                    enemy.takeDamage(damage);

                    // Chain lightning
                    if (this.config.mechanic === 'chain' && proj.hits === 0) {
                        this.chainToNearbyEnemies(proj.x, proj.y, enemy, enemies, Math.floor(this.level / 2));
                    }

                    // Explosion on hit for evolved fireball
                    if (this.config.mechanic === 'explosion' && this.isEvolved()) {
                        this.createExplosion(proj.x, proj.y, enemies);
                    }

                    proj.hits++;

                    if (proj.hits > this.getPierce()) {
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // Shoot at nearest enemy
        if (this.cooldown <= 0 && enemies.length > 0) {
            // Don't shoot if orbital
            if (this.isEvolved() && this.config.mechanic === 'boomerang') {
                this.cooldown = this.getCooldownTime();
                return;
            }

            const target = this.findNearestEnemy(player, enemies);
            if (target && distance(player.x, player.y, target.x, target.y) < this.getRange()) {
                this.shoot(player, target);
                this.cooldown = this.getCooldownTime();
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
        const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
        const projectileCount = this.getProjectileCount();

        // Multi-shot spread
        const spreadAngle = projectileCount > 1 ? 0.3 : 0;

        for (let i = 0; i < projectileCount; i++) {
            let angle = baseAngle;
            if (projectileCount > 1) {
                angle += (i - (projectileCount - 1) / 2) * spreadAngle;
            }

            const vx = Math.cos(angle) * this.config.speed;
            const vy = Math.sin(angle) * this.config.speed;

            this.projectiles.push({
                x: player.x,
                y: player.y,
                vx: vx,
                vy: vy,
                traveled: 0,
                hits: 0,
                angle: angle
            });
        }
    }

    chainToNearbyEnemies(x, y, hitEnemy, enemies, chainCount) {
        if (chainCount <= 0) return;

        let nearest = null;
        let minDist = Infinity;

        for (let enemy of enemies) {
            if (enemy.dead || enemy === hitEnemy) continue;
            const dist = distance(x, y, enemy.x, enemy.y);
            if (dist < 150 && dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }

        if (nearest) {
            nearest.takeDamage(this.getDamage() * 0.5);
            this.chainToNearbyEnemies(nearest.x, nearest.y, nearest, enemies, chainCount - 1);
        }
    }

    createExplosion(x, y, enemies, game) {
        const explosionRadius = this.isEvolved() ? 100 : 60;
        const explosionDamage = this.getDamage() * 0.5;

        for (let enemy of enemies) {
            if (enemy.dead) continue;
            const dist = distance(x, y, enemy.x, enemy.y);
            if (dist < explosionRadius) {
                enemy.takeDamage(explosionDamage);
            }
        }

        // Add visual explosion if game reference available
        if (window.currentGame) {
            window.currentGame.explosions.push({
                x: x,
                y: y,
                radius: 0,
                life: 0.5,
                maxLife: 0.5,
                color: this.config.color
            });
        }
    }

    draw(ctx) {
        ctx.shadowBlur = this.isEvolved() ? 15 : 8;
        ctx.shadowColor = this.config.color;
        const size = this.config.projectileSize * 2 * (this.isEvolved() ? 1.3 : 1);
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let proj of this.projectiles) {
            ctx.save();

            // Rotate axes and orbital weapons
            if (this.type === 'axe' || proj.orbital) {
                ctx.translate(proj.x, proj.y);
                const rotation = proj.orbital ? proj.angle : proj.traveled * 0.1;
                ctx.rotate(rotation);
                ctx.fillText(this.getEmoji(), 0, 0);
            } else {
                ctx.fillText(this.getEmoji(), proj.x, proj.y);
            }

            ctx.restore();
        }

        ctx.shadowBlur = 0;
    }

    upgrade() {
        if (this.level < this.maxLevel) {
            this.level++;
        }
    }

    canUpgrade() {
        return this.level < this.maxLevel;
    }
}
