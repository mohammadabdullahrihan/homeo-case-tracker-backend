const { suggestRemedies } = require('../services/remedyService');
const fs = require('fs');
const path = require('path');

// Mock fs to control repertory data
jest.mock('fs');

describe('Remedy Service Logic', () => {
  beforeAll(() => {
    const mockRepertory = {
      categories: [
        {
          name: 'Mind',
          rubrics: [
            {
              title: 'Abrupt',
              remedies: [
                { abbreviation: 'Tarent', grade: 3 },
                { abbreviation: 'Aur', grade: 1 },
              ],
            },
            {
              title: 'Fear of death',
              remedies: [
                { abbreviation: 'Acon', grade: 3 },
                { abbreviation: 'Ars', grade: 2 },
              ],
            },
          ],
        },
      ],
    };

    const mockRemedyMap = {
      Tarent: 'Tarentula Hispanica',
      Aur: 'Aurum Metallicum',
      Acon: 'Aconitum Napellus',
      Ars: 'Arsenicum Album',
    };

    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes('repertory_full.json')) return JSON.stringify(mockRepertory);
      if (filePath.includes('remedy_map.json')) return JSON.stringify(mockRemedyMap);
      return '{}';
    });
  });

  it('should suggest remedies based on exact symptoms', () => {
    const results = suggestRemedies(['Fear of death']);
    expect(results).toHaveLength(2);
    expect(results[0].abbreviation).toBe('Acon');
    expect(results[0].fullName).toBe('Aconitum Napellus');
    expect(results[0].score).toBe(3);
  });

  it('should suggest remedies based on multiple keywords', () => {
    const results = suggestRemedies(['Abrupt', 'Fear']);
    // Tarent (3), Aur (1), Acon (3), Ars (2)
    // Note: Acon and Ars matched "Fear" because "Fear of death" contains "Fear"
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.abbreviation === 'Tarent')).toBe(true);
  });

  it('should return empty array for no symptoms', () => {
    const results = suggestRemedies([]);
    expect(results).toEqual([]);
  });

  it('should handle symptoms with no matches', async () => {
    const results = suggestRemedies(['NonExistentSymptom']);
    expect(results).toEqual([]);
  });
});
