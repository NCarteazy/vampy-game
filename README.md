# Vampy - Vampire Survivor Clone

A browser-based roguelike game inspired by Vampire Survivors, featuring fast-paced auto-battler gameplay with a persistent village-building meta-game.

## Features

### Gameplay
- **Auto-attack combat**: Weapons automatically target and attack nearby enemies
- **Multiple weapon types**: Dagger, Fireball, Lightning, Spinning Axe, and Holy Water
- **Wave-based enemy spawning**: Increasing difficulty with multiple enemy types
- **Level-up system**: Gain XP and choose upgrades as you level up
- **Collectible pickups**: XP gems and gold drops

### Village Building
- **Persistent progression**: Build and upgrade village buildings between runs
- **4 Building types**:
  - **Armory**: Increases damage by 10% per level
  - **Temple**: Increases max HP by 10% per level
  - **Academy**: Increases XP gain by 15% per level
  - **Workshop**: Increases attack speed by 10% per level
- **Save/Load system**: Progress is automatically saved to localStorage

### Enemy Types
- **Basic**: Standard balanced enemy
- **Fast**: Quick but fragile
- **Tank**: Slow but very durable
- **Swarm**: Weak but spawns in groups

## How to Play

### Controls
- **WASD** or **Arrow Keys**: Move your character
- **Mouse**: Navigate menus

### Objective
Survive as long as possible while defeating waves of enemies. Collect XP to level up and choose powerful upgrades. Earn gold to upgrade your village buildings, making future runs stronger.

### Game Flow
1. Start from the main menu
2. Enter a run and survive waves of enemies
3. Level up and choose upgrades
4. Collect gold during the run
5. When you die, gold is added to your village
6. Use gold to upgrade village buildings
7. Start a new run with permanent bonuses

## Installation

Simply open `index.html` in a modern web browser. No build process required!

```bash
# Clone the repository
git clone <repository-url>

# Open index.html in your browser
open index.html
```

## Technical Details

### Architecture
- **Pure vanilla JavaScript**: No frameworks or libraries required
- **HTML5 Canvas**: For smooth 2D rendering
- **Modular design**: Separate files for different game systems
- **LocalStorage**: For persistent progression

### File Structure
```
vampy-game/
├── index.html          # Main HTML structure
├── style.css           # Game styling
├── main.js             # Initialization and UI handling
├── game.js             # Main game loop and logic
├── player.js           # Player character
├── enemy.js            # Enemy system and spawner
├── weapon.js           # Weapon and projectile system
├── village.js          # Village building system
└── utils.js            # Utility functions
```

## Future Enhancements

Potential additions:
- Sound effects and music
- Particle effects for impacts
- More weapon types
- Boss enemies
- Power-up items (speed boost, invincibility, etc.)
- Character selection with different starting weapons
- Achievements system
- Leaderboard

## Credits

Inspired by Vampire Survivors by poncle.

## License

MIT License - Feel free to use and modify as you wish!
