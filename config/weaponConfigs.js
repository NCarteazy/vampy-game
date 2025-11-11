/**
 * Weapon configuration data
 * All weapon stats, mechanics, and evolution data
 *
 * Weapon Mechanics:
 * - multishot: Fires multiple projectiles in a spread
 * - explosion: Creates explosion on impact/range end
 * - chain: Chains to nearby enemies
 * - boomerang: Returns to player, evolves to orbit
 * - puddle: Leaves damaging puddles
 * - orbital_continuous: Continuously orbiting projectiles
 * - aura: Periodic explosion around player
 * - aura_continuous: Constant damage field around player
 * - arc: Wide arc attack in front of player
 * - freeze: Slows enemies on hit
 * - screen_nuke: Damages all enemies on screen
 * - random_spread: Fires in random directions
 * - beam: Instant hit laser line
 * - bouncing: Projectiles bounce between enemies
 */

const WeaponConfigs = {
    // ========== STARTER WEAPONS ==========

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
        mechanic: 'multishot'
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
        mechanic: 'explosion'
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
        mechanic: 'chain'
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
        mechanic: 'boomerang'
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
        mechanic: 'puddle'
    },

    // ========== DEFENSIVE WEAPONS ==========

    bible: {
        name: 'Holy Book',
        damage: 12,
        speed: 150,
        cooldownTime: 0.1,
        range: 200,
        pierce: 3,
        projectileSize: 12,
        color: '#ffd700',
        emoji: '📖',
        evolvedEmoji: '📕',
        evolvedName: 'Necronomicon',
        description: 'Orbiting pages protect you',
        mechanic: 'orbital_continuous'
    },

    cross: {
        name: 'Crucifix',
        damage: 20,
        speed: 0,
        cooldownTime: 5.0,
        range: 150,
        pierce: 0,
        projectileSize: 20,
        color: '#ffffff',
        emoji: '✝️',
        evolvedEmoji: '⛪',
        evolvedName: 'Divine Cross',
        description: 'Creates holy explosions around you',
        mechanic: 'aura'
    },

    garlic: {
        name: 'Garlic',
        damage: 5,
        speed: 0,
        cooldownTime: 0.5,
        range: 120,
        pierce: 0,
        projectileSize: 15,
        color: '#f5f5dc',
        emoji: '🧄',
        evolvedEmoji: '💨',
        evolvedName: 'Soul Eater',
        description: 'Damages nearby enemies continuously',
        mechanic: 'aura_continuous'
    },

    knife: {
        name: 'Knife Ring',
        damage: 16,
        speed: 0,
        cooldownTime: 0.1,
        range: 100,
        pierce: 1,
        projectileSize: 10,
        color: '#c0c0c0',
        emoji: '🔪',
        evolvedEmoji: '⚙️',
        evolvedName: 'Blade Vortex',
        description: 'Knives orbit around you',
        mechanic: 'orbital_continuous'
    },

    // ========== AREA CONTROL WEAPONS ==========

    whip: {
        name: 'Whip',
        damage: 18,
        speed: 0,
        cooldownTime: 1.2,
        range: 180,
        pierce: 10,
        projectileSize: 20,
        color: '#8b4513',
        emoji: '🎀',
        evolvedEmoji: '⛓️',
        evolvedName: 'Vampire Killer',
        description: 'Slashes in an arc in front',
        mechanic: 'arc'
    },

    frost: {
        name: 'Ice Shard',
        damage: 12,
        speed: 350,
        cooldownTime: 0.7,
        range: 350,
        pierce: 1,
        projectileSize: 10,
        color: '#00ddff',
        emoji: '❄️',
        evolvedEmoji: '🧊',
        evolvedName: 'Blizzard',
        description: 'Freezes and slows enemies',
        mechanic: 'freeze'
    },

    poison: {
        name: 'Poison Cloud',
        damage: 15,
        speed: 200,
        cooldownTime: 2.0,
        range: 350,
        pierce: 0,
        projectileSize: 15,
        color: '#9acd32',
        emoji: '☠️',
        evolvedEmoji: '☣️',
        evolvedName: 'Toxic Plague',
        description: 'Leaves poison puddles',
        mechanic: 'puddle'
    },

    // ========== POWERFUL/SPECIAL WEAPONS ==========

    pentagram: {
        name: 'Pentagram',
        damage: 50,
        speed: 0,
        cooldownTime: 8.0,
        range: 250,
        pierce: 0,
        projectileSize: 30,
        color: '#ff00ff',
        emoji: '⭐',
        evolvedEmoji: '✨',
        evolvedName: 'Celestial Star',
        description: 'Massive screen-wide damage',
        mechanic: 'screen_nuke'
    },

    bones: {
        name: 'Bone',
        damage: 14,
        speed: 320,
        cooldownTime: 0.6,
        range: 400,
        pierce: 0,
        projectileSize: 10,
        color: '#f5f5f5',
        emoji: '🦴',
        evolvedEmoji: '💀',
        evolvedName: 'Skeleton Army',
        description: 'Throws bones in random directions',
        mechanic: 'random_spread'
    },

    laser: {
        name: 'Laser',
        damage: 8,
        speed: 800,
        cooldownTime: 0.4,
        range: 600,
        pierce: 999,
        projectileSize: 8,
        color: '#ff0000',
        emoji: '🔴',
        evolvedEmoji: '🔴',
        evolvedName: 'Death Ray',
        description: 'Piercing laser beam',
        mechanic: 'beam'
    },

    music: {
        name: 'Music Note',
        damage: 10,
        speed: 280,
        cooldownTime: 0.5,
        range: 300,
        pierce: 2,
        projectileSize: 10,
        color: '#ff69b4',
        emoji: '🎵',
        evolvedEmoji: '🎶',
        evolvedName: 'Symphony',
        description: 'Notes bounce between enemies',
        mechanic: 'bouncing'
    }
};

// Weapon mechanic-specific configuration
const WeaponMechanicConfig = {
    multishot: {
        spreadAngle: 0.3  // Angle between projectiles
    },

    explosion: {
        normalRadius: 60,
        evolvedRadius: 100,
        damageMultiplier: 0.5
    },

    chain: {
        chainRange: 150,
        damageMultiplier: 0.5
    },

    boomerang: {
        returnTime: 1.0,
        returnSpeedMultiplier: 1.5,
        returnDistance: 30,
        orbitalCount: 3,
        orbitalRadius: 80
    },

    orbital_continuous: {
        baseRadius: 60,
        radiusPerLevel: 5,
        rotationSpeed: 2
    },

    aura: {
        // Uses weapon range config
    },

    aura_continuous: {
        damageMultiplier: 0.5  // Applied per frame, so reduced
    },

    arc: {
        arcWidth: 0.8  // ~90 degrees in radians
    },

    freeze: {
        baseDuration: 2,
        durationPerLevel: 0.5,
        slowPercent: 0.3  // 30% speed
    },

    screen_nuke: {
        // Uses weapon range and damage
    },

    random_spread: {
        baseCount: 3,
        countPerTwoLevels: 1
    },

    beam: {
        angleThreshold: 0.1,  // Very narrow beam
        visualLifetime: 0.1,
        lineWidth: 3
    },

    bouncing: {
        baseBounces: 3,
        bouncesPerTwoLevels: 1,
        bounceRange: 200,
        bounceDelay: 0.3
    },

    puddle: {
        baseRadius: 40,
        radiusPerLevel: 5,
        lifetime: 3,
        hitCooldown: 0.5,
        damageMultiplier: 0.3,
        opacity: 0.3,
        pulseSpeed: 3
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.WeaponConfigs = WeaponConfigs;
    window.WeaponMechanicConfig = WeaponMechanicConfig;
}
