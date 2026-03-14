# Code Sus

`Code Sus` is a multiplayer social deduction MVP inspired by Among Us, but themed around object-oriented programming. Players move around a shared ship, solve short coding-focused OOP tasks, and try to catch the imposter who sabotages systems by injecting bugs.

## Folder Structure

```text
code-sus/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/
│       │   ├── EndScreen.jsx
│       │   ├── GameBoard.jsx
│       │   ├── LobbyScreen.jsx
│       │   ├── MeetingModal.jsx
│       │   ├── RoleRevealModal.jsx
│       │   └── TaskModal.jsx
│       ├── data/
│       │   ├── languages.js
│       │   └── mapData.js
│       └── styles/
│           └── global.css
├── server/
│   ├── package.json
│   └── src/
│       ├── data/
│       │   ├── languages.js
│       │   └── taskTemplates.js
│       ├── game/
│       │   └── taskRunner.js
│       ├── index.js
│       └── models/
│           ├── GameRoom.js
│           ├── MeetingManager.js
│           ├── Player.js
│           ├── Role.js
│           ├── Sabotage.js
│           ├── Task.js
│           └── VoteManager.js
└── package.json
```

## Gameplay MVP

- 3 to 8 players can create or join a room with a room code.
- The host starts the match once everyone is ready.
- The server assigns one imposter and keeps the game state authoritative.
- The host picks one shared coding language in the lobby: `JavaScript`, `Python`, `Java`, `C++`, or `C`.
- Codemates complete 3 real OOP tasks in that shared language: inheritance, polymorphism, and encapsulation.
- The imposter can trigger `blackout` and `code_corruption`.
- Any alive player can call a meeting and submit one vote.
- The match ends when all tasks are complete, the imposter is eliminated, or sabotage pressure reaches 4 / crew parity is reached.
- When a match starts, each player gets a role reveal modal: `YOU'RE A CODEMATE` or `YOU'RE THE IMPOSTER`.
- Task code is shared per room, so players can see teammates editing the same code live.
- Players who are voted out become spectators and can no longer act.

## Multiplayer Flow

- `create_room` and `join_room` create a `GameRoom` and add `Player` instances.
- `player_ready` and `start_game` manage the lobby flow.
- `set_language` lets only the host choose the room's shared coding language before the match starts.
- `player_move` updates player positions on the server, then broadcasts `sync_game_state`.
- `interact_task` asks the server for the current coding prompt and starter code near a station.
- `update_task_code` broadcasts live code edits so all open task windows stay synchronized.
- `run_task_code` runs visible checks on the server with a sandboxed validator.
- `submit_task` runs hidden validation server-side and updates shared progress only if the code passes.
- `trigger_sabotage` activates blackout or task corruption on the server.
- `call_meeting` and `submit_vote` run the meeting and voting flow.
- `sync_game_state` is emitted to each socket with viewer-safe role data.

## Sample OOP Tasks

- `Inheritance Bay`: repair the base class hull by implementing inheritance correctly.
- `Polymorphism Lab`: restore the dispatch engine with overridden area behavior.
- `Encapsulation Vault`: lock the state core and prevent unsafe access.

The task definitions live in [server/src/data/taskTemplates.js](/Users/bonnychen/Documents/code-sus/server/src/data/taskTemplates.js).
The server-side task validator lives in [server/src/game/taskRunner.js](/Users/bonnychen/Documents/code-sus/server/src/game/taskRunner.js).

## Local Setup

1. Install dependencies from the repo root:

   ```bash
   npm install
   ```

2. Start both apps:

   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173`.

4. Run multiple browser tabs or windows to simulate 3 to 8 players.

## Testing Across Devices On One Wi-Fi Network

1. Start the app with:

   ```bash
   npm run dev
   ```

2. Find your laptop's local IP address, for example `192.168.1.25`.

3. Open `http://YOUR_LOCAL_IP:5173` on each device on the same Wi-Fi network.

4. The client automatically connects to `http://YOUR_LOCAL_IP:3001`, so no extra config is needed for LAN play.

If you later deploy the frontend and backend to different hosts, set `VITE_SERVER_URL` for the client build.

## Notes

- Frontend: React + Vite.
- Backend: Node.js + Express + Socket.IO.
- JavaScript tasks are executed server-side in a Node `vm` sandbox with short timeouts.
- Python, Java, C++, and C tasks use language-specific structural validation for this MVP.
- Blackout lasts 10 seconds and also darkens the task work area while it is active.
- The map is a single shared 2D board with labeled OOP-themed rooms.
- The server is authoritative for room state, movement, tasks, sabotages, meetings, votes, and win conditions.
