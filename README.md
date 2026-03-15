# Code Sus

A multiplayer social deduction game where players solve coding tasks on a shared ship while trying to find the hacker among them. Like the popular 2020 game Among Us, but with code.

3-8 players join a room, get assigned roles (Codemate or Hacker), and race to either complete all coding tasks or figure out who's been sabotaging the codebase.

## Getting Started

**Prerequisites:** Node.js 18+, Python 3.10+

### 1. Set up the AI agent service

```bash
cd agent
pip/pip3 install -r requirements.txt
```


### 2. Install Node dependencies

From the project root:

```bash
npm install
```

### 3. Run everything

```bash
npm run dev:all
```

This starts all three services at once:
- **Client** at `http://localhost:5173`
- **Server** at `http://localhost:3001`
- **Agent** at `http://localhost:5001`

Open multiple browser tabs to simulate players. For multi player play, open `http://YOUR_LOCAL_IP:5173` on other devices connected to the same network.

> The game works without the agent service running — AI features just won't be available.

## How It Works

**Lobby** — The host creates a room and shares the room code. Players join, pick a codename and avatar color, and the host picks a shared programming language (JavaScript, Python, Java, C++, or C). Once 3+ players are ready, the host launches the match.

**Gameplay** — Players move around a 2D ship map with OOP-themed rooms (Inheritance Bay, Polymorphism Lab, Encapsulation Vault). Codemates work on real coding tasks at stations — the code editor is shared, so you can see teammates typing in real time with live cursors. The Hacker gets a fake task view and can trigger sabotages (blackout, code corruption) to slow things down.

**Meetings** — Any alive player can call an emergency meeting. Everyone discusses and votes to eject someone. There's an optional AI analysis button that reads player behavior and gives discussion prompts.

**Win conditions:**
- Codemates win by completing all tasks
- Codemates win by voting out the Hacker
- Hacker wins if timer runs out before all tasks are completed

## AI Features (Powered by Gemini)

The agent service uses [Railtracks](https://railtownai.github.io/railtracks/) to run four AI agents:

- **Task Generator** — Creates unique OOP coding challenges each match with starter code, solutions, and validation checks
- **Imposter Advisor** — Gives the Hacker AI-generated sabotage code that looks real but uses bad practices
- **Code Verifier** — Automatically reviews submissions and gives feedback on correctness and code quality
- **Meeting Analyst** — Analyzes player behavior during meetings and suggests discussion prompts 

After the match ends, players see an AI generated code review summary with issues and fixes for each task they submitted, plus the optimal solutions revealed.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite |
| Backend | Node.js, Express, Socket.IO |
| AI Agent | Python, FastAPI, Railtracks, Gemini 2.5 Flash |

## Local Network Play

1. Start with `npm run dev:all`
2. Find your machine's local IP (e.g. `192.168.1.25`)
3. Other devices on the same Wi-Fi open `http://YOUR_LOCAL_IP:5173`
4. The client auto connects to the server on the same host and yall can start playing!
