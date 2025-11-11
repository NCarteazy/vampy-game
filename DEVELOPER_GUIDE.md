# Vampy - Developer Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Core Systems](#core-systems)
4. [File Structure](#file-structure)
5. [Class Reference](#class-reference)
6. [Data Flow](#data-flow)
7. [Adding New Features](#adding-new-features)

---

## Project Overview

Vampy is a Vampire Survivors-style auto-shooter with roguelite elements and meta-progression. Players survive waves of enemies, collect loot, and upgrade their village between runs.

**Tech Stack:**
- Vanilla JavaScript (ES6+)
- HTML5 Canvas for rendering
- LocalStorage for persistence
- No external dependencies

**Core Gameplay Loop:**
1. Start run from village
2. Auto-attack enemies while moving with WASD
3. Level up and choose upgrades
4. Collect drops (XP, resources, equipment)
5. Die or survive, return to village with gold
6. Upgrade village buildings for permanent bonuses
7. Equip loot for stat bonuses
8. Repeat with stronger character

---

## Architecture

### Game Loop Structure
```
main.js (initialization)
  └─> game.js (game loop)
       ├─> player.js (update player, weapons)
       ├─> enemy.js (update enemies, spawning)
       ├─> weapon.js (projectile updates, collisions)
       └─> items.js (drop updates, collection)
```

### Rendering Pipeline
```
Game.draw()
  ├─> Draw grid background
  ├─> Draw pickups (XP orbs)
  ├─> Draw drops (items, equipment)
  ├─> EnemySpawner.draw()
  └─> Player.draw()
       └─> Weapon.draw() (projectiles)
```

### Persistence Layer
All game state persists via LocalStorage:
- `vampy_village` - Village gold, building levels, best time
- `vampy_inventory` - 40-slot item inventory
- `vampy_equipment` - Equipped items in 8 slots

---

## Core Systems

### 1. Combat System

**Player (player.js:3-225)**
- Auto-move with WASD/Arrow keys
- Weapons auto-fire at nearest enemy
- HP regeneration from equipment
- Applies village + equipment bonuses

**Enemies (enemy.js:3-139)**
- 4 types: basic, fast, tank, swarm
- Elite variants (3x HP, golden glow, better loot)
- Difficulty scales over time
- Collision detection with player

**Weapons (weapon.js:3-188)**
- 5 weapon types: dagger, fireball, lightning, axe, holy water
- Projectile-based combat
- Scales with equipment stats:
  - Damage: `baseDamage * player.damageBonus`
  - Cooldown: `baseCooldown / attackSpeed * (1 - CDR)`
  - Range: `baseRange + bonusRange`
  - Pierce: `basePierce + bonusPierce`
- Critical strikes with visual feedback
- Lifesteal healing on hit

**Damage Calculation:**
```javascript
let damage = weaponBaseDamage * (1 + levelBonus) * player.damageBonus;
if (isCrit) damage *= player.critMultiplier;
enemy.takeDamage(damage);
player.heal(damage * player.lifestealPercent / 100);
```

### 2. Equipment System (PoE-Style)

**Rarity Tiers (equipment.js:4-9)**
- **Normal** (60%): White text, base stats only
- **Magic** (25%): Blue text, 1-2 modifiers
- **Rare** (13%): Yellow text, 4-6 modifiers
- **Legendary** (2%): Orange text, 6 modifiers

**Elite enemies** boost rarity:
- Normal: 20%, Magic: 30%, Rare: 40%, Legendary: 10%

**Modifier System:**
- **Prefixes** (offensive): Brutal, Savage, Merciless, etc.
- **Suffixes** (utility): of Renewal, of Fortune, of the Vampire, etc.
- Item level gates access to better modifiers
- Stats roll randomly within ranges

**Stat Types (15 total):**
```javascript
damagePercent       // Increase all damage
maxHpFlat           // Flat HP bonus
maxHpPercent        // Percentage HP bonus
attackSpeedPercent  // Faster weapon cooldowns
moveSpeedFlat       // Movement speed
critChance          // % chance to crit
critMultiplier      // Crit damage multiplier
hpRegenPerSec       // Passive healing
xpGainPercent       // Faster leveling
dropChancePercent   // Better drop rates
goldGainPercent     // More gold from enemies
lifestealPercent    // Heal on damage dealt
cooldownReductionPercent  // Reduce weapon cooldowns
rangeFlat           // Projectile range
pierceFlat          // Projectile pierce count
```

**Equipment Bases (equipment.js:77-114):**
- 4 weapon tiers (rusty sword → vampiric greatsword)
- 3 helmet tiers
- 4 chest tiers
- 3 gloves tiers
- 3 boots tiers
- 3 ring types (2 slots)
- 3 amulet types

**Equipment Generation:**
```javascript
// Elite enemy dies
const itemLevel = Math.floor(difficulty);
const rarity = EquipmentGenerator.rollEliteRarity();
const equipment = EquipmentGenerator.generateRandomEquipment(itemLevel, rarity);
```

### 3. Inventory System

**Slot-Based (inventory.js:79-303)**
- 40 slots in 8x5 grid
- Auto-stacking up to maxStack
- Drag-and-drop reordering
- LocalStorage persistence
- Resource summary view

**Item Types (items.js:7-47):**
- **Resources**: gold, gems, wood, stone, iron, essence
- **Consumables**: health_potion, xp_boost
- **Special**: vampire_ring, lucky_coin

**Drop Tables (items.js:50-79):**
```javascript
DROP_TABLES = {
  basic: [{ itemId: 'gold', chance: 0.3, minAmount: 1, maxAmount: 3 }],
  tank: [{ itemId: 'stone', chance: 0.4, minAmount: 2, maxAmount: 5 }],
  elite: [{ itemId: 'gems', chance: 1.0, minAmount: 5, maxAmount: 15 }]
}
```

### 4. Village System

**Buildings (village.js:6-11):**
```javascript
armory: {
  level: 0,
  baseCost: 50,
  effect: '+10% damage per level'
}
temple: {
  level: 0,
  baseCost: 75,
  effect: '+10% max HP per level'
}
academy: {
  level: 0,
  baseCost: 100,
  effect: '+15% XP gain per level'
}
workshop: {
  level: 0,
  baseCost: 60,
  effect: '+10% attack speed per level'
}
```

**Cost Scaling:**
```javascript
cost = baseCost * Math.pow(1.5, level)
// Level 0→1: 50 gold
// Level 1→2: 75 gold
// Level 2→3: 113 gold
// etc.
```

**Bonus Application:**
```javascript
player.damageBonus = (1 + armoryLevel * 0.1) * (1 + equipmentDamagePercent / 100);
// Multiplicative stacking
```

### 5. Progression Systems

**Player Leveling (player.js:152-169):**
- Gain XP from enemy kills
- XP requirement: `Math.floor(baseXP * 1.5^level)`
- Level up → Choose 1 of 3 random upgrades
- Heal 20% HP on level up

**Upgrade Types (game.js:36-44):**
- **Weapons**: Add new weapon or upgrade existing
- **Stats**: +20 Max HP, +30 Speed, +15% Damage

**Difficulty Scaling (enemy.js:167-200):**
```javascript
// Every 10 seconds:
difficulty += 0.1
spawnInterval *= 0.98  // Faster spawns
enemy.hp *= (1 + (difficulty - 1) * 0.3)

// Elite spawn chance:
eliteChance = min(0.05 + (difficulty - 1) * 0.02, 0.15)
```

---

## File Structure

```
vampy-game/
├── index.html          # Main HTML, screen structure
├── style.css           # All styling, grid layouts, animations
├── main.js             # Initialization, UI event handlers
├── game.js             # Core game loop, state management
├── player.js           # Player class, movement, stats
├── enemy.js            # Enemy + EnemySpawner classes
├── weapon.js           # Weapon class, projectiles
├── equipment.js        # Equipment, modifiers, generation
├── items.js            # Item definitions, drop system
├── inventory.js        # Slot-based inventory
├── village.js          # Village buildings, persistence
└── utils.js            # Helper functions (distance, random, etc.)
```

---

## Class Reference

### Game (game.js:3-374)

**Properties:**
- `canvas`, `ctx` - Rendering context
- `player` - Player instance
- `enemySpawner` - EnemySpawner instance
- `drops[]` - Active drops (items + equipment)
- `pickups[]` - XP/gold orbs (legacy system)
- `time`, `kills`, `gold` - Run statistics
- `running`, `paused` - Game state

**Key Methods:**
```javascript
start()                    // Initialize new run
gameLoop()                 // Main update/render loop at 60fps
update(dt)                 // Update all game systems
draw()                     // Render everything
showLevelUpScreen()        // Pause and show upgrade choices
gameOver()                 // End run, transfer gold to village
```

### Player (player.js:3-225)

**Properties:**
- `x`, `y`, `size`, `speed` - Position and movement
- `hp`, `maxHp` - Health
- `level`, `xp`, `xpToNextLevel` - Leveling
- `weapons[]` - Array of Weapon instances
- `damageBonus`, `attackSpeedBonus` - Multiplicative bonuses
- `critChance`, `critMultiplier`, `lifestealPercent` - Combat stats
- `bonusRange`, `bonusPierce` - Weapon modifiers

**Key Methods:**
```javascript
applyVillageBonuses(village)      // Apply building bonuses
applyEquipmentBonuses(equipment)  // Apply equipment stats
update(dt, keys, canvas)          // Handle movement
updateWeapons(dt, enemies)        // Update all weapons
takeDamage(amount)                // Receive damage
heal(amount)                      // Restore HP
gainXP(amount)                    // Award XP, check level up
addWeapon(type)                   // Add or upgrade weapon
```

### Enemy (enemy.js:3-139)

**Properties:**
- `x`, `y` - Position
- `type` - 'basic', 'fast', 'tank', 'swarm'
- `isElite` - Elite status (golden, 3x HP, better loot)
- `hp`, `maxHp`, `damage`, `speed` - Stats
- `xpValue`, `goldValue` - Rewards

**Key Methods:**
```javascript
constructor(x, y, type, isElite)
getConfig()           // Return stat template
update(dt, player)    // Move toward player, collision
takeDamage(amount)    // Receive damage
draw(ctx)             // Render with HP bar, elite effects
```

### EnemySpawner (enemy.js:141-216)

**Properties:**
- `enemies[]` - Active enemies
- `difficulty` - Difficulty multiplier
- `spawnInterval` - Seconds between spawns

**Key Methods:**
```javascript
update(dt, player, canvas)    // Spawn and update enemies
spawnEnemy(player, canvas)    // Create enemy offscreen
getEnemies()                  // Return enemy array
```

### Weapon (weapon.js:3-188)

**Properties:**
- `type` - 'dagger', 'fireball', 'lightning', 'axe', 'holy'
- `level` - Weapon level (from upgrades)
- `projectiles[]` - Active projectiles
- `cooldown` - Cooldown timer

**Key Methods:**
```javascript
getDamage(player)              // Calculate damage with bonuses
getCooldownTime(player)        // Calculate cooldown with bonuses
rollCritical(player)           // Check for crit
applyLifesteal(player, damage) // Heal from lifesteal
update(dt, player, enemies)    // Update projectiles, shoot
shoot(player, target)          // Fire new projectile
draw(ctx)                      // Render projectiles (yellow if crit)
```

### Equipment (equipment.js:117-320)

**Properties:**
- `baseId` - Base type (e.g., 'steel_longsword')
- `base` - Base definition object
- `rarity` - 'normal', 'magic', 'rare', 'legendary'
- `itemLevel` - Item level (gates modifier tiers)
- `slot` - 'weapon', 'helmet', 'chest', etc.
- `modifiers[]` - Array of rolled modifiers
- `totalStats` - Calculated stat totals
- `name` - Generated name

**Key Methods:**
```javascript
generateModifiers()           // Roll random mods based on rarity
calculateTotalStats()         // Sum base + mod stats
generateName()                // Create name from mods/fantasy
getStatDescription()          // Format stats for tooltip
toJSON() / fromJSON(data)     // Serialization
```

### EquipmentLoadout (equipment.js:360-447)

**Properties:**
- `slots{}` - 8 equipment slots

**Key Methods:**
```javascript
equipItem(equipment)          // Equip item, return old
unequipSlot(slotName)         // Remove item
getTotalStats()               // Sum all equipped stats
saveToStorage()               // Persist to localStorage
loadFromStorage()             // Load from localStorage
```

### Inventory (inventory.js:79-303)

**Properties:**
- `slots[]` - Array of 40 InventorySlot instances
- `slotCount` - Number of slots (40)

**Key Methods:**
```javascript
addItem(itemId, amount)       // Add with auto-stacking
removeItem(itemId, amount)    // Remove items
getItemCount(itemId)          // Count total in inventory
moveSlot(from, to)            // Drag-and-drop
getResourceSummary()          // Summarize resources for UI
saveToStorage()               // Persist to localStorage
```

### Village (village.js:3-78)

**Properties:**
- `gold` - Village gold balance
- `buildings{}` - Building levels
- `bestTime` - Best survival time

**Key Methods:**
```javascript
getCost(buildingName)         // Calculate upgrade cost
canBuild(buildingName)        // Check affordability
build(buildingName)           // Upgrade building
addGold(amount)               // Award gold after run
updateBestTime(time)          // Track best time
save() / load()               // Persistence
```

---

## Data Flow

### Run Start
```
User clicks "Start Run"
  → main.js: switchScreen() to game-screen
  → game.js: game.start()
      → Create new Player(x, y)
      → player.applyVillageBonuses(village)
      → player.applyEquipmentBonuses(playerEquipment)
      → Create new EnemySpawner()
      → Start gameLoop()
```

### Gameplay Frame (60 FPS)
```
gameLoop()
  → dt = deltaTime
  → update(dt)
      → player.update(dt, keys, canvas)  // Movement
      → enemySpawner.update(dt, player, canvas)  // Spawn/move enemies
      → player.updateWeapons(dt, enemies)  // Shoot/hit
          → weapon.update(dt, player, enemies)
              → Calculate damage with player stats
              → Roll for crit
              → Apply lifesteal
              → Check pierce/range bonuses
      → Check for dead enemies
          → Drop XP orb
          → If elite: drop equipment
          → Else: roll drop table for items
      → Update pickups (attract to player)
      → Update drops (attract to player)
          → On collect: add to inventory or equipment list
      → updateUI() (HP/XP bars)
      → Check game over
  → draw()
      → Draw background grid
      → Draw pickups/drops
      → enemySpawner.draw()
      → player.draw()
          → weapons.draw()
```

### Equipment Drop Flow
```
Elite enemy dies
  → game.js: Calculate itemLevel from difficulty
  → EquipmentGenerator.generateRandomEquipment(itemLevel, eliteRarity)
      → Pick random base
      → Roll rarity (boosted for elites)
      → new Equipment(baseId, rarity, itemLevel)
          → generateModifiers()
              → Filter available mods by itemLevel
              → Randomly select prefix/suffix
              → Roll stat values
          → calculateTotalStats()
          → generateName()
  → Create EquipmentDrop(x, y, equipment)
  → Add to game.drops[]

Player collects drop
  → drop.update(dt, player)
      → Attract to player if in range
      → Check collection distance
  → game.js: Detect collection
      → window.collectedEquipment.push(equipment)
      → Remove from game.drops[]

Player opens Equipment screen
  → main.js: updateEquipmentUI()
      → Display in collected list
  → Player clicks item
      → equipItem(index)
          → equipment.equipItem(item)
          → Update window.collectedEquipment
          → saveToStorage()

Next run starts
  → player.applyEquipmentBonuses(playerEquipment)
      → Read equipment.getTotalStats()
      → Apply to player properties
```

---

## Adding New Features

### Adding a New Weapon Type

1. **Define config in weapon.js:**
```javascript
// weapon.js: getConfig()
crossbow: {
  name: 'Crossbow',
  damage: 40,
  speed: 500,
  cooldownTime: 2.5,
  range: 600,
  pierce: 3,
  projectileSize: 12,
  color: '#8b4513',
  description: 'Powerful crossbow bolts'
}
```

2. **Add to upgrade pool:**
```javascript
// game.js: availableUpgrades
{ type: 'weapon', id: 'crossbow', name: 'Crossbow', description: 'Powerful crossbow bolts' }
```

3. **Test:** Level up in-game and select the new weapon.

### Adding a New Equipment Modifier

1. **Add to PREFIX or SUFFIX modifiers:**
```javascript
// equipment.js: PREFIX_MODIFIERS
explosive: {
  name: 'Explosive',
  stats: { damagePercent: [20, 35], rangeFlat: [50, 100] },
  minItemLevel: 8
}
```

2. **Handle new stat in player.js:**
```javascript
// player.js: applyEquipmentBonuses()
if (stats.newStat) {
  this.newStat = stats.newStat;
}
```

3. **Use stat in weapon.js:**
```javascript
// weapon.js: update()
const explosionRadius = player.newStat || 0;
// Apply explosion logic
```

4. **Add to stat descriptions:**
```javascript
// equipment.js: formatStatLine()
newStat: `+${value} New Effect`
```

### Adding a New Building

1. **Define in village.js:**
```javascript
// village.js: constructor
marketplace: {
  level: 0,
  baseCost: 150,
  effect: 'drop_chance'
}
```

2. **Apply bonus in player.js:**
```javascript
// player.js: applyVillageBonuses()
const marketplaceLevel = village.buildings.marketplace.level;
this.dropChanceBonus = 1 + marketplaceLevel * 0.1;
```

3. **Add UI in index.html:**
```html
<div class="building-card" data-building="marketplace">
  <h3>Marketplace</h3>
  <p>+10% Drop Chance</p>
  <p>Cost: <span class="cost">150</span> Gold</p>
  <button class="build-btn">Build</button>
  <p class="level">Level: <span>0</span></p>
</div>
```

4. **Event handler is automatic** - main.js iterates all `.building-card` elements.

---

## Common Patterns

### LocalStorage Persistence
```javascript
// Save
localStorage.setItem('key', JSON.stringify(data));

// Load
const saved = localStorage.getItem('key');
if (saved) {
  const data = JSON.parse(saved);
  // Apply data
}
```

### Collision Detection
```javascript
function circleCollision(x1, y1, r1, x2, y2, r2) {
  return distance(x1, y1, x2, y2) < r1 + r2;
}
```

### Random Weighted Selection
```javascript
const roll = Math.random() * 100;
if (roll < 60) return 'common';
if (roll < 85) return 'uncommon';
return 'rare';
```

### Stat Stacking
```javascript
// Multiplicative
finalDamage = baseDamage * villageBonuses * equipmentBonuses;

// Additive
finalRange = baseRange + equipmentRange;
```

---

## Performance Considerations

1. **Object Pooling**: Create/destroy projectiles and enemies frequently. Consider pooling for optimization.

2. **Collision Checks**: O(n*m) for n projectiles × m enemies. Spatial partitioning could help at high enemy counts.

3. **LocalStorage**: Synchronous API. Current usage is fine, but avoid calling every frame.

4. **Canvas Rendering**: ~1000 draw calls per frame. Use layered canvases or WebGL for more complex scenes.

---

## Debug Tools

**In-browser console:**
```javascript
// Access global instances
game.player.maxHp = 9999
game.player.hp = 9999
game.player.damageBonus = 100
game.enemySpawner.difficulty = 10

// Add test items
playerInventory.addTestItems()

// Generate legendary equipment
const legendary = EquipmentGenerator.generateRandomEquipment(15, 'legendary')
window.collectedEquipment.push(legendary)
updateEquipmentUI()

// Reset progression
village.reset()
localStorage.clear()
```

---

## Known Limitations

1. **No multiplayer** - Single player only
2. **No audio** - Sound system not implemented
3. **No saving mid-run** - Runs reset on page refresh
4. **Fixed canvas size** - Responsive but not scalable
5. **No accessibility features** - Keyboard only, no screen reader support

---

## Future Enhancement Ideas

- **More enemy types** (boss enemies, special attacks)
- **Weapon combos** (synergies between weapon types)
- **Equipment sets** (bonus for wearing matching gear)
- **Procedural maps** (different biomes, obstacles)
- **Achievements** (unlock system)
- **Leaderboards** (track high scores)
- **More building types** (unlock new mechanics)
- **Item crafting** (combine resources to create equipment)
