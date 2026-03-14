export class Sabotage {
  constructor({ id, type, duration = 20000 }) {
    this.id = id;
    this.type = type;
    this.active = true;
    this.duration = duration;
    this.startedAt = Date.now();
  }

  serialize() {
    return {
      id: this.id,
      type: this.type,
      active: this.active,
      duration: this.duration,
      startedAt: this.startedAt
    };
  }
}
