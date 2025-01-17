const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server/app');
const Policy = require('../server/models/Policy');
const Customer = require('../server/models/Customer');
const User = require('../server/models/User');

describe('Policy Endpoints', () => {
    let token;
    let testUser;
    let testCustomer;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // יצירת משתמש בדיקות
        testUser = await User.create({
            username: 'testadmin',
            password: 'password123',
            email: 'admin@test.com',
            name: 'Test Admin',
            role: 'admin'
        });

        // יצירת לקוח בדיקות
        testCustomer = await Customer.create({
            name: 'ישראל ישראלי',
            idNumber: '123456789',
            email: 'israel@test.com',
            phone: { mobile: '0501234567' },
            address: { city: 'תל אביב' },
            createdBy: testUser._id
        });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'testadmin',
                password: 'password123'
            });

        token = loginRes.body.token;
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Customer.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Policy.deleteMany({});
    });

    describe('POST /api/policies', () => {
        it('should create a new policy', async () => {
            const res = await request(app)
                .post('/api/policies')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    policyNumber: 'POL123456',
                    customerId: testCustomer._id,
                    type: 'car_mandatory',
                    company: 'הראל',
                    startDate: '2025-01-01',
                    endDate: '2026-01-01',
                    price: {
                        amount: 1200,
                        currency: 'ILS',
                        paymentFrequency: 'monthly'
                    }
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('policyNumber', 'POL123456');
            expect(res.body.customerId).toBe(testCustomer._id.toString());
        });

        it('should validate required fields', async () => {
            const res = await request(app)
                .post('/api/policies')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    policyNumber: 'POL123456'
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /api/policies', () => {
        beforeEach(async () => {
            await Policy.create({
                policyNumber: 'POL123456',
                customerId: testCustomer._id,
                type: 'car_mandatory',
                company: 'הראל',
                startDate: '2025-01-01',
                endDate: '2026-01-01',
                price: {
                    amount: 1200,
                    currency: 'ILS',
                    paymentFrequency: 'monthly'
                },
                createdBy: testUser._id
            });
        });

        it('should return all policies', async () => {
            const res = await request(app)
                .get('/api/policies')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBe(1);
        });
    });

    describe('GET /api/policies/expiring/:days', () => {
        beforeEach(async () => {
            const today = new Date();
            const thirtyDaysFromNow = new Date(today.setDate(today.getDate() + 30));
            
            await Policy.create({
                policyNumber: 'POL123456',
                customerId: testCustomer._id,
                type: 'car_mandatory',
                company: 'הראל',
                startDate: new Date(),
                endDate: thirtyDaysFromNow,
                status: 'active',
                price: {
                    amount: 1200,
                    currency: 'ILS',
                    paymentFrequency: 'monthly'
                },
                createdBy: testUser._id
            });
        });

        it('should return expiring policies', async () => {
            const res = await request(app)
                .get('/api/policies/expiring/45')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBe(1);
        });
    });
});