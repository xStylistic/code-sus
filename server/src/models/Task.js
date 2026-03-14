export class Task {
  constructor(template) {
    Object.assign(this, template);
  }

  markCompleted(playerId) {
    this.status = "completed";
    this.completedBy = playerId;
  }
}
