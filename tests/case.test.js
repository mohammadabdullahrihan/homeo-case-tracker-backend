const request = require('supertest');
const app = require('../server');
const Case = require('../models/Case');
const FormConfig = require('../models/FormConfig');
const aiService = require('../services/aiService');
const remedyService = require('../services/remedyService');

// Mock models and services
jest.mock('../models/Case');
jest.mock('../models/FormConfig');
jest.mock('../services/aiService');
jest.mock('../services/remedyService');

// Mock auth middleware
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { id: 'mock_user_id' };
  next();
});

describe('Case API Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/case', () => {
    it('should create a new case', async () => {
      Case.prototype.save = jest.fn().mockResolvedValue({
        _id: 'mock_case_id',
      });

      const res = await request(app)
        .post('/api/case')
        .send({
          caseData: { name: 'John Doe', age: '30' },
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.caseId).toBeDefined();
    });
  });

  describe('GET /api/case', () => {
    it('should return all cases for user', async () => {
      const mockCases = [
        { _id: '1', patientName: 'John', user: 'mock_user_id' },
        { _id: '2', patientName: 'Jane', user: 'mock_user_id' },
      ];
      Case.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCases),
      });

      const res = await request(app).get('/api/case');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cases).toHaveLength(2);
    });
  });

  describe('POST /api/case/summary', () => {
    it('should generate summary and remedies', async () => {
      FormConfig.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue({
          sections: [
            {
              fields: [{ id: 'name', label: 'নাম' }],
            },
          ],
        }),
      });

      aiService.generateSummary.mockResolvedValue({
        summary: 'Test summary',
        symptoms: ['symptom1'],
      });

      remedyService.suggestRemedies.mockReturnValue([
        { abbreviation: 'Ars', fullName: 'Arsenicum', score: 10 },
      ]);

      Case.findByIdAndUpdate.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/case/summary')
        .send({
          caseId: 'mock_case_id',
          caseData: { name: 'John' },
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary).toBe('Test summary');
      expect(res.body.remedies).toHaveLength(1);
    });
  });

  describe('DELETE /api/case/:id', () => {
    it('should delete a case', async () => {
      Case.findOneAndDelete.mockResolvedValue({ _id: 'mock_case_id' });

      const res = await request(app).delete('/api/case/mock_case_id');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');
    });
  });
});
