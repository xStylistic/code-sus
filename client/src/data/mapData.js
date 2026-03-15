// Map is 640 × 420 pixels (matches MAP_BOUNDS in GameRoom.js)
//
// Layout (to scale):
//
//  [Inheritance Bay]                 [Polymorphism Lab]
//  x:20 y:15 w:175 h:155            x:445 y:15 w:175 h:155
//       |                                  |
//  Left vert (x:82,y:170,w:50,h:50)  Right vert (x:507,y:170,w:50,h:50)
//       |                                  |
//  +=========== Center horiz ==============+
//    x:82 y:220 w:475 h:45
//                 |
//           [Encapsulation Vault]
//            x:235 y:265 w:170 h:145
//
// Rooms and corridors touch at their edges but do NOT overlap.
// Player starting zone (x:80-160, y:80-160) is inside Inheritance Bay.

export const MAP_ROOMS = [
  {
    id: "inheritance-bay",
    name: "Inheritance Bay",
    subtitle: "Base class hull",
    x: 20,
    y: 15,
    width: 175,
    height: 155,
    color: "#8ecae6",
    glow: "rgba(142, 202, 230, 0.22)"
  },
  {
    id: "polymorphism-lab",
    name: "Polymorphism Lab",
    subtitle: "Dispatch engine",
    x: 445,
    y: 15,
    width: 175,
    height: 155,
    color: "#80ed99",
    glow: "rgba(128, 237, 153, 0.2)"
  },
  {
    id: "encapsulation-vault",
    name: "Encapsulation Vault",
    subtitle: "State security core",
    x: 235,
    y: 265,
    width: 170,
    height: 145,
    color: "#cdb4db",
    glow: "rgba(205, 180, 219, 0.22)"
  }
];

// Walkable zones — rooms + corridors that connect them.
// These are rendered as corridor visuals and also used server-side for collision.
// IMPORTANT: must stay in sync with WALKABLE_ZONES in server/src/models/GameRoom.js
//
// Zones are non-overlapping; corridors connect at the exact bottom/top edge of rooms:
//   Inheritance Bay bottom  = y 170  → Left vert starts  at y 170
//   Polymorphism Lab bottom = y 170  → Right vert starts at y 170
//   Left/Right vert bottom  = y 220  → Center horiz starts at y 220
//   Center horiz bottom     = y 265  → Encapsulation Vault starts at y 265
//
// This means there is no pixel overlap — zones only share boundary edges.
export const MAP_WALKABLE = [
  // Rooms (needed for rendering corridors only; rooms are also walkable on the server)
  // Left vertical corridor — connects Inheritance Bay bottom to center horizontal
  { x: 82,  y: 170, w: 50,  h: 50  },
  // Right vertical corridor — connects Polymorphism Lab bottom to center horizontal
  { x: 507, y: 170, w: 50,  h: 50  },
  // Center horizontal corridor — connects both verticals and touches Vault top
  { x: 82,  y: 220, w: 475, h: 45  },
];
