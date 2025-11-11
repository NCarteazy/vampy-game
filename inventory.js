// Slot-based inventory system
class InventorySlot {
    constructor() {
        this.itemId = null;
        this.amount = 0;
    }

    isEmpty() {
        return this.itemId === null || this.amount === 0;
    }

    getItem() {
        return this.itemId ? DropManager.getItem(this.itemId) : null;
    }

    canStack(itemId) {
        if (this.isEmpty()) return true;
        return this.itemId === itemId;
    }

    getMaxStack() {
        const item = this.getItem();
        return item ? item.maxStack : 99;
    }

    hasRoom(amount = 1) {
        if (this.isEmpty()) return true;
        return this.amount + amount <= this.getMaxStack();
    }

    add(itemId, amount = 1) {
        if (this.isEmpty()) {
            this.itemId = itemId;
            this.amount = amount;
            return 0; // No overflow
        }

        if (this.itemId === itemId) {
            const maxStack = this.getMaxStack();
            const totalAmount = this.amount + amount;

            if (totalAmount <= maxStack) {
                this.amount = totalAmount;
                return 0; // No overflow
            } else {
                this.amount = maxStack;
                return totalAmount - maxStack; // Return overflow amount
            }
        }

        return amount; // Can't add, return full amount
    }

    remove(amount = 1) {
        const removedAmount = Math.min(amount, this.amount);
        this.amount -= removedAmount;

        if (this.amount <= 0) {
            this.itemId = null;
            this.amount = 0;
        }

        return removedAmount;
    }

    clear() {
        this.itemId = null;
        this.amount = 0;
    }

    clone() {
        const slot = new InventorySlot();
        slot.itemId = this.itemId;
        slot.amount = this.amount;
        return slot;
    }
}

class Inventory {
    constructor(slotCount = 40) {
        this.slots = [];
        this.slotCount = slotCount;

        for (let i = 0; i < slotCount; i++) {
            this.slots.push(new InventorySlot());
        }

        this.loadFromStorage();
    }

    // Add item to inventory (auto-stacks)
    addItem(itemId, amount = 1) {
        let remainingAmount = amount;

        // First, try to stack with existing slots
        for (let slot of this.slots) {
            if (!slot.isEmpty() && slot.itemId === itemId && slot.hasRoom()) {
                const overflow = slot.add(itemId, remainingAmount);
                remainingAmount = overflow;

                if (remainingAmount === 0) {
                    this.saveToStorage();
                    return true; // Successfully added all
                }
            }
        }

        // Then, use empty slots
        for (let slot of this.slots) {
            if (slot.isEmpty()) {
                const overflow = slot.add(itemId, remainingAmount);
                remainingAmount = overflow;

                if (remainingAmount === 0) {
                    this.saveToStorage();
                    return true; // Successfully added all
                }
            }
        }

        // If we still have remaining, inventory is full
        if (remainingAmount > 0) {
            this.saveToStorage(); // Save what we could add
            console.warn(`Inventory full! Could not add ${remainingAmount} ${itemId}`);
            return false;
        }

        this.saveToStorage();
        return true;
    }

    // Remove item from inventory
    removeItem(itemId, amount = 1) {
        let remainingAmount = amount;

        for (let slot of this.slots) {
            if (!slot.isEmpty() && slot.itemId === itemId) {
                const removed = slot.remove(remainingAmount);
                remainingAmount -= removed;

                if (remainingAmount === 0) {
                    this.saveToStorage();
                    return true;
                }
            }
        }

        if (remainingAmount > 0) {
            console.warn(`Not enough ${itemId} in inventory! Missing ${remainingAmount}`);
            return false;
        }

        this.saveToStorage();
        return true;
    }

    // Get total count of an item
    getItemCount(itemId) {
        let total = 0;
        for (let slot of this.slots) {
            if (!slot.isEmpty() && slot.itemId === itemId) {
                total += slot.amount;
            }
        }
        return total;
    }

    // Check if inventory has enough of an item
    hasItem(itemId, amount = 1) {
        return this.getItemCount(itemId) >= amount;
    }

    // Get slot at index
    getSlot(index) {
        return this.slots[index];
    }

    // Swap two slots
    swapSlots(index1, index2) {
        if (index1 < 0 || index1 >= this.slotCount || index2 < 0 || index2 >= this.slotCount) {
            return false;
        }

        const temp = this.slots[index1].clone();
        this.slots[index1] = this.slots[index2].clone();
        this.slots[index2] = temp;

        this.saveToStorage();
        return true;
    }

    // Move item from one slot to another (with stacking)
    moveSlot(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.slotCount || toIndex < 0 || toIndex >= this.slotCount) {
            return false;
        }

        const fromSlot = this.slots[fromIndex];
        const toSlot = this.slots[toIndex];

        if (fromSlot.isEmpty()) return false;

        // If target is empty, move everything
        if (toSlot.isEmpty()) {
            this.swapSlots(fromIndex, toIndex);
            return true;
        }

        // If same item, try to stack
        if (fromSlot.itemId === toSlot.itemId) {
            const overflow = toSlot.add(fromSlot.itemId, fromSlot.amount);
            fromSlot.amount = overflow;

            if (fromSlot.amount === 0) {
                fromSlot.clear();
            }

            this.saveToStorage();
            return true;
        }

        // Different items, swap
        this.swapSlots(fromIndex, toIndex);
        return true;
    }

    // Clear entire inventory
    clear() {
        for (let slot of this.slots) {
            slot.clear();
        }
        this.saveToStorage();
    }

    // Get summary of all items (for UI display)
    getResourceSummary() {
        const summary = {};

        for (let slot of this.slots) {
            if (!slot.isEmpty()) {
                const item = slot.getItem();
                if (item && (item.type === 'resource' || item.type === 'material')) {
                    if (!summary[slot.itemId]) {
                        summary[slot.itemId] = {
                            itemId: slot.itemId,
                            name: item.name,
                            total: 0
                        };
                    }
                    summary[slot.itemId].total += slot.amount;
                }
            }
        }

        return Object.values(summary);
    }

    // Save to localStorage
    saveToStorage() {
        const saveData = {
            slots: this.slots.map(slot => ({
                itemId: slot.itemId,
                amount: slot.amount
            }))
        };

        localStorage.setItem('vampy_inventory', JSON.stringify(saveData));
    }

    // Load from localStorage
    loadFromStorage() {
        const saved = localStorage.getItem('vampy_inventory');
        if (!saved) return;

        try {
            const data = JSON.parse(saved);

            if (data.slots) {
                for (let i = 0; i < Math.min(data.slots.length, this.slotCount); i++) {
                    if (data.slots[i].itemId) {
                        this.slots[i].itemId = data.slots[i].itemId;
                        this.slots[i].amount = data.slots[i].amount || 0;
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load inventory:', e);
        }
    }

    // Debug: Add test items
    addTestItems() {
        this.addItem('gold', 500);
        this.addItem('gems', 50);
        this.addItem('wood', 100);
        this.addItem('stone', 75);
        this.addItem('iron', 25);
        this.addItem('essence', 10);
        this.addItem('health_potion', 5);
        this.addItem('vampire_ring', 1);
        this.addItem('lucky_coin', 1);
    }
}

// Global inventory instance
let playerInventory = null;

function initializeInventory() {
    if (!playerInventory) {
        playerInventory = new Inventory(40);
    }
    return playerInventory;
}
