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
        this.load();
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
        this.save();
        return true;
    }

    addGold(amount) {
        this.gold += amount;
        this.save();
    }

    updateBestTime(time) {
        if (time > this.bestTime) {
            this.bestTime = time;
            this.save();
        }
    }

    save() {
        const data = {
            gold: this.gold,
            buildings: this.buildings,
            bestTime: this.bestTime
        };
        localStorage.setItem('vampy_village', JSON.stringify(data));
    }

    load() {
        const saved = localStorage.getItem('vampy_village');
        if (saved) {
            const data = JSON.parse(saved);
            this.gold = data.gold || 0;
            this.buildings = data.buildings || this.buildings;
            this.bestTime = data.bestTime || 0;
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
        this.save();
    }
}
