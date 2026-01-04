const request = require('supertest');
const app = require('../server');

describe('Basic API Tests', () => {
  it('should return 200 for health check', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Homeo Case Tracker API');
  });
});
