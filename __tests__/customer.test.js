const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server/app');
const Customer = require('../server/models/Customer');
const User = require('../server/models/User');

describe('Customer Endpoints', () => {
    let token;
    let testUser;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // יצירת משתמש לבדיקות
        testUser = await User.create({
            username: 'testadmin',
            password: 'password123',
            email: 'admin@test.com',
            name: 'Test Admin',
            role: 'admin'
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
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Customer.deleteMany({});
    });

    describe('POST /api/customers', () => {
        it('should create a new customer', async () => {
            const res = await request(app)
                .post('/api/customers')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'ישראל ישראלי',
                    idNumber: '123456789',
                    email: 'israel@test.com',
                    phone: {
                        mobile: '0501234567'
                    },
                    address: {
                        city: 'תל אביב'
                    }
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('name', 'ישראל ישראלי');
            expect(res.body).toHaveProperty('idNumber', '123456789');
        });

        it('should validate required fields', async () => {
            const res = await request(app)
                .post('/api/customers')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'ישראל ישראלי'
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /api/customers', () => {
        beforeEach(async () => {
            await Customer.create({
                name: 'ישראל ישראלי',
                idNumber: '123456789',
                email: 'israel@test.com',
                phone: {
                    mobile: '0501234567'
                },
                address: {
                    city: 'תל אביב'
                },
                createdBy: testUser._id
            });
        });

        it('should return all customers', async () => {
            const res = await request(app)
                .get('/api/customers')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBe(1);
        });
    });

    describe('PUT /api/customers/:id', () => {
        let customerId;

        beforeEach(async () => {
            const customer = await Customer.create({
                name: 'ישראל ישראלי',
                idNumber: '123456789',
                email: 'israel@test.com',
                phone: {
                    mobile: '0501234567'
                },
                address: {
                    city: 'תל אביב'
                },
                createdBy: testUser._id
            });
            customerId = customer._id;
        });

        it('should update customer', async () => {
            const res = await request(app)
                .put(`/api/customers/${customerId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'ישראל כהן',
                    email: 'israel.cohen@test.com'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('name', 'ישראל כהן');
            expect(res.body).toHaveProperty('email', 'israel.cohen@test.com');
        });
    });

    describe('DELETE /api/customers/:id', () => {
        let customerId;

        beforeEach(async () => {
            const customer = await Customer.create({
                name: 'ישראל ישראלי',
                idNumber: '123456789',
                email: 'israel@test.com',
                phone: {
                    mobile: '0501234567'
                },
                address: {
                    city: 'תל אביב'
                },
                createdBy: testUser._id
            });
            customerId = customer._id;
        });

        it('should delete customer', async () => {
            const res = await request(app)
                .delete(`/api/customers/${customerId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            
            const deletedCustomer = await Customer.findById(customerId);
            expect(deletedCustomer).toBeNull();
        });
    });
});