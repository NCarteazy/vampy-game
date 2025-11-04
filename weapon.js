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
        // Use centralized weapon configs
        const config = WeaponConfigs[this.type];
        if (!config) {
            console.error(`Unknown weapon type: ${this.type}`);
            return WeaponConfigs.dagger; // Fallback to dagger
        }
        return config;
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

        // Orbital weapons (evolved axes + orbital_continuous)
        if ((this.isEvolved() && this.config.mechanic === 'boomerang') || this.config.mechanic === 'orbital_continuous') {
            this.orbitAngle += dt * 2;
            const orbitalCount = this.config.mechanic === 'orbital_continuous' ? (2 + this.level) : 3;
            // Keep orbital projectiles
            while (this.projectiles.length < orbitalCount) {
                const angle = this.orbitAngle + (this.projectiles.length * Math.PI * 2 / orbitalCount);
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

        // Aura continuous mechanic (garlic)
        if (this.config.mechanic === 'aura_continuous') {
            const auraRange = this.getRange();
            for (let enemy of enemies) {
                if (enemy.dead) continue;
                const dist = distance(player.x, player.y, enemy.x, enemy.y);
                if (dist < auraRange) {
                    enemy.takeDamage(this.getDamage() * dt * 0.5);
                }
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];

            // Puddles (poison clouds, holy water)
            if (proj.puddle) {
                proj.lifetime = (proj.lifetime || 0) + dt;
                if (proj.lifetime > 3) {
                    this.projectiles.splice(i, 1);
                    continue;
                }
                // Damage enemies in puddle
                proj.hitCooldown = (proj.hitCooldown || 0) - dt;
                if (proj.hitCooldown <= 0) {
                    for (let enemy of enemies) {
                        if (enemy.dead) continue;
                        if (circleCollision(proj.x, proj.y, proj.radius || 40, enemy.x, enemy.y, enemy.size)) {
                            enemy.takeDamage(this.getDamage() * 0.3);
                        }
                    }
                    proj.hitCooldown = 0.5;
                }
                continue;
            }

            // Orbital projectiles
            if (proj.orbital) {
                const radius = this.config.mechanic === 'orbital_continuous' ? (60 + this.level * 5) : 80;
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
                            const isCrit = Math.random() < GameConfig.combat.critChance;
                            const damage = this.getDamage() * (isCrit ? GameConfig.combat.critMultiplier : 1);
                            enemy.takeDamage(damage);
                            proj.hitCooldown = GameConfig.combat.orbitalHitCooldown;
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

            // Bouncing projectiles (music notes)
            if (this.config.mechanic === 'bouncing' && proj.bounces > 0) {
                proj.bounceTimer = (proj.bounceTimer || 0) + dt;
                if (proj.bounceTimer > 0.3) {
                    // Find nearest enemy to bounce to
                    let nearest = null;
                    let minDist = Infinity;
                    for (let enemy of enemies) {
                        if (enemy.dead || enemy === proj.lastHit) continue;
                        const dist = distance(proj.x, proj.y, enemy.x, enemy.y);
                        if (dist < 200 && dist < minDist) {
                            minDist = dist;
                            nearest = enemy;
                        }
                    }
                    if (nearest) {
                        const angle = Math.atan2(nearest.y - proj.y, nearest.x - proj.x);
                        proj.vx = Math.cos(angle) * this.config.speed;
                        proj.vy = Math.sin(angle) * this.config.speed;
                        proj.bounceTimer = 0;
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
                // Puddle mechanic - leave a puddle when projectile expires
                if (this.config.mechanic === 'puddle') {
                    this.projectiles.push({
                        x: proj.x,
                        y: proj.y,
                        puddle: true,
                        radius: 40 + this.level * 5,
                        lifetime: 0
                    });
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

                    // Freeze mechanic
                    if (this.config.mechanic === 'freeze') {
                        enemy.frozenTimer = 2 + this.level * 0.5;
                        enemy.originalSpeed = enemy.speed;
                        enemy.speed *= 0.3; // Slow to 30% speed
                    }

                    // Chain lightning
                    if (this.config.mechanic === 'chain' && proj.hits === 0) {
                        this.chainToNearbyEnemies(proj.x, proj.y, enemy, enemies, Math.floor(this.level / 2));
                    }

                    // Explosion on hit for evolved fireball
                    if (this.config.mechanic === 'explosion' && this.isEvolved()) {
                        this.createExplosion(proj.x, proj.y, enemies);
                    }

                    // Bouncing mechanic
                    if (this.config.mechanic === 'bouncing') {
                        proj.bounces = (proj.bounces || 3 + Math.floor(this.level / 2)) - 1;
                        proj.lastHit = enemy;
                        proj.bounceTimer = 0;
                        if (proj.bounces <= 0) {
                            this.projectiles.splice(i, 1);
                            break;
                        }
                        continue;
                    }

                    proj.hits++;

                    if (proj.hits > this.getPierce()) {
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // Update frozen enemies
        for (let enemy of enemies) {
            if (enemy.frozenTimer) {
                enemy.frozenTimer -= dt;
                if (enemy.frozenTimer <= 0) {
                    enemy.speed = enemy.originalSpeed || enemy.config.speed;
                    delete enemy.frozenTimer;
                    delete enemy.originalSpeed;
                }
            }
        }

        // Weapon-specific mechanics that trigger on cooldown
        if (this.cooldown <= 0) {
            // Screen nuke (pentagram)
            if (this.config.mechanic === 'screen_nuke') {
                const nukeRange = this.getRange();
                for (let enemy of enemies) {
                    if (enemy.dead) continue;
                    enemy.takeDamage(this.getDamage());
                }
                // Visual effect
                if (window.currentGame) {
                    window.currentGame.explosions.push({
                        x: player.x,
                        y: player.y,
                        radius: 0,
                        life: 1.0,
                        maxLife: 1.0,
                        color: this.config.color,
                        screenWide: true
                    });
                }
                this.cooldown = this.getCooldownTime();
                return;
            }

            // Aura explosion (cross)
            if (this.config.mechanic === 'aura') {
                const auraRange = this.getRange();
                for (let enemy of enemies) {
                    if (enemy.dead) continue;
                    const dist = distance(player.x, player.y, enemy.x, enemy.y);
                    if (dist < auraRange) {
                        enemy.takeDamage(this.getDamage());
                    }
                }
                // Visual effect
                if (window.currentGame) {
                    window.currentGame.explosions.push({
                        x: player.x,
                        y: player.y,
                        radius: 0,
                        life: 0.5,
                        maxLife: 0.5,
                        color: this.config.color,
                        maxRadius: auraRange
                    });
                }
                this.cooldown = this.getCooldownTime();
                return;
            }

            // Arc attack (whip)
            if (this.config.mechanic === 'arc') {
                const target = this.findNearestEnemy(player, enemies);
                if (target) {
                    const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
                    const arcWidth = 0.8; // ~90 degrees
                    for (let enemy of enemies) {
                        if (enemy.dead) continue;
                        const dist = distance(player.x, player.y, enemy.x, enemy.y);
                        if (dist > this.getRange()) continue;

                        const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                        let angleDiff = Math.abs(angle - baseAngle);
                        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                        if (angleDiff < arcWidth) {
                            enemy.takeDamage(this.getDamage());
                        }
                    }
                }
                this.cooldown = this.getCooldownTime();
                return;
            }

            // Beam (laser) - instant hit
            if (this.config.mechanic === 'beam') {
                const target = this.findNearestEnemy(player, enemies);
                if (target) {
                    const angle = Math.atan2(target.y - player.y, target.x - player.x);
                    // Hit all enemies in a line
                    for (let enemy of enemies) {
                        if (enemy.dead) continue;
                        const dist = distance(player.x, player.y, enemy.x, enemy.y);
                        if (dist > this.getRange()) continue;

                        const enemyAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                        let angleDiff = Math.abs(enemyAngle - angle);
                        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                        if (angleDiff < 0.1) { // Very narrow beam
                            enemy.takeDamage(this.getDamage());
                        }
                    }
                    // Create visual beam projectile
                    this.projectiles.push({
                        x: player.x,
                        y: player.y,
                        vx: Math.cos(angle) * this.config.speed,
                        vy: Math.sin(angle) * this.config.speed,
                        traveled: 0,
                        hits: 999,
                        beam: true,
                        lifetime: 0.1
                    });
                }
                this.cooldown = this.getCooldownTime();
                return;
            }

            // Normal shooting mechanics
            if (enemies.length > 0) {
                // Don't shoot if orbital
                if ((this.isEvolved() && this.config.mechanic === 'boomerang') ||
                    this.config.mechanic === 'orbital_continuous' ||
                    this.config.mechanic === 'aura_continuous') {
                    this.cooldown = this.getCooldownTime();
                    return;
                }

                // Random spread (bones)
                if (this.config.mechanic === 'random_spread') {
                    const count = 3 + Math.floor(this.level / 2);
                    for (let i = 0; i < count; i++) {
                        const angle = Math.random() * Math.PI * 2;
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

            // Puddles
            if (proj.puddle) {
                ctx.globalAlpha = 0.3 + Math.sin(proj.lifetime * 3) * 0.1;
                ctx.fillStyle = this.config.color;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
                ctx.restore();
                continue;
            }

            // Beams (laser visual)
            if (proj.beam) {
                ctx.globalAlpha = 0.8;
                ctx.strokeStyle = this.config.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(proj.x - proj.vx * 0.1, proj.y - proj.vy * 0.1);
                ctx.lineTo(proj.x, proj.y);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
                ctx.restore();
                continue;
            }

            // Aura continuous (garlic) - visual circle around player
            if (this.config.mechanic === 'aura_continuous' && proj.orbital === undefined) {
                // Skip rendering for aura_continuous as it's handled elsewhere
                continue;
            }

            // Rotate axes and orbital weapons
            if (this.type === 'axe' || this.type === 'knife' || this.type === 'bible' || proj.orbital) {
                ctx.translate(proj.x, proj.y);
                const rotation = proj.orbital ? proj.angle : proj.traveled * 0.1;
                ctx.rotate(rotation);
                ctx.fillText(this.getEmoji(), 0, 0);
            } else {
                ctx.fillText(this.getEmoji(), proj.x, proj.y);
            }

            ctx.restore();
        }

        // Draw aura continuous visual effect
        if (this.config.mechanic === 'aura_continuous') {
            ctx.save();
            ctx.globalAlpha = 0.15 + Math.sin(Date.now() * 0.005) * 0.05;
            ctx.strokeStyle = this.config.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.getRange(), 0, Math.PI * 2); // Will be centered on player
            ctx.stroke();
            ctx.globalAlpha = 1.0;
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
