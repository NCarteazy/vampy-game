# Vampy - Vampire Survivor Clone

A browser-based roguelike game inspired by Vampire Survivors, featuring fast-paced auto-battler gameplay with a persistent village-building meta-game.

## Features

### Core Gameplay
- **Auto-attack combat**: Weapons automatically target and attack nearby enemies
- **5 Unique weapons**: 🗡️ Dagger, 🔥 Fireball, ⚡ Lightning, 🪓 Spinning Axe, 💧 Holy Water
- **Wave-based progression**: Difficulty increases every 10 seconds with wave counter
- **Level-up system**: Gain XP and choose from 3 random upgrades
- **Collectible pickups**: 💎 XP gems and 🪙 gold coins

### Combat Systems
- **Critical hits**: 20% chance to deal 2x damage for satisfying spikes
- **Combo system**: Chain kills within 2 seconds for XP bonuses (+10% per combo)
- **Boss fights**: 💀 Giant skull bosses spawn every 30 seconds
- **Screen shake**: Impactful visual feedback on boss defeats

### Power-ups
Dropped by bosses and last 10 seconds each:
- **⚡ Speed Boost**: 50% faster movement
- **⭐ Invincibility**: Cannot take damage (player flashes yellow)
- **🧲 Magnet**: 3x pickup range for easy collection

### Village Building
- **Persistent progression**: Build and upgrade village buildings between runs
- **4 Building types**:
  - **⚔️ Armory**: +10% damage per level
  - **⛪ Temple**: +10% max HP per level
  - **🎓 Academy**: +15% XP gain per level
  - **🔨 Workshop**: +10% attack speed per level
- **Save/Load system**: Progress automatically saved to localStorage

### Enemy Types
All enemies use expressive emoji art:
- **🧟 Zombies**: Standard balanced enemy
- **🦇 Bats**: Quick but fragile
- **👹 Ogres**: Slow but very durable tanks
- **👻 Ghosts**: Weak but spawns in swarms
- **💀 Skull Boss**: Massive health, drops power-ups

## How to Play

### Controls
- **WASD** or **Arrow Keys**: Move your character
- **Mouse**: Navigate menus

### Objective
Survive as long as possible while defeating waves of enemies. Collect XP to level up and choose powerful upgrades. Earn gold to upgrade your village buildings, making future runs stronger.

### Tips
- **Chain kills** to build combo multipliers for bonus XP
- **Save power-ups** for boss encounters or overwhelming situations
- **Focus on bosses** - they drop valuable power-ups
- **Upgrade your village** between runs for permanent stat boosts
- **Balance your build** - mix damage, survivability, and utility upgrades

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

## Visual Polish

- **Emoji-based art**: All characters, enemies, weapons, and pickups use colorful emoji
- **Particle effects**: Death explosions, power-up activations, and visual feedback
- **Starfield background**: Atmospheric space setting with twinkling stars
- **Screen shake**: Camera shake on boss defeats
- **Glowing effects**: Shadows and glows on all game elements
- **Smooth animations**: Rotating axes, flashing invincibility, pulsing combos

## Future Enhancements

Potential additions:
- Sound effects and background music
- More weapon types and synergies
- Additional boss varieties
- Character selection with different starting abilities
- Achievements system
- Online leaderboard
- Different biomes/environments

## Credits

Inspired by Vampire Survivors by poncle.

## License

MIT License - Feel free to use and modify as you wish!
