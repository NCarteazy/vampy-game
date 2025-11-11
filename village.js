// Village Building System

class Village {
    constructor() {
        this.gold = 0;
        this.buildings = {
            armory: { level: 0, baseCost: 50, effect: 'damage' },
            temple: { level: 0, baseCost: 75, effect: 'hp' },
            academy: { level: 0, baseCost: 100, effect: 'xp' },
            workshop: { level: 0, baseCost: 60, effect: 'attackSpeed' }
        };

        this.bestTime = 0;
        // Note: Loading is now handled by SaveManager in main.js
    }

    getCost(buildingName) {
        const building = this.buildings[buildingName];
        return Math.floor(building.baseCost * Math.pow(1.5, building.level));
    }

    canBuild(buildingName) {
        return this.gold >= this.getCost(buildingName);
    }

    build(buildingName) {
        if (!this.canBuild(buildingName)) return false;

        const cost = this.getCost(buildingName);
        this.gold -= cost;
        this.buildings[buildingName].level++;

        // Trigger auto-save via global save function
        if (window.saveGameData) {
            window.saveGameData();
        }
        return true;
    }

    addGold(amount) {
        this.gold += amount;

        // Trigger auto-save via global save function
        if (window.saveGameData) {
            window.saveGameData();
        }
    }

    updateBestTime(time) {
        if (time > this.bestTime) {
            this.bestTime = time;

            // Trigger auto-save via global save function
            if (window.saveGameData) {
                window.saveGameData();
            }
        }
    }

    reset() {
        this.gold = 0;
        this.buildings = {
            armory: { level: 0, baseCost: 50, effect: 'damage' },
            temple: { level: 0, baseCost: 75, effect: 'hp' },
            academy: { level: 0, baseCost: 100, effect: 'xp' },
            workshop: { level: 0, baseCost: 60, effect: 'attackSpeed' }
        };
        this.bestTime = 0;

        // Trigger auto-save via global save function
        if (window.saveGameData) {
            window.saveGameData();
        }
    }
}
