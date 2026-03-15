/**
 * mapLayouts.js — Preset map configurations for Code Sus.
 *
 * Each layout has:
 *   - rooms: array of { id, name, subtitle, x, y, width, height, color, glow }
 *   - corridor: single horizontal spine { x, y, w, h } connecting all rooms
 *   - stations: per-task station coords { id, label, x, y } placed at room bottoms
 *   - spawnX, spawnY: safe player starting position (inside corridor or a room)
 *
 * Design rules:
 *   - Only ONE corridor (horizontal spine) to avoid overlap.
 *   - Rooms attach to the EXACT top or bottom edge of the corridor.
 *   - Station is at the bottom-center of its room (inside the room bounds).
 *   - All coordinates are within the 640×420 map bounds.
 */

const ROOM_W = 165;
const ROOM_H = 145;

// Task room metadata (same 3 tasks, just placed differently each layout)
const ROOM_META = [
  { id: "inheritance-bay", name: "Inheritance Bay", subtitle: "Base class hull", taskId: "inheritance-bay", color: "#8ecae6", glow: "rgba(142,202,230,0.22)" },
  { id: "polymorphism-lab", name: "Polymorphism Lab", subtitle: "Dispatch engine", taskId: "polymorphism-lab", color: "#80ed99", glow: "rgba(128,237,153,0.20)" },
  { id: "encapsulation-vault", name: "Encapsulation Vault", subtitle: "State security core", taskId: "encapsulation-vault", color: "#cdb4db", glow: "rgba(205,180,219,0.22)" },
];

/**
 * Build a layout combining rooms and corridors.
 */
function makeLayout(id, roomsConfig, corridors, spawnX, spawnY) {
  // Station = bottom-center of its room, 40px above room floor (so the 42x42px button fits inside the green)
  const stations = roomsConfig.map((config, index) => {
    return {
      id: ROOM_META[index].id,
      label: ROOM_META[index].name,
      x: Math.round(config.x + config.w / 2),
      y: config.y + config.h - 40,
    };
  });

  const rooms = roomsConfig.map((config, index) => ({
    ...ROOM_META[index],
    ...config,
  }));

  // Walkable zones: rooms + corridors
  const walkable = [
    ...roomsConfig.map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h })),
    ...corridors.map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h })),
  ];

  return { id, rooms, corridors, stations, walkable, spawnX, spawnY };
}
/** Layout A — two rooms on top, one bottom-center (original H-shape) */
function layoutA() {
  const spineY = 195;
  const spineH = 50;
  return makeLayout(
    "layoutA",
    [
      { x: 20, y: 20, w: ROOM_W, h: 175 },  // Inheritance: bottom = 195
      { x: 455, y: 20, w: ROOM_W, h: 175 },  // Polymorphism: bottom = 195
      { x: 238, y: 245, w: ROOM_W, h: 155 }, // Encapsulation: top = 245
    ],
    [{ x: 0, y: spineY, w: 640, h: spineH }],
    320, Math.round(spineY + spineH / 2) // Spawn in center spine
  );
}

/** Layout B — one room on top-center, two rooms on bottom */
function layoutB() {
  const spineY = 175;
  const spineH = 50;
  return makeLayout(
    "layoutB",
    [
      { x: 238, y: 20, w: ROOM_W, h: 155 },  // Inheritance: bottom = 175
      { x: 20, y: 225, w: ROOM_W, h: 175 }, // Polymorphism: top = 225
      { x: 455, y: 225, w: ROOM_W, h: 175 }, // Encapsulation: top = 225
    ],
    [{ x: 0, y: spineY, w: 640, h: spineH }],
    320, Math.round(spineY + spineH / 2)
  );
}

/** Layout C — left room top-left, right room top-right, one bottom-right */
function layoutC() {
  const spineY = 190;
  const spineH = 50;
  return makeLayout(
    "layoutC",
    [
      { x: 20, y: 25, w: 190, h: 165 },   // Inheritance
      { x: 455, y: 25, w: 165, h: 165 },  // Polymorphism
      { x: 238, y: 240, w: ROOM_W, h: 160 }, // Encapsulation
    ],
    [{ x: 0, y: spineY, w: 640, h: spineH }],
    320, Math.round(spineY + spineH / 2)
  );
}

/** Layout D — Vertical central spine */
function layoutD() {
  const spineX = 295;
  const spineW = 50;
  return makeLayout(
    "layoutD",
    [
      { x: 20, y: 60, w: 275, h: ROOM_H }, // Left
      { x: 345, y: 60, w: 275, h: ROOM_H }, // Right
      { x: 238, y: 255, w: ROOM_W, h: 145 }, // Center-bottom
    ],
    [
      { x: spineX, y: 40, w: spineW, h: 360 }, // Main vertical spine
    ],
    spineX + spineW / 2, 80 // Spawn near top of spine
  );
}

/** Layout E — Ring shape (perimeter hallway) */
function layoutE() {
  return makeLayout(
    "layoutE",
    [
      { x: 40, y: 50, w: 200, h: 130 }, // Top Left
      { x: 400, y: 50, w: 200, h: 130 }, // Top Right
      { x: 220, y: 250, w: 200, h: 130 }, // Bottom Center
    ],
    [
      { x: 20, y: 20, w: 600, h: 40 }, // Top edge
      { x: 20, y: 360, w: 600, h: 40 }, // Bottom edge
      { x: 20, y: 60, w: 40, h: 300 }, // Left edge
      { x: 580, y: 60, w: 40, h: 300 }, // Right edge
      { x: 240, y: 60, w: 40, h: 190 }, // Central connector down
    ],
    80, 40 // Spawn top left corridor
  );
}

/** Layout F — Cross shape (four arms, rooms in corners) */
function layoutF() {
  return makeLayout(
    "layoutF",
    [
      { x: 30, y: 30, w: 180, h: 140 }, // Top Left
      { x: 430, y: 30, w: 180, h: 140 }, // Top Right
      { x: 30, y: 250, w: 180, h: 140 }, // Bottom Left
    ], // Room metadata has 3 elements, we only place 3 rooms even though cross has 4 corners
    [
      { x: 0, y: 170, w: 640, h: 80 }, // Thick horizontal
      { x: 210, y: 0, w: 220, h: 420 }, // Thick vertical
    ],
    320, 210 // Spawn dead center
  );
}

export const MAP_LAYOUTS = [layoutA, layoutB, layoutC, layoutD, layoutE, layoutF];

export function pickRandomLayout() {
  const fn = MAP_LAYOUTS[Math.floor(Math.random() * MAP_LAYOUTS.length)];
  return fn();
}
