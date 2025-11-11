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

    getDamage(player) {
        let damage = this.config.damage * (1 + (this.level - 1) * 0.4);
        // Evolved weapons get 2x damage
        if (this.isEvolved()) damage *= 2;

        // Apply equipment damage bonus
        if (player && player.damageBonus) {
            damage *= player.damageBonus;
        }

        return damage;
    }

    getCooldownTime(player) {
        let cooldown = this.config.cooldownTime * Math.pow(0.92, this.level - 1);
        // Evolved weapons fire faster
        if (this.isEvolved()) cooldown *= 0.7;

        // Apply equipment attack speed bonus (reduces cooldown)
        if (player && player.attackSpeedBonus) {
            cooldown /= player.attackSpeedBonus;
        }

        // Apply cooldown reduction
        if (player && player.cooldownReduction) {
            cooldown *= (1 - player.cooldownReduction);
        }

        return cooldown;
    }

    getProjectileCount() {
        // More projectiles at higher levels
        if (this.config.mechanic === 'multishot') {
            return 1 + Math.floor(this.level / 2);
        }
        return 1;
    }

    getPierce(player) {
        let pierce = this.config.pierce + Math.floor(this.level / 3);

        // Apply equipment pierce bonus
        if (player && player.bonusPierce) {
            pierce += player.bonusPierce;
        }

        return pierce;
    }

    getRange(player) {
        let range = this.config.range * (1 + this.level * 0.1);

        // Apply equipment range bonus
        if (player && player.bonusRange) {
            range += player.bonusRange;
        }

        return range;
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

        // ========== ORBITAL WEAPONS ==========
        // Mechanic: Projectiles continuously orbit around the player
        // Used by: Evolved Axe (Orbital Blades), Bible, Knife Ring
        // Implementation: Maintains a fixed number of projectiles evenly spaced in a circle
        // The projectiles rotate around the player and damage enemies on contact
        if ((this.isEvolved() && this.config.mechanic === 'boomerang') || this.config.mechanic === 'orbital_continuous') {
            this.orbitAngle += dt * 2; // Rotation speed (radians per second)

            // Scale orbital count with level for orbital_continuous weapons
            const orbitalCount = this.config.mechanic === 'orbital_continuous' ? (2 + this.level) : 3;

            // Maintain the correct number of orbital projectiles
            // We add projectiles until we reach the target count
            while (this.projectiles.length < orbitalCount) {
                // Distribute projectiles evenly around the circle (2π / count)
                const angle = this.orbitAngle + (this.projectiles.length * Math.PI * 2 / orbitalCount);
                this.projectiles.push({
                    x: player.x,
                    y: player.y,
                    orbital: true,
                    angle: angle,
                    hits: 0,
                    hitCooldown: 0 // Prevents hitting same enemy too frequently
                });
            }
        }

        // ========== AURA CONTINUOUS MECHANIC ==========
        // Mechanic: Constantly damages all enemies within range every frame
        // Used by: Garlic (Soul Eater when evolved)
        // Implementation: Simple distance check, damage scaled by dt for frame-rate independence
        // The 0.5 multiplier prevents the constant damage from being too strong
        if (this.config.mechanic === 'aura_continuous') {
            const auraRange = this.getRange(player);
            for (let enemy of enemies) {
                if (enemy.dead) continue;
                const dist = distance(player.x, player.y, enemy.x, enemy.y);
                if (dist < auraRange) {
                    // Multiply by dt to make damage frame-rate independent
                    // 0.5 multiplier because this happens every frame
                    enemy.takeDamage(this.getDamage(player) * dt * 0.5);
                }
            }
        }

        // ========== PROJECTILE UPDATE LOOP ==========
        // Iterate backwards so we can safely remove projectiles during iteration
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];

            // ========== PUDDLE PROJECTILES ==========
            // Mechanic: Creates area-of-effect zones that damage enemies over time
            // Used by: Holy Water, Poison Cloud
            // Implementation: Puddles are stationary and periodically damage enemies inside
            if (proj.puddle) {
                proj.lifetime = (proj.lifetime || 0) + dt;

                // Remove puddles after 3 seconds
                if (proj.lifetime > 3) {
                    this.projectiles.splice(i, 1);
                    continue;
                }

                // Damage enemies in puddle area periodically
                // Hit cooldown prevents applying damage every frame (would be too strong)
                proj.hitCooldown = (proj.hitCooldown || 0) - dt;
                if (proj.hitCooldown <= 0) {
                    for (let enemy of enemies) {
                        if (enemy.dead) continue;
                        // Check if enemy is inside puddle radius
                        if (circleCollision(proj.x, proj.y, proj.radius || 40, enemy.x, enemy.y, enemy.size)) {
                            // Reduced damage (30%) since puddles last 3 seconds
                            enemy.takeDamage(this.getDamage(player) * 0.3);
                        }
                    }
                    // Reset cooldown: enemies can be hit every 0.5 seconds
                    proj.hitCooldown = 0.5;
                }
                continue;
            }

            // ========== ORBITAL PROJECTILE MOVEMENT ==========
            // These projectiles circle around the player continuously
            if (proj.orbital) {
                // Radius scales with level for orbital_continuous weapons
                const radius = this.config.mechanic === 'orbital_continuous' ? (60 + this.level * 5) : 80;

                // Update angle to rotate projectile
                proj.angle += dt * 2;

                // Calculate position using polar coordinates
                proj.x = player.x + Math.cos(proj.angle) * radius;
                proj.y = player.y + Math.sin(proj.angle) * radius;

                // Update hit cooldown
                proj.hitCooldown -= dt;

                // Check collisions with enemies
                // Only check when cooldown expired to prevent hitting same enemy too frequently
                if (proj.hitCooldown <= 0) {
                    for (let enemy of enemies) {
                        if (enemy.dead) continue;
                        if (circleCollision(proj.x, proj.y, this.config.projectileSize * 2,
                                           enemy.x, enemy.y, enemy.size)) {
                            // Apply crit chance
                            const isCrit = Math.random() < GameConfig.combat.critChance;
                            const damage = this.getDamage(player) * (isCrit ? GameConfig.combat.critMultiplier : 1);
                            enemy.takeDamage(damage);

                            // Reset cooldown to prevent immediate re-hit
                            proj.hitCooldown = GameConfig.combat.orbitalHitCooldown;
                            break; // Only hit one enemy per frame
                        }
                    }
                }
                continue;
            }

            // ========== BOOMERANG MECHANIC ==========
            // Mechanic: Projectile flies out, then returns to player
            // Used by: Axe (before evolution)
            // Implementation: After 1 second, projectile reverses direction towards player
            // When evolved, this weapon becomes orbital instead
            if (this.config.mechanic === 'boomerang' && !this.isEvolved()) {
                proj.lifetime = (proj.lifetime || 0) + dt;

                // After 1 second, start returning to player
                if (proj.lifetime > 1.0) {
                    // Calculate direction towards player
                    const dx = player.x - proj.x;
                    const dy = player.y - proj.y;
                    const norm = normalizeVector(dx, dy);

                    // Return faster than outward speed (1.5x)
                    proj.vx = norm.x * this.config.speed * 1.5;
                    proj.vy = norm.y * this.config.speed * 1.5;

                    // Remove projectile when it reaches player
                    if (distance(proj.x, proj.y, player.x, player.y) < 30) {
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                }
            }

            // ========== BOUNCING MECHANIC ==========
            // Mechanic: Projectile chains between multiple enemies
            // Used by: Music Notes
            // Implementation: After hitting enemy, seeks next nearest enemy within range
            // Tracks last hit enemy to prevent bouncing back to same target
            if (this.config.mechanic === 'bouncing' && proj.bounces > 0) {
                proj.bounceTimer = (proj.bounceTimer || 0) + dt;

                // Check for next bounce target every 0.3 seconds
                if (proj.bounceTimer > 0.3) {
                    // Find nearest enemy to bounce to (excluding last hit)
                    let nearest = null;
                    let minDist = Infinity;
                    for (let enemy of enemies) {
                        // Skip dead enemies and the one we just hit
                        if (enemy.dead || enemy === proj.lastHit) continue;

                        const dist = distance(proj.x, proj.y, enemy.x, enemy.y);
                        // Only consider enemies within bounce range (200px)
                        if (dist < 200 && dist < minDist) {
                            minDist = dist;
                            nearest = enemy;
                        }
                    }

                    // Redirect towards new target if found
                    if (nearest) {
                        const angle = Math.atan2(nearest.y - proj.y, nearest.x - proj.x);
                        proj.vx = Math.cos(angle) * this.config.speed;
                        proj.vy = Math.sin(angle) * this.config.speed;
                        proj.bounceTimer = 0; // Reset timer for next bounce check
                    }
                }
            }

            // ========== STANDARD PROJECTILE MOVEMENT ==========
            // Update position based on velocity
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;
            proj.traveled += this.config.speed * dt;

            // ========== RANGE CHECK ==========
            // Remove projectiles that have traveled beyond their max range
            if (proj.traveled > this.getRange(player)) {
                // Explosion mechanic: Create explosion when projectile expires
                if (this.config.mechanic === 'explosion') {
                    this.createExplosion(proj.x, proj.y, enemies, player);
                }

                // Puddle mechanic: Leave a damaging puddle when projectile expires
                if (this.config.mechanic === 'puddle') {
                    this.projectiles.push({
                        x: proj.x,
                        y: proj.y,
                        puddle: true,
                        radius: 40 + this.level * 5, // Scales with level
                        lifetime: 0
                    });
                }

                this.projectiles.splice(i, 1);
                continue;
            }

            // ========== ENEMY COLLISION DETECTION ==========
            for (let enemy of enemies) {
                if (enemy.dead) continue;

                if (circleCollision(proj.x, proj.y, this.config.projectileSize,
                                   enemy.x, enemy.y, enemy.size)) {

                    // Apply critical hit chance
                    const isCrit = Math.random() < 0.2;
                    const damage = this.getDamage(player) * (isCrit ? 2 : 1);
                    enemy.takeDamage(damage);

                    // ========== FREEZE MECHANIC ==========
                    // Slows enemy movement speed for a duration
                    // Used by: Ice Shard
                    if (this.config.mechanic === 'freeze') {
                        enemy.frozenTimer = 2 + this.level * 0.5; // Duration scales with level
                        enemy.originalSpeed = enemy.speed; // Save original for restoration
                        enemy.speed *= 0.3; // Reduce to 30% speed
                    }

                    // ========== CHAIN LIGHTNING MECHANIC ==========
                    // Hits additional enemies near the initial target
                    // Used by: Lightning
                    // Only chains on first hit to prevent infinite chaining
                    if (this.config.mechanic === 'chain' && proj.hits === 0) {
                        const chainCount = Math.floor(this.level / 2);
                        this.chainToNearbyEnemies(proj.x, proj.y, enemy, enemies, player, chainCount);
                    }

                    // ========== EXPLOSION ON HIT ==========
                    // Evolved fireball creates explosion on every hit
                    if (this.config.mechanic === 'explosion' && this.isEvolved()) {
                        this.createExplosion(proj.x, proj.y, enemies, player);
                    }

                    // ========== BOUNCING ON HIT ==========
                    // Decrement bounce count and track last hit enemy
                    // If out of bounces, remove projectile
                    if (this.config.mechanic === 'bouncing') {
                        // Initialize bounces on first hit based on level
                        proj.bounces = (proj.bounces || 3 + Math.floor(this.level / 2)) - 1;
                        proj.lastHit = enemy; // Prevent bouncing back to same enemy
                        proj.bounceTimer = 0;

                        // Remove if no bounces remaining
                        if (proj.bounces <= 0) {
                            this.projectiles.splice(i, 1);
                            break;
                        }
                        continue; // Don't increment hits for bouncing projectiles
                    }

                    // ========== PIERCE MECHANIC ==========
                    // Track how many enemies this projectile has hit
                    proj.hits++;

                    // Remove projectile if it exceeded pierce count
                    if (proj.hits > this.getPierce(player)) {
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // ========== FREEZE TIMER UPDATE ==========
        // Decrement freeze timers and restore enemy speed when expired
        // This happens outside the projectile loop since freeze is an enemy state
        for (let enemy of enemies) {
            if (enemy.frozenTimer) {
                enemy.frozenTimer -= dt;

                // Restore original speed when freeze expires
                if (enemy.frozenTimer <= 0) {
                    enemy.speed = enemy.originalSpeed || enemy.config.speed;
                    delete enemy.frozenTimer;
                    delete enemy.originalSpeed;
                }
            }
        }

        // ========== COOLDOWN-BASED WEAPON MECHANICS ==========
        // These mechanics trigger periodically based on weapon cooldown
        // rather than firing projectiles continuously
        if (this.cooldown <= 0) {

            // ========== SCREEN NUKE MECHANIC ==========
            // Damages all enemies on screen simultaneously
            // Used by: Pentagram
            if (this.config.mechanic === 'screen_nuke') {
                const nukeRange = this.getRange(player);
                for (let enemy of enemies) {
                    if (enemy.dead) continue;
                    enemy.takeDamage(this.getDamage(player));
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
                this.cooldown = this.getCooldownTime(player);
                return;
            }

            // ========== AURA EXPLOSION MECHANIC ==========
            // Periodic explosion centered on player
            // Used by: Crucifix
            if (this.config.mechanic === 'aura') {
                const auraRange = this.getRange(player);
                for (let enemy of enemies) {
                    if (enemy.dead) continue;
                    const dist = distance(player.x, player.y, enemy.x, enemy.y);
                    if (dist < auraRange) {
                        enemy.takeDamage(this.getDamage(player));
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
                this.cooldown = this.getCooldownTime(player);
                return;
            }

            // ========== ARC ATTACK MECHANIC ==========
            // Wide arc-shaped slash in front of player facing nearest enemy
            // Used by: Whip
            if (this.config.mechanic === 'arc') {
                const target = this.findNearestEnemy(player, enemies);
                if (target) {
                    const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
                    const arcWidth = 0.8; // ~90 degrees
                    for (let enemy of enemies) {
                        if (enemy.dead) continue;
                        const dist = distance(player.x, player.y, enemy.x, enemy.y);
                        if (dist > this.getRange(player)) continue;

                        const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                        let angleDiff = Math.abs(angle - baseAngle);
                        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                        if (angleDiff < arcWidth) {
                            enemy.takeDamage(this.getDamage(player));
                        }
                    }
                }
                this.cooldown = this.getCooldownTime(player);
                return;
            }

            // ========== BEAM MECHANIC ==========
            // Instant-hit laser that pierces all enemies in a line
            // Used by: Laser
            if (this.config.mechanic === 'beam') {
                const target = this.findNearestEnemy(player, enemies);
                if (target) {
                    const angle = Math.atan2(target.y - player.y, target.x - player.x);
                    // Hit all enemies in a line
                    for (let enemy of enemies) {
                        if (enemy.dead) continue;
                        const dist = distance(player.x, player.y, enemy.x, enemy.y);
                        if (dist > this.getRange(player)) continue;

                        const enemyAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                        let angleDiff = Math.abs(enemyAngle - angle);
                        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                        if (angleDiff < 0.1) { // Very narrow beam
                            enemy.takeDamage(this.getDamage(player));
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
                this.cooldown = this.getCooldownTime(player);
                return;
            }

            // Normal shooting mechanics
            if (enemies.length > 0) {
                // Don't shoot if orbital
                if ((this.isEvolved() && this.config.mechanic === 'boomerang') ||
                    this.config.mechanic === 'orbital_continuous' ||
                    this.config.mechanic === 'aura_continuous') {
                    this.cooldown = this.getCooldownTime(player);
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
                    this.cooldown = this.getCooldownTime(player);
                    return;
                }

                const target = this.findNearestEnemy(player, enemies);
                if (target && distance(player.x, player.y, target.x, target.y) < this.getRange(player)) {
                    this.shoot(player, target);
                    this.cooldown = this.getCooldownTime(player);
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

    chainToNearbyEnemies(x, y, hitEnemy, enemies, player, chainCount) {
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
            nearest.takeDamage(this.getDamage(player) * 0.5);
            this.chainToNearbyEnemies(nearest.x, nearest.y, nearest, enemies, player, chainCount - 1);
        }
    }

    createExplosion(x, y, enemies, player, game) {
        const explosionRadius = this.isEvolved() ? 100 : 60;
        const explosionDamage = this.getDamage(player) * 0.5;

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

    draw(ctx, player) {
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
            ctx.arc(0, 0, this.getRange(player), 0, Math.PI * 2); // Will be centered on player
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
