import { VoteManager } from "./VoteManager.js";

export class MeetingManager {
  constructor(playerIds, durationMs = 30000) {
    this.startedAt = Date.now();
    this.endsAt = this.startedAt + durationMs;
    this.voteManager = new VoteManager(playerIds);
    this.result = null;
  }

  serialize() {
    return {
      startedAt: this.startedAt,
      endsAt: this.endsAt,
      votes: this.voteManager.serialize(),
      result: this.result
    };
  }
}
