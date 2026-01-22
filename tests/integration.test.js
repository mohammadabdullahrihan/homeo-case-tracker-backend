const request = require('supertest');

// MOCK MIDDLEWARE BEFORE REQUIRING APP
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { id: 'mock_user_id' };
  next();
});
jest.mock('../middleware/subscriptionMiddleware', () => (req, res, next) => {
  next();
});

// Mock models and services
jest.mock('../models/User');
jest.mock('../models/Case');
jest.mock('../models/FormConfig');
jest.mock('../services/aiService');
jest.mock('../services/remedyService');

const app = require('../server');
const Case = require('../models/Case');
const FormConfig = require('../models/FormConfig');
const aiService = require('../services/aiService');
const remedyService = require('../services/remedyService');

describe('Full API Integration Test with Supertest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow getting a case summary', async () => {
    // Mock Case.findOne
    Case.findOne.mockResolvedValue({ 
      _id: 'mock_case_id', 
      user: 'mock_user_id',
      caseData: { name: 'John' }
    });
    
    // Mock FormConfig
    FormConfig.findOne.mockReturnValue({ 
      sort: jest.fn().mockResolvedValue({ 
        sections: [
          {
            fields: [{ id: 'name', label: 'Name' }]
          }
        ]
      }) 
    });
    
    // Mock AI Service
    aiService.generateSummary.mockResolvedValue({
      summary: 'Mocked Summary',
      symptoms: [{ text: 'symptom1' }]
    });
    
    // Mock Remedy Service
    remedyService.suggestRemedies.mockReturnValue([
      { shortName: 'Acon', fullName: 'Aconitum', score: 100 }
    ]);
    
    // Mock Case.findByIdAndUpdate
    const mockUpdatedCase = {
      _id: 'mock_case_id',
      summary: 'Mocked Summary',
      suggestedRemedies: [{ shortName: 'Acon', fullName: 'Aconitum', score: 100 }],
      symptoms: [{ text: 'symptom1' }]
    };
    Case.findOneAndUpdate.mockResolvedValue(mockUpdatedCase);

    const res = await request(app)
      .post('/api/case/summary')
      .send({
        caseId: 'mock_case_id',
        caseData: { name: 'John' }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary).toBe('Mocked Summary');
  });
});
