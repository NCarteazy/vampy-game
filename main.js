// Main initialization and UI handling

let game = null;
let village = null;
let inventory = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize village and inventory
    village = new Village();
    inventory = initializeInventory();

    // Add some test items to demonstrate the inventory (comment out later)
    // Uncomment the line below to add test items:
    // inventory.addTestItems();

    updateMainMenuUI();
    updateVillageUI();
    initializeInventoryUI();

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

    // Village buttons
    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
        switchScreen(villageScreen, mainMenu);
    });

    // Inventory buttons
    document.getElementById('back-from-inventory-btn').addEventListener('click', () => {
        switchScreen(inventoryScreen, mainMenu);
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
        switchScreen(gameScreen, mainMenu);
        updateMainMenuUI();
    });

    // Initialize game
    game = new Game(canvas, village);
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
