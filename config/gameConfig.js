/**
 * Central game configuration
 * All game balance values and constants in one place for easy tuning
 */

const GameConfig = {
    // Player configuration
    player: {
        baseSpeed: 200,
        baseMaxHp: 100,
        baseSize: 20,
        emoji: '🧛',
        emojiSize: 2.5,

        // Leveling
        initialXpToNextLevel: 10,
        xpLevelScaling: 1.5,  // Multiplier for next level requirement
        levelUpHealPercent: 0.2,  // Heal 20% max HP on level up

        // Starting weapon
        startingWeapon: 'dagger'
    },

    // Village building bonuses
    village: {
        armoryDamagePerLevel: 0.1,      // 10% damage per level
        templeHpPerLevel: 0.1,          // 10% HP per level
        academyXpPerLevel: 0.15,        // 15% XP per level
        workshopAttackSpeedPerLevel: 0.1  // 10% attack speed per level
    },

    // Power-up system
    powerUps: {
        duration: 10,  // seconds
        speedMultiplier: 1.5,
        magnetRange: 300,
        normalMagnetRange: 100,
        types: ['speed', 'invincible', 'magnet'],
        emojis: {
            speed: '⚡',
            invincible: '⭐',
            magnet: '🧲'
        },
        particleCount: 12
    },

    // Combat system
    combat: {
        critChance: 0.2,       // 20% chance
        critMultiplier: 2.0,   // 2x damage
        comboTimeout: 2.0,     // seconds to maintain combo
        comboXpBonus: 0.1,     // 10% bonus XP per combo count

        // Freeze mechanic
        freezeSlowPercent: 0.3,  // Slow to 30% speed

        // Orbital weapons
        orbitalHitCooldown: 0.2,  // Can hit same enemy every 0.2s

        // Screen shake
        screenShakeDuration: 1.0,
        screenShakeDecay: 10  // Units per second
    },

    // Enemy spawning
    spawning: {
        baseSpawnInterval: 0.6,    // seconds (was 1.0 - HARDER: 40% faster spawns)
        minSpawnInterval: 0.15,    // fastest spawn rate (was 0.3 - HARDER: 50% lower minimum)
        spawnIntervalDecay: 0.95,  // Multiplier each wave (was 0.98 - HARDER: faster ramp)

        bossInterval: 30,          // Spawn boss every 30 seconds

        difficultyIncreaseInterval: 5,  // Increase difficulty every 5s (was 10s - HARDER: 2x faster ramp)
        difficultyIncrement: 0.2,       // (was 0.1 - HARDER: 2x bigger jumps)

        spawnMargin: 50,           // Distance outside screen to spawn
        bossSpawnMargin: 100,

        // Difficulty scaling
        enemyHpScaling: 0.5,       // 50% HP increase per difficulty level (was 0.3 - HARDER: 67% more HP growth)
        bossHpScaling: 0.5         // 50% HP increase per difficulty level
    },

    // Pickup/Drop system
    pickups: {
        goldDropChance: 0.3,       // 30% chance to drop gold
        goldDropMultiplier: 2,     // 2x the enemy's gold value

        xpEmoji: '💎',
        goldEmoji: '🪙',

        pickupSize: 10,
        pickupMagnetSpeed: 300,

        deathParticleCount: 8,
        particleSpeedMin: 50,
        particleSpeedMax: 150,
        particleUpwardVelocity: -100,
        particleLifetimeMin: 0.5,
        particleLifetimeMax: 1.0,
        particleGravity: 200
    },

    // Visual effects
    visual: {
        starCount: 100,
        gridSize: 50,
        gridOpacity: 0.05,

        // Shadows
        playerShadowBlur: 15,
        playerInvincibleColor: '#ffff00',
        playerNormalColor: '#ff3366',
        enemyShadowBlur: 10,
        weaponShadowBlur: 8,
        weaponEvolvedShadowBlur: 15,

        // Flash effects
        invincibleFlashInterval: 100,  // milliseconds

        // Weapon visuals
        weaponEmojiSizeMultiplier: 2,
        weaponEvolvedSizeMultiplier: 1.3,

        // Explosion effects
        explosionGrowthRate: 150  // pixels per second
    },

    // UI configuration
    ui: {
        upgradeChoiceCount: 3,  // Number of upgrade options on level up

        statUpgrades: {
            maxHp: { amount: 20, emoji: '❤️', name: 'Max HP +20', description: 'Increase maximum health' },
            speed: { amount: 30, emoji: '💨', name: 'Speed +30', description: 'Increase movement speed' },
            damage: { amount: 0.15, emoji: '💪', name: 'Damage +15%', description: 'Increase all damage' }
        }
    },

    // Performance
    performance: {
        maxDeltaTime: 0.1  // Cap delta time to prevent huge jumps
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.GameConfig = GameConfig;
}
