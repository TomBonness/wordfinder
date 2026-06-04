import { describe, expect, it } from "vitest";
import { getZipfChartPath, getZipfChartPoints } from "./zipf-chart-geometry";

const discoveredAt = "2026-06-03T12:00:00.000Z";

const records = [
  { word: "apple", display: "apple", discoveredAt, lastSearchedAt: discoveredAt, searchCount: 12 },
  { word: "word", display: "word", discoveredAt, lastSearchedAt: discoveredAt, searchCount: 3 },
];

describe("Zipf chart geometry", () => {
  it("plots top searched words by rank and relative search count", () => {
    const points = getZipfChartPoints(records, 720, 240, 32);

    expect(points).toEqual([
      { word: "apple", display: "apple", searchCount: 12, rank: 1, x: 32, y: 32 },
      { word: "word", display: "word", searchCount: 3, rank: 2, x: 688, y: 164 },
    ]);
    expect(getZipfChartPath(points)).toBe("M32.00 32.00 L688.00 164.00");
  });

  it("centers a single ranked point", () => {
    const [point] = getZipfChartPoints([records[0]], 720, 240, 32);

    expect(point).toMatchObject({ rank: 1, x: 360, y: 32 });
  });
});
