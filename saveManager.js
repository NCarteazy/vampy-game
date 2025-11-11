// Save Manager - Handles game persistence using localStorage

const SaveManager = {
    SAVE_KEY: 'vampy_game_save',

    /**
     * Save all game data to localStorage
     */
    saveGame(village, equipment, collectedEquipment, inventory) {
        const saveData = {
            version: 1,
            timestamp: Date.now(),

            // Village data
            village: {
                gold: village.gold,
                bestTime: village.bestTime,
                buildings: {}
            },

            // Equipment data
            equipment: {
                slots: {}
            },
            collectedEquipment: [],

            // Inventory data
            inventory: {
                slots: []
            }
        };

        // Save village buildings
        for (let buildingName in village.buildings) {
            saveData.village.buildings[buildingName] = {
                level: village.buildings[buildingName].level
            };
        }

        // Save equipped items
        for (let slotName in equipment.slots) {
            const item = equipment.slots[slotName];
            if (item) {
                saveData.equipment.slots[slotName] = this.serializeEquipment(item);
            }
        }

        // Save collected equipment
        if (collectedEquipment && Array.isArray(collectedEquipment)) {
            saveData.collectedEquipment = collectedEquipment.map(item => this.serializeEquipment(item));
        }

        // Save inventory slots
        for (let i = 0; i < inventory.slotCount; i++) {
            const slot = inventory.getSlot(i);
            if (!slot.isEmpty()) {
                saveData.inventory.slots.push({
                    index: i,
                    itemId: slot.item.id,
                    amount: slot.amount
                });
            }
        }

        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
            console.log('[SaveManager] Game saved successfully');
            return true;
        } catch (e) {
            console.error('[SaveManager] Failed to save game:', e);
            return false;
        }
    },

    /**
     * Load game data from localStorage
     */
    loadGame() {
        try {
            const savedData = localStorage.getItem(this.SAVE_KEY);
            if (!savedData) {
                console.log('[SaveManager] No save data found');
                return null;
            }

            const data = JSON.parse(savedData);
            console.log('[SaveManager] Game loaded successfully');
            return data;
        } catch (e) {
            console.error('[SaveManager] Failed to load game:', e);
            return null;
        }
    },

    /**
     * Apply loaded data to village
     */
    applyVillageData(village, data) {
        if (!data || !data.village) return;

        village.gold = data.village.gold || 0;
        village.bestTime = data.village.bestTime || 0;

        // Apply building levels
        if (data.village.buildings) {
            for (let buildingName in data.village.buildings) {
                if (village.buildings[buildingName]) {
                    village.buildings[buildingName].level = data.village.buildings[buildingName].level;
                }
            }
        }

        console.log('[SaveManager] Village data applied');
    },

    /**
     * Apply loaded data to equipment
     */
    applyEquipmentData(equipment, data) {
        if (!data || !data.equipment) return;

        // Apply equipped items
        if (data.equipment.slots) {
            for (let slotName in data.equipment.slots) {
                const itemData = data.equipment.slots[slotName];
                const item = this.deserializeEquipment(itemData);
                if (item) {
                    equipment.slots[slotName] = item;
                }
            }
        }

        console.log('[SaveManager] Equipment data applied');
    },

    /**
     * Apply loaded data to collected equipment list
     */
    applyCollectedEquipmentData(data) {
        if (!data || !data.collectedEquipment) return [];

        const collectedList = data.collectedEquipment.map(itemData => {
            return this.deserializeEquipment(itemData);
        }).filter(item => item !== null);

        console.log('[SaveManager] Collected equipment data applied');
        return collectedList;
    },

    /**
     * Apply loaded data to inventory
     */
    applyInventoryData(inventory, data) {
        if (!data || !data.inventory) return;

        // Clear inventory first
        for (let i = 0; i < inventory.slotCount; i++) {
            inventory.slots[i] = new InventorySlot();
        }

        // Apply saved slots
        if (data.inventory.slots && Array.isArray(data.inventory.slots)) {
            for (let slotData of data.inventory.slots) {
                const item = ItemDatabase[slotData.itemId];
                if (item && slotData.index < inventory.slotCount) {
                    inventory.slots[slotData.index].item = item;
                    inventory.slots[slotData.index].amount = slotData.amount;
                }
            }
        }

        console.log('[SaveManager] Inventory data applied');
    },

    /**
     * Serialize equipment item to JSON-friendly format
     */
    serializeEquipment(item) {
        if (!item) return null;

        return {
            baseName: item.baseName,
            slot: item.slot,
            rarity: item.rarity,
            itemLevel: item.itemLevel,
            affixes: item.affixes
        };
    },

    /**
     * Deserialize equipment item from saved data
     */
    deserializeEquipment(data) {
        if (!data) return null;

        try {
            // Find the base equipment type
            const base = EquipmentBases[data.baseName];
            if (!base) {
                console.warn('[SaveManager] Unknown equipment base:', data.baseName);
                return null;
            }

            // Recreate the equipment item
            const item = new Equipment(base, data.itemLevel);
            item.rarity = data.rarity;
            item.affixes = data.affixes || [];

            return item;
        } catch (e) {
            console.error('[SaveManager] Failed to deserialize equipment:', e);
            return null;
        }
    },

    /**
     * Clear all save data
     */
    clearSave() {
        try {
            localStorage.removeItem(this.SAVE_KEY);
            console.log('[SaveManager] Save data cleared');
            return true;
        } catch (e) {
            console.error('[SaveManager] Failed to clear save:', e);
            return false;
        }
    },

    /**
     * Check if save data exists
     */
    hasSaveData() {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.SaveManager = SaveManager;
}
