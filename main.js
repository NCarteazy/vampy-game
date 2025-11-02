// Main initialization and UI handling

let game = null;
let village = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');

    try {
        // Initialize village
        village = new Village();
        console.log('Village created:', village);
        updateMainMenuUI();
        console.log('Main menu UI updated');
        updateVillageUI();
        console.log('Village UI updated');
    } catch (error) {
        console.error('Error during initialization:', error);
    }

    // Get elements
    const mainMenu = document.getElementById('main-menu');
    const villageScreen = document.getElementById('village-screen');
    const gameScreen = document.getElementById('game-screen');
    const canvas = document.getElementById('game-canvas');
    console.log('Canvas element:', canvas);

    // Main menu buttons
    const startButton = document.getElementById('start-game-btn');
    console.log('Start button element:', startButton);

    if (startButton) {
        startButton.addEventListener('click', () => {
            console.log('Start button clicked!');
            switchScreen(mainMenu, gameScreen);
            console.log('Screen switched, calling startGame()');
            startGame();
        });
        console.log('Click listener added to start button');
    } else {
        console.error('ERROR: Start button not found!');
    }

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
    try {
        game = new Game(canvas, village);
        console.log('Game object created:', game);
    } catch (error) {
        console.error('Error creating game:', error);
    }

    console.log('DOMContentLoaded handler complete');
});

function switchScreen(fromScreen, toScreen) {
    fromScreen.classList.remove('active');
    toScreen.classList.add('active');
}

function startGame() {
    console.log('startGame() called, game object:', game);
    if (game) {
        game.start();
    } else {
        console.error('ERROR: game object is null!');
    }
}

function updateMainMenuUI() {
    try {
        document.getElementById('gold-display').textContent = village.gold;
        document.getElementById('best-time-display').textContent = formatTime(village.bestTime);
    } catch (error) {
        console.error('Error in updateMainMenuUI:', error);
    }
}

function updateVillageUI() {
    try {
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
    } catch (error) {
        console.error('Error in updateVillageUI:', error);
    }
}
