// Path of Exile-style Equipment System with Random Modifiers

// Equipment rarity tiers
const EQUIPMENT_RARITY = {
    NORMAL: 'normal',      // White - Base stats only, no mods
    MAGIC: 'magic',        // Blue - 1-2 modifiers
    RARE: 'rare',          // Yellow - 4-6 modifiers
    LEGENDARY: 'legendary' // Orange - Fixed unique modifiers + special effect
};

// Modifier pool - Prefix modifiers (offensive/primary stats)
const PREFIX_MODIFIERS = {
    // Damage modifiers
    brutal: { name: 'Brutal', stats: { damagePercent: [5, 15] }, minItemLevel: 1 },
    savage: { name: 'Savage', stats: { damagePercent: [15, 25] }, minItemLevel: 5 },
    merciless: { name: 'Merciless', stats: { damagePercent: [25, 40] }, minItemLevel: 10 },
    godlike: { name: 'Godlike', stats: { damagePercent: [40, 60] }, minItemLevel: 15 },

    // HP modifiers
    hardy: { name: 'Hardy', stats: { maxHpFlat: [10, 30] }, minItemLevel: 1 },
    robust: { name: 'Robust', stats: { maxHpFlat: [30, 60] }, minItemLevel: 5 },
    titanic: { name: 'Titanic', stats: { maxHpFlat: [60, 100] }, minItemLevel: 10 },
    immortal: { name: 'Immortal', stats: { maxHpFlat: [100, 150], maxHpPercent: [5, 15] }, minItemLevel: 15 },

    // Attack speed modifiers
    quick: { name: 'Quick', stats: { attackSpeedPercent: [5, 10] }, minItemLevel: 1 },
    rapid: { name: 'Rapid', stats: { attackSpeedPercent: [10, 20] }, minItemLevel: 5 },
    blinding: { name: 'Blinding', stats: { attackSpeedPercent: [20, 35] }, minItemLevel: 10 },

    // Movement speed modifiers
    swift: { name: 'Swift', stats: { moveSpeedFlat: [10, 25] }, minItemLevel: 1 },
    fleet: { name: 'Fleet', stats: { moveSpeedFlat: [25, 50] }, minItemLevel: 5 },
    phantom: { name: 'Phantom', stats: { moveSpeedFlat: [50, 80] }, minItemLevel: 10 },

    // Critical modifiers
    precise: { name: 'Precise', stats: { critChance: [2, 5] }, minItemLevel: 3 },
    deadly: { name: 'Deadly', stats: { critChance: [5, 10], critMultiplier: [10, 20] }, minItemLevel: 8 },
    annihilating: { name: 'Annihilating', stats: { critChance: [10, 15], critMultiplier: [20, 40] }, minItemLevel: 12 },
};

// Suffix modifiers (defensive/utility stats)
const SUFFIX_MODIFIERS = {
    // Regeneration
    of_renewal: { name: 'of Renewal', stats: { hpRegenPerSec: [1, 3] }, minItemLevel: 1 },
    of_rejuvenation: { name: 'of Rejuvenation', stats: { hpRegenPerSec: [3, 6] }, minItemLevel: 5 },
    of_immortality: { name: 'of Immortality', stats: { hpRegenPerSec: [6, 10] }, minItemLevel: 10 },

    // XP gain
    of_learning: { name: 'of Learning', stats: { xpGainPercent: [5, 15] }, minItemLevel: 1 },
    of_mastery: { name: 'of Mastery', stats: { xpGainPercent: [15, 30] }, minItemLevel: 5 },
    of_transcendence: { name: 'of Transcendence', stats: { xpGainPercent: [30, 50] }, minItemLevel: 10 },

    // Luck (drop chance)
    of_fortune: { name: 'of Fortune', stats: { dropChancePercent: [5, 15] }, minItemLevel: 2 },
    of_wealth: { name: 'of Wealth', stats: { dropChancePercent: [15, 25], goldGainPercent: [10, 20] }, minItemLevel: 6 },
    of_avarice: { name: 'of Avarice', stats: { dropChancePercent: [25, 40], goldGainPercent: [20, 40] }, minItemLevel: 11 },

    // Vampirism (lifesteal)
    of_the_leech: { name: 'of the Leech', stats: { lifestealPercent: [1, 3] }, minItemLevel: 4 },
    of_the_vampire: { name: 'of the Vampire', stats: { lifestealPercent: [3, 6] }, minItemLevel: 8 },
    of_blood_magic: { name: 'of Blood Magic', stats: { lifestealPercent: [6, 10] }, minItemLevel: 12 },

    // Cooldown reduction
    of_haste: { name: 'of Haste', stats: { cooldownReductionPercent: [5, 10] }, minItemLevel: 3 },
    of_alacrity: { name: 'of Alacrity', stats: { cooldownReductionPercent: [10, 20] }, minItemLevel: 7 },

    // Range
    of_reach: { name: 'of Reach', stats: { rangeFlat: [10, 30] }, minItemLevel: 2 },
    of_distance: { name: 'of Distance', stats: { rangeFlat: [30, 60] }, minItemLevel: 6 },

    // Projectile pierce
    of_penetration: { name: 'of Penetration', stats: { pierceFlat: [1, 2] }, minItemLevel: 5 },
    of_impalement: { name: 'of Impalement', stats: { pierceFlat: [2, 4] }, minItemLevel: 10 },
};

// Base equipment definitions
const EQUIPMENT_BASES = {
    // Weapons
    rusty_sword: { name: 'Rusty Sword', slot: 'weapon', baseStats: { damagePercent: 10 } },
    iron_blade: { name: 'Iron Blade', slot: 'weapon', baseStats: { damagePercent: 20, attackSpeedPercent: 5 } },
    steel_longsword: { name: 'Steel Longsword', slot: 'weapon', baseStats: { damagePercent: 35, critChance: 5 } },
    vampiric_greatsword: { name: 'Vampiric Greatsword', slot: 'weapon', baseStats: { damagePercent: 50, lifestealPercent: 2 } },

    // Helmets
    leather_cap: { name: 'Leather Cap', slot: 'helmet', baseStats: { maxHpFlat: 15 } },
    iron_helmet: { name: 'Iron Helmet', slot: 'helmet', baseStats: { maxHpFlat: 35, hpRegenPerSec: 1 } },
    steel_helm: { name: 'Steel Helm', slot: 'helmet', baseStats: { maxHpFlat: 60, maxHpPercent: 5 } },

    // Chest armor
    cloth_tunic: { name: 'Cloth Tunic', slot: 'chest', baseStats: { maxHpFlat: 25 } },
    leather_armor: { name: 'Leather Armor', slot: 'chest', baseStats: { maxHpFlat: 50, moveSpeedFlat: 10 } },
    chainmail: { name: 'Chainmail', slot: 'chest', baseStats: { maxHpFlat: 80, maxHpPercent: 5 } },
    plate_armor: { name: 'Plate Armor', slot: 'chest', baseStats: { maxHpFlat: 120, maxHpPercent: 10, hpRegenPerSec: 2 } },

    // Gloves
    cloth_gloves: { name: 'Cloth Gloves', slot: 'gloves', baseStats: { attackSpeedPercent: 5 } },
    leather_gloves: { name: 'Leather Gloves', slot: 'gloves', baseStats: { attackSpeedPercent: 10, critChance: 3 } },
    steel_gauntlets: { name: 'Steel Gauntlets', slot: 'gloves', baseStats: { damagePercent: 15, attackSpeedPercent: 10 } },

    // Boots
    cloth_shoes: { name: 'Cloth Shoes', slot: 'boots', baseStats: { moveSpeedFlat: 15 } },
    leather_boots: { name: 'Leather Boots', slot: 'boots', baseStats: { moveSpeedFlat: 30, maxHpFlat: 20 } },
    steel_greaves: { name: 'Steel Greaves', slot: 'boots', baseStats: { moveSpeedFlat: 40, maxHpFlat: 40, maxHpPercent: 5 } },

    // Rings
    simple_ring: { name: 'Simple Ring', slot: 'ring', baseStats: {} },
    jeweled_ring: { name: 'Jeweled Ring', slot: 'ring', baseStats: { damagePercent: 5 } },
    arcane_band: { name: 'Arcane Band', slot: 'ring', baseStats: { attackSpeedPercent: 5, cooldownReductionPercent: 5 } },

    // Amulets
    simple_amulet: { name: 'Simple Amulet', slot: 'amulet', baseStats: {} },
    blessed_pendant: { name: 'Blessed Pendant', slot: 'amulet', baseStats: { maxHpFlat: 30, hpRegenPerSec: 2 } },
    vampiric_charm: { name: 'Vampiric Charm', slot: 'amulet', baseStats: { lifestealPercent: 3, damagePercent: 10 } },
};

// Equipment class
class Equipment {
    constructor(baseId, rarity, itemLevel = 1, forcedMods = null) {
        this.baseId = baseId;
        this.base = EQUIPMENT_BASES[baseId];
        this.rarity = rarity;
        this.itemLevel = itemLevel;
        this.slot = this.base.slot;

        // Generate stats
        this.baseStats = { ...this.base.baseStats };
        this.modifiers = [];

        if (forcedMods) {
            this.modifiers = forcedMods;
        } else {
            this.generateModifiers();
        }

        this.calculateTotalStats();
        this.generateName();
    }

    generateModifiers() {
        const modCount = this.getModifierCount();

        // Available prefix and suffix pools based on item level
        const availablePrefixes = Object.entries(PREFIX_MODIFIERS)
            .filter(([key, mod]) => mod.minItemLevel <= this.itemLevel);
        const availableSuffixes = Object.entries(SUFFIX_MODIFIERS)
            .filter(([key, mod]) => mod.minItemLevel <= this.itemLevel);

        // Randomly select modifiers
        const prefixCount = Math.min(Math.ceil(modCount / 2), availablePrefixes.length);
        const suffixCount = Math.min(modCount - prefixCount, availableSuffixes.length);

        // Add random prefixes
        const selectedPrefixes = this.shuffleArray([...availablePrefixes]).slice(0, prefixCount);
        for (const [key, modDef] of selectedPrefixes) {
            const rolledStats = this.rollStats(modDef.stats);
            this.modifiers.push({
                type: 'prefix',
                key: key,
                name: modDef.name,
                stats: rolledStats
            });
        }

        // Add random suffixes
        const selectedSuffixes = this.shuffleArray([...availableSuffixes]).slice(0, suffixCount);
        for (const [key, modDef] of selectedSuffixes) {
            const rolledStats = this.rollStats(modDef.stats);
            this.modifiers.push({
                type: 'suffix',
                key: key,
                name: modDef.name,
                stats: rolledStats
            });
        }
    }

    getModifierCount() {
        switch (this.rarity) {
            case EQUIPMENT_RARITY.NORMAL: return 0;
            case EQUIPMENT_RARITY.MAGIC: return this.randomInt(1, 2);
            case EQUIPMENT_RARITY.RARE: return this.randomInt(4, 6);
            case EQUIPMENT_RARITY.LEGENDARY: return 6;
            default: return 0;
        }
    }

    rollStats(statRanges) {
        const rolled = {};
        for (const [stat, range] of Object.entries(statRanges)) {
            rolled[stat] = this.randomInt(range[0], range[1]);
        }
        return rolled;
    }

    calculateTotalStats() {
        this.totalStats = { ...this.baseStats };

        for (const mod of this.modifiers) {
            for (const [stat, value] of Object.entries(mod.stats)) {
                this.totalStats[stat] = (this.totalStats[stat] || 0) + value;
            }
        }
    }

    generateName() {
        switch (this.rarity) {
            case EQUIPMENT_RARITY.NORMAL:
                this.name = this.base.name;
                break;

            case EQUIPMENT_RARITY.MAGIC:
                const prefix = this.modifiers.find(m => m.type === 'prefix');
                const suffix = this.modifiers.find(m => m.type === 'suffix');

                if (prefix && suffix) {
                    this.name = `${prefix.name} ${this.base.name} ${suffix.name}`;
                } else if (prefix) {
                    this.name = `${prefix.name} ${this.base.name}`;
                } else if (suffix) {
                    this.name = `${this.base.name} ${suffix.name}`;
                } else {
                    this.name = this.base.name;
                }
                break;

            case EQUIPMENT_RARITY.RARE:
            case EQUIPMENT_RARITY.LEGENDARY:
                // Generate a random fantasy name
                this.name = this.generateFantasyName();
                this.baseName = this.base.name;
                break;
        }
    }

    generateFantasyName() {
        const prefixes = ['Shadow', 'Blood', 'Soul', 'Death', 'Void', 'Ancient', 'Eternal', 'Cursed', 'Divine', 'Infernal'];
        const suffixes = ['Bane', 'Reaver', 'Seeker', 'Render', 'Fury', 'Wrath', 'Doom', 'Fate', 'Crown', 'Edge'];

        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

        return `${prefix}${suffix}`;
    }

    getStatDescription() {
        const lines = [];

        for (const [stat, value] of Object.entries(this.totalStats)) {
            lines.push(this.formatStatLine(stat, value));
        }

        return lines;
    }

    formatStatLine(stat, value) {
        const descriptions = {
            damagePercent: `+${value}% Damage`,
            maxHpFlat: `+${value} Max HP`,
            maxHpPercent: `+${value}% Max HP`,
            attackSpeedPercent: `+${value}% Attack Speed`,
            moveSpeedFlat: `+${value} Movement Speed`,
            critChance: `+${value}% Critical Strike Chance`,
            critMultiplier: `+${value}% Critical Strike Multiplier`,
            hpRegenPerSec: `+${value} HP Regeneration per Second`,
            xpGainPercent: `+${value}% XP Gain`,
            dropChancePercent: `+${value}% Item Drop Chance`,
            goldGainPercent: `+${value}% Gold Gained`,
            lifestealPercent: `${value}% Life Steal`,
            cooldownReductionPercent: `+${value}% Cooldown Reduction`,
            rangeFlat: `+${value} Range`,
            pierceFlat: `+${value} Projectile Pierce`
        };

        return descriptions[stat] || `+${value} ${stat}`;
    }

    // Helper functions
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getRarityColor() {
        const colors = {
            normal: '#aaaaaa',
            magic: '#3366ff',
            rare: '#ffcc00',
            legendary: '#ff6600'
        };
        return colors[this.rarity] || colors.normal;
    }

    // Serialize for storage
    toJSON() {
        return {
            baseId: this.baseId,
            rarity: this.rarity,
            itemLevel: this.itemLevel,
            modifiers: this.modifiers,
            name: this.name,
            baseName: this.baseName
        };
    }

    // Deserialize from storage
    static fromJSON(data) {
        const equipment = new Equipment(data.baseId, data.rarity, data.itemLevel, data.modifiers);
        equipment.name = data.name;
        equipment.baseName = data.baseName;
        return equipment;
    }
}

// Equipment manager for generating random drops
class EquipmentGenerator {
    static generateRandomEquipment(itemLevel, guaranteedRarity = null) {
        // Select random base weighted by item level
        const suitableBases = this.getSuitableBasesForLevel(itemLevel);
        const baseId = suitableBases[Math.floor(Math.random() * suitableBases.length)];

        // Determine rarity
        const rarity = guaranteedRarity || this.rollRarity();

        return new Equipment(baseId, rarity, itemLevel);
    }

    static getSuitableBasesForLevel(itemLevel) {
        // Return all bases for now, could add level requirements later
        return Object.keys(EQUIPMENT_BASES);
    }

    static rollRarity() {
        const roll = Math.random() * 100;

        if (roll < 60) return EQUIPMENT_RARITY.NORMAL;      // 60%
        if (roll < 85) return EQUIPMENT_RARITY.MAGIC;       // 25%
        if (roll < 98) return EQUIPMENT_RARITY.RARE;        // 13%
        return EQUIPMENT_RARITY.LEGENDARY;                  // 2%
    }

    static rollEliteRarity() {
        const roll = Math.random() * 100;

        if (roll < 20) return EQUIPMENT_RARITY.NORMAL;      // 20%
        if (roll < 50) return EQUIPMENT_RARITY.MAGIC;       // 30%
        if (roll < 90) return EQUIPMENT_RARITY.RARE;        // 40%
        return EQUIPMENT_RARITY.LEGENDARY;                  // 10%
    }
}

// Player equipment loadout
class EquipmentLoadout {
    constructor() {
        this.slots = {
            weapon: null,
            helmet: null,
            chest: null,
            gloves: null,
            boots: null,
            ring1: null,
            ring2: null,
            amulet: null
        };

        this.loadFromStorage();
    }

    equipItem(equipment) {
        let targetSlot = equipment.slot;

        // Handle rings specially (two slots)
        if (equipment.slot === 'ring') {
            if (!this.slots.ring1) {
                targetSlot = 'ring1';
            } else if (!this.slots.ring2) {
                targetSlot = 'ring2';
            } else {
                // Replace ring1 by default
                targetSlot = 'ring1';
            }
        }

        const oldItem = this.slots[targetSlot];
        this.slots[targetSlot] = equipment;

        this.saveToStorage();
        return oldItem; // Return unequipped item
    }

    unequipSlot(slotName) {
        const item = this.slots[slotName];
        this.slots[slotName] = null;
        this.saveToStorage();
        return item;
    }

    getTotalStats() {
        const totalStats = {};

        for (const [slotName, equipment] of Object.entries(this.slots)) {
            if (equipment) {
                for (const [stat, value] of Object.entries(equipment.totalStats)) {
                    totalStats[stat] = (totalStats[stat] || 0) + value;
                }
            }
        }

        return totalStats;
    }

    saveToStorage() {
        const saveData = {};

        for (const [slotName, equipment] of Object.entries(this.slots)) {
            if (equipment) {
                saveData[slotName] = equipment.toJSON();
            }
        }

        localStorage.setItem('vampy_equipment', JSON.stringify(saveData));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('vampy_equipment');
        if (!saved) return;

        try {
            const data = JSON.parse(saved);

            for (const [slotName, equipData] of Object.entries(data)) {
                if (equipData) {
                    this.slots[slotName] = Equipment.fromJSON(equipData);
                }
            }
        } catch (e) {
            console.error('Failed to load equipment:', e);
        }
    }
}

// Global equipment loadout instance
let playerEquipment = null;

function initializeEquipment() {
    if (!playerEquipment) {
        playerEquipment = new EquipmentLoadout();
    }
    return playerEquipment;
}
