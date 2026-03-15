export const PLAYER_COLORS = [
  { key: "purple", top: "#9b5de5", bottom: "#6a3ec8", glow: "rgba(155,93,229,0.5)" },
  { key: "blue",   top: "#3d5af1", bottom: "#2b42c4", glow: "rgba(61,90,241,0.5)" },
  { key: "cyan",   top: "#00f5d4", bottom: "#00b89c", glow: "rgba(0,245,212,0.5)" },
  { key: "red",    top: "#ff4757", bottom: "#c0392b", glow: "rgba(255,71,87,0.5)" },
  { key: "green",  top: "#2ed573", bottom: "#1aab50", glow: "rgba(46,213,115,0.5)" },
  { key: "yellow", top: "#ffd32a", bottom: "#d4a800", glow: "rgba(255,211,42,0.5)" },
  { key: "orange", top: "#ff6b35", bottom: "#cc4a1a", glow: "rgba(255,107,53,0.5)" },
  { key: "pink",   top: "#ff6b9d", bottom: "#cc3a6e", glow: "rgba(255,107,157,0.5)" },
];

export const DEFAULT_COLOR = "purple";

export const VALID_COLOR_KEYS = PLAYER_COLORS.map((c) => c.key);

export function getColorByKey(key) {
  return PLAYER_COLORS.find((c) => c.key === key) ?? PLAYER_COLORS[0];
}
