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
        speed: 80,
        damage: 10,
        size: 15,
        color: '#ff3366',
        xpValue: 5,
        goldValue: 1,
        emoji: '🧟',
        description: 'Standard zombie enemy'
    },

    fast: {
        maxHp: 15,
        speed: 150,
        damage: 5,
        size: 12,
        color: '#ffaa00',
        xpValue: 3,
        goldValue: 2,
        emoji: '🦇',
        description: 'Fast but fragile bat'
    },

    tank: {
        maxHp: 100,
        speed: 40,
        damage: 20,
        size: 25,
        color: '#8844ff',
        xpValue: 15,
        goldValue: 5,
        emoji: '👹',
        description: 'Slow tanky demon'
    },

    swarm: {
        maxHp: 10,
        speed: 100,
        damage: 5,
        size: 10,
        color: '#00ff88',
        xpValue: 2,
        goldValue: 1,
        emoji: '👻',
        description: 'Weak ghost that spawns in groups'
    },

    boss: {
        maxHp: 500,
        speed: 60,
        damage: 30,
        size: 40,
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
