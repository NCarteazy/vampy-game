// Main initialization and UI handling

let game = null;
let village = null;
let inventory = null;
let equipment = null;
let collectedEquipmentList = []; // Store all collected equipment

// Global save function - saves all game data
window.saveGameData = function() {
    if (village && equipment && inventory) {
        SaveManager.saveGame(village, equipment, collectedEquipmentList, inventory);
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize village, inventory, and equipment
    village = new Village();
    inventory = initializeInventory();
    equipment = initializeEquipment();

    // Clean up old save system (migration)
    if (localStorage.getItem('vampy_village')) {
        console.log('[Main] Migrating old save data...');
        localStorage.removeItem('vampy_village');
    }

    // Load saved game data
    const saveData = SaveManager.loadGame();
    if (saveData) {
        SaveManager.applyVillageData(village, saveData);
        SaveManager.applyEquipmentData(equipment, saveData);
        collectedEquipmentList = SaveManager.applyCollectedEquipmentData(saveData);
        window.collectedEquipment = collectedEquipmentList;
        SaveManager.applyInventoryData(inventory, saveData);
        console.log('[Main] Save data loaded and applied');
    } else {
        console.log('[Main] Starting new game (no save data found)');
    }

    updateMainMenuUI();
    updateVillageUI();
    initializeInventoryUI();
    initializeEquipmentUI();

    // Get elements
    const mainMenu = document.getElementById('main-menu');
    const villageScreen = document.getElementById('village-screen');
    const inventoryScreen = document.getElementById('inventory-screen');
    const gameScreen = document.getElementById('game-screen');
    const canvas = document.getElementById('game-canvas');

    // Main menu buttons
    document.getElementById('start-game-btn').addEventListener('click', () => {
        switchScreen(mainMenu, gameScreen);
        startGame();
    });

    document.getElementById('village-btn').addEventListener('click', () => {
        switchScreen(mainMenu, villageScreen);
    });

    document.getElementById('inventory-btn').addEventListener('click', () => {
        switchScreen(mainMenu, inventoryScreen);
        updateInventoryUI();
    });

    document.getElementById('equipment-btn').addEventListener('click', () => {
        const equipmentScreen = document.getElementById('equipment-screen');
        switchScreen(mainMenu, equipmentScreen);
        updateEquipmentUI();
    });

    // Village buttons
    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
        switchScreen(villageScreen, mainMenu);
    });

    // Inventory buttons
    document.getElementById('back-from-inventory-btn').addEventListener('click', () => {
        switchScreen(inventoryScreen, mainMenu);
    });

    // Equipment buttons
    document.getElementById('back-from-equipment-btn').addEventListener('click', () => {
        const equipmentScreen = document.getElementById('equipment-screen');
        switchScreen(equipmentScreen, mainMenu);
    });

    // Building buttons
    const buildingCards = document.querySelectorAll('.building-card');
    buildingCards.forEach(card => {
        const buildingName = card.dataset.building;
        const buildBtn = card.querySelector('.build-btn');

        buildBtn.addEventListener('click', () => {
            if (village.build(buildingName)) {
                updateVillageUI();
                updateMainMenuUI();
            }
        });
    });

    // Game over button
    document.getElementById('return-menu-btn').addEventListener('click', () => {
        const gameoverScreen = document.getElementById('gameover-screen');
        gameoverScreen.classList.remove('active');

        // Clear the canvas to remove last game state
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Switch to main menu
        switchScreen(gameScreen, mainMenu);
        updateMainMenuUI();
    });

    // Initialize game
    game = new Game(canvas, village);
    window.currentGame = game; // For weapon explosion visuals
});

function switchScreen(fromScreen, toScreen) {
    fromScreen.classList.remove('active');
    toScreen.classList.add('active');
}

function startGame() {
    game.start();
}

function updateMainMenuUI() {
    document.getElementById('gold-display').textContent = village.gold;
    document.getElementById('best-time-display').textContent = formatTime(village.bestTime);
}

function updateVillageUI() {
    document.getElementById('village-gold').textContent = village.gold;

    // Update building cards
    for (let buildingName in village.buildings) {
        const building = village.buildings[buildingName];
        const card = document.querySelector(`[data-building="${buildingName}"]`);

        if (card) {
            const cost = village.getCost(buildingName);
            const canAfford = village.gold >= cost;

            card.querySelector('.cost').textContent = cost;
            card.querySelector('.level span').textContent = building.level;

            const buildBtn = card.querySelector('.build-btn');
            buildBtn.disabled = !canAfford;
            buildBtn.textContent = building.level === 0 ? 'Build' : 'Upgrade';
        }
    }
}

// Inventory UI functions
let draggedSlotIndex = null;

function initializeInventoryUI() {
    const grid = document.getElementById('inventory-grid');

    // Create all slots
    for (let i = 0; i < inventory.slotCount; i++) {
        const slotElement = document.createElement('div');
        slotElement.className = 'inventory-slot';
        slotElement.dataset.slotIndex = i;

        // Drag and drop events
        slotElement.setAttribute('draggable', 'false'); // Will enable when slot has items

        slotElement.addEventListener('dragstart', (e) => {
            const slot = inventory.getSlot(i);
            if (!slot.isEmpty()) {
                draggedSlotIndex = i;
                slotElement.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        slotElement.addEventListener('dragend', () => {
            slotElement.classList.remove('dragging');
            draggedSlotIndex = null;
        });

        slotElement.addEventListener('dragover', (e) => {
            if (draggedSlotIndex !== null && draggedSlotIndex !== i) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                slotElement.classList.add('drag-over');
            }
        });

        slotElement.addEventListener('dragleave', () => {
            slotElement.classList.remove('drag-over');
        });

        slotElement.addEventListener('drop', (e) => {
            e.preventDefault();
            slotElement.classList.remove('drag-over');

            if (draggedSlotIndex !== null && draggedSlotIndex !== i) {
                inventory.moveSlot(draggedSlotIndex, i);
                updateInventoryUI();
            }
        });

        // Hover for tooltip
        slotElement.addEventListener('mouseenter', (e) => {
            showSlotTooltip(i, e);
        });

        slotElement.addEventListener('mousemove', (e) => {
            updateTooltipPosition(e);
        });

        slotElement.addEventListener('mouseleave', () => {
            hideSlotTooltip();
        });

        grid.appendChild(slotElement);
    }

    updateInventoryUI();
}

function updateInventoryUI() {
    const grid = document.getElementById('inventory-grid');
    const slots = grid.querySelectorAll('.inventory-slot');

    // Update each slot
    slots.forEach((slotElement, index) => {
        const slot = inventory.getSlot(index);
        slotElement.innerHTML = ''; // Clear

        if (!slot.isEmpty()) {
            const item = slot.getItem();

            // Enable dragging
            slotElement.setAttribute('draggable', 'true');

            // Create slot content
            const content = document.createElement('div');
            content.className = 'slot-content';

            // Icon
            const icon = document.createElement('div');
            icon.className = `slot-icon ${item.rarity}`;
            if (item.type === 'equipment') {
                icon.classList.add('equipment');
            }
            content.appendChild(icon);

            // Amount
            if (slot.amount > 1) {
                const amount = document.createElement('div');
                amount.className = 'slot-amount';
                amount.textContent = slot.amount;
                content.appendChild(amount);
            }

            slotElement.appendChild(content);
        } else {
            slotElement.setAttribute('draggable', 'false');
        }
    });

    // Update resource summary
    updateResourceSummary();
}

function updateResourceSummary() {
    const resourceList = document.getElementById('resource-list');
    const summary = inventory.getResourceSummary();

    resourceList.innerHTML = '';

    if (summary.length === 0) {
        resourceList.innerHTML = '<p style="color: #aaa; grid-column: 1 / -1;">No resources yet. Play the game to collect items!</p>';
        return;
    }

    summary.forEach(resource => {
        const item = document.createElement('div');
        item.className = 'resource-item';

        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = resource.name;

        const amount = document.createElement('span');
        amount.className = 'amount';
        amount.textContent = resource.total;

        item.appendChild(name);
        item.appendChild(amount);
        resourceList.appendChild(item);
    });
}

function showSlotTooltip(slotIndex, event) {
    const slot = inventory.getSlot(slotIndex);
    if (slot.isEmpty()) return;

    const tooltip = document.getElementById('slot-tooltip');
    const item = slot.getItem();

    tooltip.innerHTML = `
        <div class="tooltip-title">${item.name}</div>
        <div class="tooltip-type">${item.type} - ${item.rarity}</div>
        <div class="tooltip-desc">${item.description}</div>
        <div class="tooltip-amount">Amount: ${slot.amount} / ${item.maxStack}</div>
    `;

    tooltip.classList.remove('hidden');
    updateTooltipPosition(event);
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('slot-tooltip');
    if (tooltip.classList.contains('hidden')) return;

    tooltip.style.left = (event.pageX + 15) + 'px';
    tooltip.style.top = (event.pageY + 15) + 'px';
}

function hideSlotTooltip() {
    const tooltip = document.getElementById('slot-tooltip');
    tooltip.classList.add('hidden');
}

// Equipment UI functions
function initializeEquipmentUI() {
    // Load collected equipment from window object (set by game loop)
    if (window.collectedEquipment) {
        collectedEquipmentList = window.collectedEquipment;
    }

    updateEquipmentUI();
}

function updateEquipmentUI() {
    // Update equipped slots
    const slots = ['weapon', 'helmet', 'chest', 'gloves', 'boots', 'ring1', 'ring2', 'amulet'];

    slots.forEach(slotName => {
        const slotBox = document.getElementById(`slot-${slotName}`);
        const equippedItem = equipment.slots[slotName];

        slotBox.innerHTML = '';
        slotBox.classList.remove('filled');

        if (equippedItem) {
            slotBox.classList.add('filled');

            const itemDiv = document.createElement('div');
            itemDiv.className = 'equipped-item';

            const nameDiv = document.createElement('div');
            nameDiv.className = `equipped-item-name ${equippedItem.rarity}`;
            nameDiv.textContent = equippedItem.name;

            const typeDiv = document.createElement('div');
            typeDiv.className = 'equipped-item-type';
            typeDiv.textContent = equippedItem.baseName || equippedItem.base.name;

            itemDiv.appendChild(nameDiv);
            itemDiv.appendChild(typeDiv);
            slotBox.appendChild(itemDiv);

            // Click to unequip
            slotBox.onclick = () => unequipItem(slotName);
        } else {
            slotBox.onclick = null;
        }
    });

    // Update total stats display
    updateTotalStatsDisplay();

    // Update collected equipment list
    updateCollectedEquipmentList();
}

function updateTotalStatsDisplay() {
    const totalStats = equipment.getTotalStats();
    const statsList = document.getElementById('total-stats-list');

    statsList.innerHTML = '';

    if (Object.keys(totalStats).length === 0) {
        statsList.innerHTML = '<div style="grid-column: 1 / -1; color: #888;">No equipment equipped</div>';
        return;
    }

    Object.entries(totalStats).forEach(([stat, value]) => {
        const statLine = document.createElement('div');
        statLine.className = 'stat-line';
        statLine.textContent = formatStatLine(stat, value);
        statsList.appendChild(statLine);
    });
}

function formatStatLine(stat, value) {
    const descriptions = {
        damagePercent: `+${value}% Damage`,
        maxHpFlat: `+${value} Max HP`,
        maxHpPercent: `+${value}% Max HP`,
        attackSpeedPercent: `+${value}% Attack Speed`,
        moveSpeedFlat: `+${value} Movement Speed`,
        critChance: `+${value}% Crit Chance`,
        critMultiplier: `+${value}% Crit Multiplier`,
        hpRegenPerSec: `+${value} HP/sec`,
        xpGainPercent: `+${value}% XP Gain`,
        dropChancePercent: `+${value}% Drop Chance`,
        goldGainPercent: `+${value}% Gold Gain`,
        lifestealPercent: `${value}% Lifesteal`,
        cooldownReductionPercent: `+${value}% CDR`,
        rangeFlat: `+${value} Range`,
        pierceFlat: `+${value} Pierce`
    };

    return descriptions[stat] || `+${value} ${stat}`;
}

function updateCollectedEquipmentList() {
    const equipmentList = document.getElementById('equipment-list');

    // Sync with window.collectedEquipment if it exists
    if (window.collectedEquipment) {
        collectedEquipmentList = window.collectedEquipment;
    }

    equipmentList.innerHTML = '';

    if (collectedEquipmentList.length === 0) {
        equipmentList.innerHTML = '<div style="color: #888; text-align: center; padding: 2rem;">No equipment collected yet.<br>Kill elite enemies to get loot!</div>';
        return;
    }

    // Sort by rarity
    const rarityOrder = { legendary: 0, rare: 1, magic: 2, normal: 3 };
    const sortedEquipment = [...collectedEquipmentList].sort((a, b) => {
        return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });

    sortedEquipment.forEach((equip, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `equipment-item ${equip.rarity}`;

        const headerDiv = document.createElement('div');
        headerDiv.className = 'equipment-item-header';

        const nameDiv = document.createElement('div');
        nameDiv.className = `equipment-item-name ${equip.rarity}`;
        nameDiv.textContent = equip.name;

        const slotDiv = document.createElement('div');
        slotDiv.className = 'equipment-item-slot';
        slotDiv.textContent = equip.slot;

        headerDiv.appendChild(nameDiv);
        headerDiv.appendChild(slotDiv);

        const statsDiv = document.createElement('div');
        statsDiv.className = 'equipment-item-stats';
        const statLines = equip.getStatDescription();
        statsDiv.textContent = statLines.slice(0, 3).join(', ');
        if (statLines.length > 3) {
            statsDiv.textContent += '...';
        }

        const baseDiv = document.createElement('div');
        baseDiv.className = 'equipment-item-base';
        baseDiv.textContent = equip.baseName || equip.base.name;

        itemDiv.appendChild(headerDiv);
        itemDiv.appendChild(statsDiv);
        itemDiv.appendChild(baseDiv);

        // Click to equip
        itemDiv.onclick = () => equipItem(index);

        // Hover for tooltip
        itemDiv.onmouseenter = (e) => showEquipmentTooltip(equip, e);
        itemDiv.onmousemove = (e) => updateEquipmentTooltipPosition(e);
        itemDiv.onmouseleave = () => hideEquipmentTooltip();

        equipmentList.appendChild(itemDiv);
    });
}

function equipItem(index) {
    const item = collectedEquipmentList[index];

    // Equip the item
    const unequippedItem = equipment.equipItem(item);

    // If something was unequipped, add it back to collected list
    if (unequippedItem) {
        collectedEquipmentList.push(unequippedItem);
    }

    // Remove from collected list
    collectedEquipmentList.splice(index, 1);

    // Sync with window object
    window.collectedEquipment = collectedEquipmentList;

    updateEquipmentUI();

    // Auto-save
    window.saveGameData();
}

function unequipItem(slotName) {
    const unequippedItem = equipment.unequipSlot(slotName);

    if (unequippedItem) {
        // Add back to collected list
        collectedEquipmentList.push(unequippedItem);

        // Sync with window object
        window.collectedEquipment = collectedEquipmentList;

        updateEquipmentUI();

        // Auto-save
        window.saveGameData();
    }
}

function showEquipmentTooltip(equip, event) {
    const tooltip = document.getElementById('equipment-tooltip');

    const nameDiv = document.createElement('div');
    nameDiv.className = `tooltip-equipment-name ${equip.rarity}`;
    nameDiv.textContent = equip.name;

    const baseDiv = document.createElement('div');
    baseDiv.className = 'tooltip-equipment-base';
    baseDiv.textContent = `${equip.baseName || equip.base.name} (Item Level ${equip.itemLevel})`;

    const statsDiv = document.createElement('div');
    statsDiv.className = 'tooltip-equipment-stats';

    equip.getStatDescription().forEach(statLine => {
        const line = document.createElement('div');
        line.className = 'tooltip-stat-line';
        line.textContent = statLine;
        statsDiv.appendChild(line);
    });

    const actionDiv = document.createElement('div');
    actionDiv.className = 'tooltip-action';
    actionDiv.textContent = 'Click to equip';

    tooltip.innerHTML = '';
    tooltip.appendChild(nameDiv);
    tooltip.appendChild(baseDiv);
    tooltip.appendChild(statsDiv);
    tooltip.appendChild(actionDiv);

    tooltip.classList.remove('hidden');
    updateEquipmentTooltipPosition(event);
}

function updateEquipmentTooltipPosition(event) {
    const tooltip = document.getElementById('equipment-tooltip');
    if (tooltip.classList.contains('hidden')) return;

    tooltip.style.left = (event.pageX + 15) + 'px';
    tooltip.style.top = (event.pageY + 15) + 'px';
}

function hideEquipmentTooltip() {
    const tooltip = document.getElementById('equipment-tooltip');
    tooltip.classList.add('hidden');
}
