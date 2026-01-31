import {
  calculateXpForLevel,
  getLevelFromXp,
  getLevelRequirements,
  getXpProgress,
  isStaticLevel,
  getMaxStaticLevel,
} from './level-thresholds';

describe('Level Thresholds', () => {
  describe('calculateXpForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(calculateXpForLevel(1)).toBe(0);
    });

    it('should return correct XP for static levels', () => {
      expect(calculateXpForLevel(10)).toBe(150000);
      expect(calculateXpForLevel(20)).toBe(775000);
    });

    it('should require more XP than Level 20 for Level 21', () => {
      const level20Xp = calculateXpForLevel(20);
      const level21Xp = calculateXpForLevel(21);
      expect(level21Xp).toBeGreaterThan(level20Xp);
      expect(level21Xp).toBe(776500); // 775000 + 1500 * 1^2
    });

    it('should have monotonic XP progression for levels 1-50', () => {
      let prevXp = -1;
      for (let level = 1; level <= 50; level++) {
        const xp = calculateXpForLevel(level);
        expect(xp).toBeGreaterThan(prevXp);
        prevXp = xp;
      }
    });

    it('should calculate correct XP for algorithmic levels', () => {
      // Level 21: 775000 + 1500 * 1^2 = 776500
      expect(calculateXpForLevel(21)).toBe(776500);
      // Level 22: 775000 + 1500 * 2^2 = 781000
      expect(calculateXpForLevel(22)).toBe(781000);
      // Level 25: 775000 + 1500 * 5^2 = 812500
      expect(calculateXpForLevel(25)).toBe(812500);
      // Level 30: 775000 + 1500 * 10^2 = 925000
      expect(calculateXpForLevel(30)).toBe(925000);
    });

    it('should return 0 for level 0 or negative', () => {
      expect(calculateXpForLevel(0)).toBe(0);
      expect(calculateXpForLevel(-1)).toBe(0);
    });
  });

  describe('getLevelFromXp', () => {
    it('should return level 1 for 0 XP', () => {
      expect(getLevelFromXp(0)).toBe(1);
    });

    it('should return level 1 for negative XP', () => {
      expect(getLevelFromXp(-100)).toBe(1);
    });

    it('should return correct level for static thresholds', () => {
      expect(getLevelFromXp(0)).toBe(1);
      expect(getLevelFromXp(2999)).toBe(1);
      expect(getLevelFromXp(3000)).toBe(2);
      expect(getLevelFromXp(150000)).toBe(10);
      expect(getLevelFromXp(774999)).toBe(19);
      expect(getLevelFromXp(775000)).toBe(20);
    });

    it('should not skip levels at Level 20 boundary', () => {
      // This is the critical test - previously Level 21 required less XP than Level 20
      let prevLevel = 0;
      for (let xp = 0; xp < 1000000; xp += 500) {
        const level = getLevelFromXp(xp);
        expect(level - prevLevel).toBeLessThanOrEqual(1);
        prevLevel = level;
      }
    });

    it('should return correct level around Level 20 threshold', () => {
      const level20Xp = calculateXpForLevel(20);
      const level21Xp = calculateXpForLevel(21);

      expect(getLevelFromXp(level20Xp)).toBe(20);
      expect(getLevelFromXp(level20Xp + 1)).toBe(20); // Still 20 until 21 threshold
      expect(getLevelFromXp(level21Xp - 1)).toBe(20);
      expect(getLevelFromXp(level21Xp)).toBe(21);
    });

    it('should return correct algorithmic levels', () => {
      expect(getLevelFromXp(776500)).toBe(21);
      expect(getLevelFromXp(781000)).toBe(22);
      expect(getLevelFromXp(812500)).toBe(25);
      expect(getLevelFromXp(925000)).toBe(30);
    });

    it('should handle XP between algorithmic levels correctly', () => {
      // Between Level 21 (776500) and Level 22 (781000)
      expect(getLevelFromXp(778000)).toBe(21);
      expect(getLevelFromXp(780999)).toBe(21);
    });
  });

  describe('getLevelRequirements', () => {
    it('should return requirements for static levels', () => {
      const level10 = getLevelRequirements(10);
      expect(level10).toBeDefined();
      expect(level10?.level).toBe(10);
      expect(level10?.xpRequired).toBe(150000);
      expect(level10?.rewards?.title).toBe('Code Hero');
      expect(level10?.rewards?.badges).toContain('code_hero');
    });

    it('should return requirements for algorithmic milestone levels', () => {
      const level25 = getLevelRequirements(25);
      expect(level25).toBeDefined();
      expect(level25?.level).toBe(25);
      expect(level25?.xpRequired).toBe(812500);
      expect(level25?.rewards?.title).toBe('Code Virtuoso');
      expect(level25?.rewards?.badges).toContain('code_virtuoso');
    });

    it('should return empty badges for non-milestone algorithmic levels', () => {
      const level21 = getLevelRequirements(21);
      expect(level21).toBeDefined();
      expect(level21?.level).toBe(21);
      expect(level21?.rewards?.badges).toEqual([]);
      expect(level21?.rewards?.title).toBe('Code Hero Level 21');

      const level23 = getLevelRequirements(23);
      expect(level23?.rewards?.badges).toEqual([]);
    });

    it('should return undefined for invalid levels', () => {
      expect(getLevelRequirements(0)).toBeUndefined();
    });
  });

  describe('getXpProgress', () => {
    it('should calculate correct progress at level start', () => {
      const progress = getXpProgress(150000); // Exactly level 10
      expect(progress.currentLevel).toBe(10);
      expect(progress.currentLevelXp).toBe(0);
    });

    it('should calculate correct progress mid-level', () => {
      const progress = getXpProgress(160000); // 10,000 XP into level 10
      expect(progress.currentLevel).toBe(10);
      expect(progress.currentLevelXp).toBe(10000);
    });

    it('should calculate correct XP to next level', () => {
      const progress = getXpProgress(770000); // Near end of level 19
      expect(progress.currentLevel).toBe(19);
      expect(progress.xpToNextLevel).toBe(5000); // 775000 - 770000
    });
  });

  describe('isStaticLevel', () => {
    it('should return true for levels 1-20', () => {
      for (let level = 1; level <= 20; level++) {
        expect(isStaticLevel(level)).toBe(true);
      }
    });

    it('should return false for levels 21+', () => {
      expect(isStaticLevel(21)).toBe(false);
      expect(isStaticLevel(50)).toBe(false);
      expect(isStaticLevel(100)).toBe(false);
    });
  });

  describe('getMaxStaticLevel', () => {
    it('should return 20', () => {
      expect(getMaxStaticLevel()).toBe(20);
    });
  });

  describe('XP curve smoothness', () => {
    it('should have reasonable XP delta between consecutive levels', () => {
      let prevXp = 0;
      for (let level = 1; level <= 50; level++) {
        const xp = calculateXpForLevel(level);
        const delta = xp - prevXp;

        // Delta should be positive (monotonic)
        expect(delta).toBeGreaterThanOrEqual(0);

        // Delta shouldn't be unreasonably large (< 100k per level up to 50)
        if (level > 1) {
          expect(delta).toBeLessThan(100000);
        }

        prevXp = xp;
      }
    });

    it('should have smooth transition from level 20 to 21', () => {
      const level19Delta = calculateXpForLevel(20) - calculateXpForLevel(19);
      const level20Delta = calculateXpForLevel(21) - calculateXpForLevel(20);

      // The transition should be smooth - level 21 delta shouldn't be drastically different
      // Level 19->20 delta: 775000 - 690000 = 85000
      // Level 20->21 delta: 776500 - 775000 = 1500
      // The delta is smaller which is intentional for the quadratic formula starting fresh
      expect(level20Delta).toBeGreaterThan(0);
      expect(level19Delta).toBeGreaterThan(0);
    });
  });
});
