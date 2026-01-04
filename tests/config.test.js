const request = require('supertest');
const app = require('../server');
const FormConfig = require('../models/FormConfig');
const jwt = require('jsonwebtoken');

// Mock FormConfig model
jest.mock('../models/FormConfig');

// Mock auth middleware to bypass auth for config update
// Or we can mock the user in the request
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: 'mock_user_id', role: 'admin' };
    next();
});

describe('Config API Endpoints', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/config', () => {
        it('should return config if exists', async () => {
            const mockConfig = {
                isActive: true,
                sections: [{ id: 's1', title: 'Section 1', fields: [] }]
            };
            FormConfig.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockConfig)
            });

            const res = await request(app).get('/api/config');

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.config).toBeDefined();
            expect(res.body.config.sections[0].title).toBe('Section 1');
        });

        it('should return null if no config found', async () => {
            FormConfig.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(null)
            });

            const res = await request(app).get('/api/config');

            expect(res.statusCode).toEqual(200);
            expect(res.body.config).toBeNull();
        });
    });

    describe('PUT /api/config', () => {
        it('should update configuration', async () => {
            const mockConfig = {
                sections: [],
                version: 1,
                save: jest.fn().mockResolvedValue(true)
            };
            FormConfig.findOne.mockResolvedValue(mockConfig);

            const res = await request(app)
                .put('/api/config')
                .send({
                    sections: [{ id: 's_new', title: 'New Section', fields: [] }]
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(mockConfig.save).toHaveBeenCalled();
        });
    });
});
