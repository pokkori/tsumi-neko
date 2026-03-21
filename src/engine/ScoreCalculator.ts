export class ScoreCalculator {
  calculate(catCount: number, heightM: number, combo: number): number {
    const baseScore = catCount * 100;
    const heightBonus = Math.floor(heightM * 50);
    const comboBonus = combo * combo * 25;
    return baseScore + heightBonus + comboBonus;
  }

  getPointsForLastCat(catCount: number, heightM: number, combo: number): number {
    const current = this.calculate(catCount, heightM, combo);
    const previous = this.calculate(
      Math.max(0, catCount - 1),
      heightM - 0.5,
      Math.max(0, combo - 1)
    );
    return Math.max(0, current - previous);
  }

  getComboText(combo: number): string | null {
    if (combo < 2) return null;
    if (combo < 5) return `${combo} COMBO!`;
    if (combo < 10) return `${combo} COMBO!! NICE!`;
    if (combo < 20) return `${combo} COMBO!!! AMAZING!!`;
    return `${combo} COMBO!!!! LEGENDARY!!!`;
  }

  getComboColor(combo: number): string {
    if (combo < 3) return "#FFFFFF";
    if (combo < 5) return "#FFD700";
    if (combo < 10) return "#FF6B6B";
    if (combo < 20) return "#FF00FF";
    return "#00FFFF";
  }
}
