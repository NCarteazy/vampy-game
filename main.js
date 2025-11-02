// Main initialization and UI handling

let game = null;
let village = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize village
    village = new Village();
    updateMainMenuUI();
    updateVillageUI();

    // Get elements
    const mainMenu = document.getElementById('main-menu');
    const villageScreen = document.getElementById('village-screen');
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

    // Village buttons
    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
        switchScreen(villageScreen, mainMenu);
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
