// Item definitions and drop system
class ItemDefinition {
    constructor(id, name, type, description, maxStack = 99, rarity = 'common') {
        this.id = id;
        this.name = name;
        this.type = type; // 'resource', 'equipment', 'consumable', 'material'
        this.description = description;
        this.maxStack = maxStack;
        this.rarity = rarity; // 'common', 'uncommon', 'rare', 'epic', 'legendary'
    }
}

// Item database
const ITEM_DEFINITIONS = {
    // Resources
    gold: new ItemDefinition('gold', 'Gold', 'resource', 'Common currency for upgrades', 999, 'common'),
    gems: new ItemDefinition('gems', 'Gems', 'resource', 'Rare currency for unlocks', 999, 'rare'),

    // Building Materials
    wood: new ItemDefinition('wood', 'Wood', 'material', 'Used for building construction', 999, 'common'),
    stone: new ItemDefinition('stone', 'Stone', 'material', 'Used for advanced buildings', 999, 'common'),
    iron: new ItemDefinition('iron', 'Iron', 'material', 'Used for fortifications', 999, 'uncommon'),
    essence: new ItemDefinition('essence', 'Essence', 'material', 'Magical crafting material', 999, 'epic'),

    // Consumables (for future use)
    health_potion: new ItemDefinition('health_potion', 'Health Potion', 'consumable', 'Restores 50 HP', 10, 'common'),
    damage_boost: new ItemDefinition('damage_boost', 'Damage Elixir', 'consumable', 'Increases damage for 30s', 5, 'uncommon'),

    // Equipment/Relics (for future use)
    vampire_ring: new ItemDefinition('vampire_ring', "Vampire's Ring", 'equipment', 'Heal 1 HP per kill', 1, 'rare'),
    lucky_coin: new ItemDefinition('lucky_coin', 'Lucky Coin', 'equipment', '+10% drop chance', 1, 'rare'),
};

// Drop table configuration
const DROP_TABLES = {
    // Enemy-specific drops
    basic: [
        { itemId: 'gold', chance: 0.8, minAmount: 1, maxAmount: 3 },
        { itemId: 'wood', chance: 0.15, minAmount: 1, maxAmount: 2 },
        { itemId: 'gems', chance: 0.05, minAmount: 1, maxAmount: 1 },
    ],

    fast: [
        { itemId: 'gold', chance: 0.9, minAmount: 2, maxAmount: 4 },
        { itemId: 'essence', chance: 0.1, minAmount: 1, maxAmount: 1 },
    ],

    tank: [
        { itemId: 'gold', chance: 0.7, minAmount: 3, maxAmount: 6 },
        { itemId: 'stone', chance: 0.4, minAmount: 1, maxAmount: 3 },
        { itemId: 'iron', chance: 0.15, minAmount: 1, maxAmount: 2 },
        { itemId: 'gems', chance: 0.1, minAmount: 1, maxAmount: 2 },
    ],

    swarm: [
        { itemId: 'gold', chance: 0.6, minAmount: 1, maxAmount: 2 },
        { itemId: 'wood', chance: 0.3, minAmount: 1, maxAmount: 2 },
    ],

    // Boss drops - very rewarding!
    boss: [
        { itemId: 'gold', chance: 1.0, minAmount: 10, maxAmount: 20 },
        { itemId: 'gems', chance: 0.9, minAmount: 3, maxAmount: 8 },
        { itemId: 'essence', chance: 0.6, minAmount: 2, maxAmount: 5 },
        { itemId: 'stone', chance: 0.5, minAmount: 2, maxAmount: 4 },
        { itemId: 'iron', chance: 0.4, minAmount: 1, maxAmount: 3 },
        { itemId: 'vampire_ring', chance: 0.08, minAmount: 1, maxAmount: 1 },
        { itemId: 'lucky_coin', chance: 0.08, minAmount: 1, maxAmount: 1 },
    ],

    // Special drops (for future elite enemies, etc.)
    elite: [
        { itemId: 'gems', chance: 0.8, minAmount: 2, maxAmount: 5 },
        { itemId: 'essence', chance: 0.4, minAmount: 1, maxAmount: 3 },
        { itemId: 'vampire_ring', chance: 0.05, minAmount: 1, maxAmount: 1 },
        { itemId: 'lucky_coin', chance: 0.05, minAmount: 1, maxAmount: 1 },
    ],

    // Time-based bonus drops (awarded for surviving milestones)
    survival_3min: [
        { itemId: 'gems', chance: 1.0, minAmount: 5, maxAmount: 10 },
        { itemId: 'essence', chance: 0.5, minAmount: 2, maxAmount: 4 },
    ],

    survival_5min: [
        { itemId: 'gems', chance: 1.0, minAmount: 10, maxAmount: 20 },
        { itemId: 'essence', chance: 1.0, minAmount: 3, maxAmount: 6 },
        { itemId: 'vampire_ring', chance: 0.1, minAmount: 1, maxAmount: 1 },
    ],
};

// Equipment drop instance (spawns actual equipment items)
class EquipmentDrop {
    constructor(x, y, equipment) {
        this.x = x;
        this.y = y;
        this.equipment = equipment; // Full Equipment object
        this.radius = 15;
        this.collected = false;
        this.isEquipment = true; // Flag to identify as equipment

        // Visual properties
        this.bobOffset = Math.random() * Math.PI * 2;
        this.attractRadius = 120; // Slightly larger attract radius
        this.attracting = false;
        this.attractSpeed = 250; // Slightly slower for dramatic effect
    }

    update(dt, player) {
        // Bob up and down
        this.bobOffset += dt * 3;

        // Check if player is in range
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.attractRadius) {
            this.attracting = true;
        }

        // Move toward player if attracting
        if (this.attracting) {
            const moveX = (dx / distance) * this.attractSpeed * dt;
            const moveY = (dy / distance) * this.attractSpeed * dt;
            this.x += moveX;
            this.y += moveY;

            // Check for collection
            const playerSize = player.size || player.radius || 20;
            if (distance < playerSize + this.radius) {
                this.collected = true;
                return this.equipment; // Return equipment object
            }
        }

        return null;
    }

    draw(ctx) {
        const bobAmount = Math.sin(this.bobOffset) * 4;
        const drawY = this.y + bobAmount;

        const rarityColors = {
            normal: '#aaaaaa',
            magic: '#3366ff',
            rare: '#ffcc00',
            legendary: '#ff6600'
        };

        const color = rarityColors[this.equipment.rarity];

        // Glow effect based on rarity
        const glowIntensity = this.equipment.rarity === 'legendary' ? 25 :
                              this.equipment.rarity === 'rare' ? 20 :
                              this.equipment.rarity === 'magic' ? 15 : 10;

        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = color;

        // Draw as a star/diamond shape for equipment
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2) + (this.bobOffset / 2);
            const x = this.x + Math.cos(angle) * this.radius;
            const y = drawY + Math.sin(angle) * this.radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();

        // Inner shine
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x - 3, drawY - 3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Draw rarity letter
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        const rarityLetter = this.equipment.rarity.charAt(0).toUpperCase();
        ctx.strokeText(rarityLetter, this.x, drawY + this.radius + 15);
        ctx.fillText(rarityLetter, this.x, drawY + this.radius + 15);
    }
}

// Drop instance (what actually spawns in the world)
class Drop {
    constructor(x, y, itemId, amount = 1) {
        this.x = x;
        this.y = y;
        this.itemId = itemId;
        this.amount = amount;
        this.radius = 12;
        this.collected = false;
        this.isEquipment = false; // Flag to identify as regular drop

        // Visual properties
        this.bobOffset = Math.random() * Math.PI * 2; // For floating animation
        this.attractRadius = 100; // Distance to start attracting to player
        this.attracting = false;
        this.attractSpeed = 300;

        // Get item definition for visuals
        this.definition = ITEM_DEFINITIONS[itemId];
    }

    update(dt, player) {
        // Bob up and down
        this.bobOffset += dt * 3;

        // Check if player is in range
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.attractRadius) {
            this.attracting = true;
        }

        // Move toward player if attracting
        if (this.attracting) {
            const moveX = (dx / distance) * this.attractSpeed * dt;
            const moveY = (dy / distance) * this.attractSpeed * dt;
            this.x += moveX;
            this.y += moveY;

            // Check for collection
            const playerSize = player.size || player.radius || 20;
            if (distance < playerSize + this.radius) {
                this.collected = true;
                return this.itemId;
            }
        }

        return null;
    }

    draw(ctx) {
        const bobAmount = Math.sin(this.bobOffset) * 3;
        const drawY = this.y + bobAmount;

        // Draw based on item type/rarity
        const colors = {
            common: '#888888',
            uncommon: '#4CAF50',
            rare: '#2196F3',
            epic: '#9C27B0',
            legendary: '#FF9800'
        };

        const color = colors[this.definition.rarity] || colors.common;

        // Glow effect for rare items
        if (this.definition.rarity !== 'common') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
        }

        // Draw item based on type
        ctx.fillStyle = color;

        if (this.definition.type === 'resource' || this.definition.type === 'material') {
            // Draw as circle/gem
            ctx.beginPath();
            ctx.arc(this.x, drawY, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Inner shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(this.x - 3, drawY - 3, this.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw as square/chest for equipment
            ctx.fillRect(this.x - this.radius, drawY - this.radius, this.radius * 2, this.radius * 2);

            // Inner shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(this.x - this.radius/2, drawY - this.radius/2, this.radius, this.radius);
        }

        ctx.shadowBlur = 0;

        // Draw amount if > 1
        if (this.amount > 1) {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.strokeText(this.amount.toString(), this.x, drawY + this.radius + 12);
            ctx.fillText(this.amount.toString(), this.x, drawY + this.radius + 12);
        }
    }
}

// Drop manager for generating drops from tables
class DropManager {
    static rollDrops(dropTableName) {
        const dropTable = DROP_TABLES[dropTableName];
        if (!dropTable) {
            console.warn(`Drop table '${dropTableName}' not found`);
            return [];
        }

        const drops = [];

        for (const dropEntry of dropTable) {
            if (Math.random() < dropEntry.chance) {
                const amount = Math.floor(
                    Math.random() * (dropEntry.maxAmount - dropEntry.minAmount + 1) + dropEntry.minAmount
                );
                drops.push({
                    itemId: dropEntry.itemId,
                    amount: amount
                });
            }
        }

        return drops;
    }

    static spawnDrops(x, y, dropTableName, spreadRadius = 30) {
        const droppedItems = this.rollDrops(dropTableName);
        const dropInstances = [];

        for (const item of droppedItems) {
            // Spread drops around the spawn point
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * spreadRadius;
            const dropX = x + Math.cos(angle) * distance;
            const dropY = y + Math.sin(angle) * distance;

            dropInstances.push(new Drop(dropX, dropY, item.itemId, item.amount));
        }

        return dropInstances;
    }

    // Get item definition by ID
    static getItem(itemId) {
        return ITEM_DEFINITIONS[itemId];
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ITEM_DEFINITIONS = ITEM_DEFINITIONS;
    window.ItemDatabase = ITEM_DEFINITIONS; // Alias for compatibility
    window.DROP_TABLES = DROP_TABLES;
    window.Drop = Drop;
    window.EquipmentDrop = EquipmentDrop;
    window.DropManager = DropManager;
}
