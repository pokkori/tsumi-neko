export function formatScore(score: number): string {
  return score.toLocaleString();
}

export function formatHeight(heightM: number): string {
  return `${heightM.toFixed(1)}m`;
}

export function formatCoins(coins: number): string {
  return coins.toLocaleString();
}
