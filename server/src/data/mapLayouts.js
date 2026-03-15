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
  { id: "inheritance-bay",     name: "Inheritance Bay",     subtitle: "Base class hull",     taskId: "inheritance-bay",     color: "#8ecae6", glow: "rgba(142,202,230,0.22)" },
  { id: "polymorphism-lab",    name: "Polymorphism Lab",    subtitle: "Dispatch engine",     taskId: "polymorphism-lab",    color: "#80ed99", glow: "rgba(128,237,153,0.20)" },
  { id: "encapsulation-vault", name: "Encapsulation Vault", subtitle: "State security core", taskId: "encapsulation-vault", color: "#cdb4db", glow: "rgba(205,180,219,0.22)" },
];

/**
 * Build a layout where:
 *   - Two rooms sit ABOVE the spine (left and right columns).
 *   - One room sits BELOW the spine (center column).
 *
 * Spine:  y = topRoomBottom, full width
 *         rooms attach at their bottom (= spine top)
 * Bottom room attaches at its top (= spine bottom)
 */
function makeLayout(topLeft, topRight, bottom, spineY, spineH) {
  const corridor = { x: 0, y: spineY, w: 640, h: spineH };

  // Station = bottom-center of its room, 10px above room floor (inside)
  const stations = [
    {
      id: ROOM_META[0].id,
      label: ROOM_META[0].name,
      x: Math.round(topLeft.x + topLeft.w / 2),
      y: topLeft.y + topLeft.h - 10,
    },
    {
      id: ROOM_META[1].id,
      label: ROOM_META[1].name,
      x: Math.round(topRight.x + topRight.w / 2),
      y: topRight.y + topRight.h - 10,
    },
    {
      id: ROOM_META[2].id,
      label: ROOM_META[2].name,
      x: Math.round(bottom.x + bottom.w / 2),
      y: bottom.y + bottom.h - 10,
    },
  ];

  const rooms = [
    { ...ROOM_META[0], ...topLeft },
    { ...ROOM_META[1], ...topRight },
    { ...ROOM_META[2], ...bottom },
  ];

  // Walkable zones: three rooms + spine corridor
  const walkable = [
    { x: topLeft.x,  y: topLeft.y,  w: topLeft.w,  h: topLeft.h  },
    { x: topRight.x, y: topRight.y, w: topRight.w, h: topRight.h },
    { x: bottom.x,   y: bottom.y,   w: bottom.w,   h: bottom.h   },
    { x: corridor.x, y: corridor.y, w: corridor.w, h: corridor.h },
  ];

  // Player spawns in the middle of the spine
  const spawnX = 320;
  const spawnY = Math.round(spineY + spineH / 2);

  return { rooms, corridor, stations, walkable, spawnX, spawnY };
}

/** Layout A — two rooms on top, one bottom-center (original H-shape) */
function layoutA() {
  const spineY = 165;
  const spineH = 50;
  return makeLayout(
    { x: 20,  y: 15, w: ROOM_W, h: 150 },  // Inheritance: bottom = 165 = spineY
    { x: 455, y: 15, w: ROOM_W, h: 150 },  // Polymorphism: bottom = 165 = spineY
    { x: 238, y: 215, w: ROOM_W, h: ROOM_H }, // Encapsulation: top = 215 = spineY+spineH
    spineY,
    spineH
  );
}

/** Layout B — one room on top-center, two rooms on bottom */
function layoutB() {
  const spineY = 185;
  const spineH = 50;
  return makeLayout(
    { x: 238, y: 35, w: ROOM_W, h: 150 },  // Inheritance: bottom = 185 = spineY (center)
    { x: 20,  y: 235, w: ROOM_W, h: ROOM_H }, // Polymorphism: top = 235 = spineY+spineH
    { x: 455, y: 235, w: ROOM_W, h: ROOM_H }, // Encapsulation: top = 235
    spineY,
    spineH
  );
}

/** Layout C — left room top-left, right room top-right, one bottom-right */
function layoutC() {
  const spineY = 180;
  const spineH = 50;
  return makeLayout(
    { x: 20,  y: 30, w: 190, h: 150 },   // Inheritance (wider, left)
    { x: 455, y: 30, w: 165, h: 150 },  // Polymorphism (right)
    { x: 238, y: 230, w: ROOM_W, h: ROOM_H }, // Encapsulation (center-bottom)
    spineY,
    spineH
  );
}

export const MAP_LAYOUTS = [layoutA, layoutB, layoutC];

export function pickRandomLayout() {
  const fn = MAP_LAYOUTS[Math.floor(Math.random() * MAP_LAYOUTS.length)];
  return fn();
}
