const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Mock User model
jest.mock('../models/User');
// Mock bcryptjs
jest.mock('bcryptjs');

describe('Auth API Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            User.findOne.mockResolvedValue(null);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashedpassword');
            User.create.mockResolvedValue({
                _id: 'mock_user_id',
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User'
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    firstName: 'Test',
                    lastName: 'User',
                    username: 'testuser',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
        });

        it('should fail if user already exists', async () => {
            User.findOne.mockResolvedValue({ username: 'testuser' });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    firstName: 'Test',
                    lastName: 'User',
                    username: 'testuser',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('User already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with correct credentials', async () => {
            const mockUser = {
                _id: 'mock_user_id',
                username: 'testuser',
                password: 'hashedpassword',
                firstName: 'Test',
                lastName: 'User'
            };
            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
        });

        it('should fail with incorrect password', async () => {
            const mockUser = {
                _id: 'mock_user_id',
                username: 'testuser',
                password: 'hashedpassword'
            };
            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.success).toBe(false);
        });
    });
});
