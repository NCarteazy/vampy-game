/**
 * Enemy configuration data
 * All enemy types with their stats and behaviors
 *
 * Enemy Types:
 * - basic: Standard balanced enemy
 * - fast: Low HP, high speed
 * - tank: High HP, low speed
 * - swarm: Very low HP, medium speed
 * - boss: Very high HP, medium speed, spawns periodically
 */

const EnemyConfigs = {
    basic: {
        maxHp: 30,
        speed: 110,        // Was 80 - HARDER: 37% faster
        damage: 15,        // Was 10 - HARDER: 50% more damage
        size: 20,          // Was 15 - HARDER: 33% larger hitbox
        color: '#ff3366',
        xpValue: 5,
        goldValue: 1,
        emoji: '🧟',
        description: 'Standard zombie enemy'
    },

    fast: {
        maxHp: 15,
        speed: 200,        // Was 150 - HARDER: 33% faster
        damage: 8,         // Was 5 - HARDER: 60% more damage
        size: 16,          // Was 12 - HARDER: 33% larger hitbox
        color: '#ffaa00',
        xpValue: 3,
        goldValue: 2,
        emoji: '🦇',
        description: 'Fast but fragile bat'
    },

    tank: {
        maxHp: 100,
        speed: 55,         // Was 40 - HARDER: 37% faster
        damage: 25,        // Was 20 - HARDER: 25% more damage
        size: 30,          // Was 25 - HARDER: 20% larger hitbox
        color: '#8844ff',
        xpValue: 15,
        goldValue: 5,
        emoji: '👹',
        description: 'Slow tanky demon'
    },

    swarm: {
        maxHp: 10,
        speed: 130,        // Was 100 - HARDER: 30% faster
        damage: 8,         // Was 5 - HARDER: 60% more damage
        size: 14,          // Was 10 - HARDER: 40% larger hitbox
        color: '#00ff88',
        xpValue: 2,
        goldValue: 1,
        emoji: '👻',
        description: 'Weak ghost that spawns in groups'
    },

    boss: {
        maxHp: 500,
        speed: 75,         // Was 60 - HARDER: 25% faster
        damage: 40,        // Was 30 - HARDER: 33% more damage
        size: 45,          // Was 40 - HARDER: 12% larger hitbox
        color: '#ff0000',
        xpValue: 50,
        goldValue: 25,
        emoji: '💀',
        description: 'Powerful boss enemy'
    }
};

// Enemy spawn weights based on difficulty level
const EnemySpawnWeights = {
    // Difficulty level 1.0-1.5
    early: {
        basic: 0.7,
        fast: 0.2,
        swarm: 0.1,
        tank: 0.0
    },

    // Difficulty level 1.5-2.0
    mid: {
        basic: 0.4,
        fast: 0.3,
        swarm: 0.2,
        tank: 0.1
    },

    // Difficulty level 2.0+
    late: {
        basic: 0.3,
        fast: 0.3,
        swarm: 0.2,
        tank: 0.2
    }
};

// Helper function to get spawn weights based on difficulty
function getEnemySpawnWeights(difficulty) {
    if (difficulty < 1.5) {
        return EnemySpawnWeights.early;
    } else if (difficulty < 2.0) {
        return EnemySpawnWeights.mid;
    } else {
        return EnemySpawnWeights.late;
    }
}

// Helper function to select enemy type based on weights
function selectEnemyType(difficulty) {
    const weights = getEnemySpawnWeights(difficulty);
    const rand = Math.random();
    let cumulative = 0;

    for (const [type, weight] of Object.entries(weights)) {
        cumulative += weight;
        if (rand < cumulative) {
            return type;
        }
    }

    return 'basic'; // fallback
}

// Make available globally
if (typeof window !== 'undefined') {
    window.EnemyConfigs = EnemyConfigs;
    window.EnemySpawnWeights = EnemySpawnWeights;
    window.getEnemySpawnWeights = getEnemySpawnWeights;
    window.selectEnemyType = selectEnemyType;
}
