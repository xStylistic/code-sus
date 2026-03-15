export class VoteManager {
  constructor(playerIds) {
    this.eligibleVoters = new Set(playerIds);
    this.votes = new Map();
  }

  removeVoter(voterId) {
    this.eligibleVoters.delete(voterId);
    this.votes.delete(voterId);
  }

  submitVote(voterId, targetId) {
    if (!this.eligibleVoters.has(voterId) || this.votes.has(voterId)) {
      return false;
    }

    this.votes.set(voterId, targetId ?? "skip");
    return true;
  }

  allVotesIn() {
    return this.votes.size === this.eligibleVoters.size;
  }

  tally() {
    const totals = {};

    for (const targetId of this.votes.values()) {
      totals[targetId] = (totals[targetId] || 0) + 1;
    }

    const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (ranked.length === 0) {
      return { eliminatedId: null, totals };
    }

    const [topId, topVotes] = ranked[0];
    const isTie = ranked.length > 1 && ranked[1][1] === topVotes;
    if (isTie || topId === "skip") {
      return { eliminatedId: null, totals };
    }

    return { eliminatedId: topId, totals };
  }

  serialize() {
    return Object.fromEntries(this.votes.entries());
  }
}
