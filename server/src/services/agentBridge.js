/**
 * Agent Bridge — HTTP client to call the Python Railtracks agent service.
 *
 * The agent service runs on port 5001 and provides AI-powered features:
 *   - Task generation (varied OOP tasks each game)
 *   - Imposter hints (sabotage code suggestions)
 *   - Code verification (AI-powered code review)
 *   - Meeting insights (behavioral analysis)
 *
 * All calls gracefully degrade — if the agent service is down, the game
 * continues with hardcoded tasks and no AI features.
 */

const AGENT_URL = process.env.AGENT_URL || "http://localhost:5001";
const TIMEOUT_MS = 15000;

async function callAgent(endpoint, body) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${AGENT_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { ok: false, error: `Agent returned ${response.status}` };
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      return { ok: false, error: "Agent request timed out" };
    }
    return { ok: false, error: `Agent unavailable: ${error.message}` };
  }
}

/**
 * Generate an AI-powered OOP coding task.
 * Falls back gracefully if agent is unavailable.
 */
export async function generateTask(taskType, language) {
  return callAgent("/api/generate-task", {
    task_type: taskType,
    language
  });
}

/**
 * Get imposter sabotage suggestions for a task.
 * Returns 2-3 code hints that look plausible but are subtly bad.
 */
export async function getImposterHints(taskType, language, currentCode, prompt) {
  return callAgent("/api/imposter-hints", {
    task_type: taskType,
    language,
    current_code: currentCode,
    prompt
  });
}

/**
 * AI-powered code verification.
 * Supplements the existing static validation in taskRunner.js.
 */
export async function verifyCode(taskType, language, code, taskPrompt) {
  return callAgent("/api/verify-code", {
    task_type: taskType,
    language,
    code,
    task_prompt: taskPrompt
  });
}

/**
 * Get AI-generated meeting discussion insights.
 * Analyzes player behavior to generate discussion prompts.
 */
export async function getMeetingInsights(players, taskEditors, disruption, taskProgress) {
  return callAgent("/api/meeting-insights", {
    players,
    task_editors: taskEditors,
    disruption,
    task_progress: taskProgress
  });
}

/**
 * Check if the agent service is available.
 */
export async function isAgentAvailable() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${AGENT_URL}/health`, {
      signal: controller.signal
    });

    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}
