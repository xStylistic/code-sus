import { Role } from "./Role.js";
import { normalizeLanguage } from "../data/languages.js";

export class Player {
  constructor({ id, name, isHost = false, preferredLanguage = "javascript" }) {
    this.id = id;
    this.name = name;
    this.isHost = isHost;
    this.isReady = false;
    this.preferredLanguage = normalizeLanguage(preferredLanguage);
    this.role = Role.CODEMATE;
    this.x = 80 + Math.round(Math.random() * 80);
    this.y = 80 + Math.round(Math.random() * 80);
    this.color = "purple";
    this.isAlive = true;
    this.completedTasks = [];
  }

  resetForMatch(spawnX = 320, spawnY = 190) {
    this.isAlive = true;
    this.completedTasks = [];
    // Spread players slightly around the spawn point
    this.x = spawnX + Math.round((Math.random() - 0.5) * 40);
    this.y = spawnY + Math.round((Math.random() - 0.5) * 20);
  }

  setPreferredLanguage(language) {
    this.preferredLanguage = normalizeLanguage(language);
  }

  serialize({ revealRole = false } = {}) {
    return {
      id: this.id,
      name: this.name,
      isHost: this.isHost,
      isReady: this.isReady,
      preferredLanguage: this.preferredLanguage,
      role: revealRole ? this.role : null,
      x: this.x,
      y: this.y,
      color: this.color,
      isAlive: this.isAlive,
      completedTasks: this.completedTasks
    };
  }
}
