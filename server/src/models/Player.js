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
    this.isAlive = true;
    this.completedTasks = [];
  }

  resetForMatch() {
    this.isAlive = true;
    this.completedTasks = [];
    this.x = 80 + Math.round(Math.random() * 80);
    this.y = 80 + Math.round(Math.random() * 80);
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
      isAlive: this.isAlive,
      completedTasks: this.completedTasks
    };
  }
}
