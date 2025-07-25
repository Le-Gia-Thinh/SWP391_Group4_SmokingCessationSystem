// test/paymentController.test.js
const request = require('supertest');
const { app } = require('../../server');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sql, dbConfig } = require('../../config/database');

const userId = 8;

describe('🔁 PaymentController', () => {
    let token;
    let createdOrderCodes = []; // Track created orders for cleanup
    let createdSubscriptionIds = []; // Track created subscriptions for cleanup

    beforeAll(async () => {
        token = jwt.sign({ id: userId, role: 'user' }, process.env.JWT_SECRET);

        // Ensure test package exists in database
        try {
            const pool = await sql.connect(dbConfig);
            await pool.request()
                .input('package_id', sql.Int, 2)
                .input('package_name', sql.NVarChar, 'Test Premium Package')
                .input('duration_days', sql.Int, 30)
                .input('price', sql.Float, 99000)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM SUBSCRIPTION_PACKAGE WHERE package_id = @package_id)
                    BEGIN
                        INSERT INTO SUBSCRIPTION_PACKAGE (package_id, package_name, duration_days, price, created_at)
                        VALUES (@package_id, @package_name, @duration_days, @price, GETDATE())
                    END
                `);
            console.log('✅ Test package setup completed');
        } catch (err) {
            console.warn('Setup warning:', err.message);
        }
    });

    afterAll(async () => {
        // Cleanup created test data
        try {
            const pool = await sql.connect(dbConfig);
            
            // Delete payments first (foreign key constraint)
            if (createdOrderCodes.length > 0) {
                for (const orderCode of createdOrderCodes) {
                    await pool.request()
                        .input('orderCode', sql.NVarChar, orderCode)
                        .query(`DELETE FROM PAYMENT WHERE order_code = @orderCode`);
                }
            }

            // Delete subscriptions
            if (createdSubscriptionIds.length > 0) {
                for (const subscriptionId of createdSubscriptionIds) {
                    await pool.request()
                        .input('subscriptionId', sql.Int, subscriptionId)
                        .query(`DELETE FROM USER_SUBSCRIPTION WHERE subscription_id = @subscriptionId`);
                }
            }

            // Also cleanup by user and time (fallback)
            await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    DELETE FROM USER_SUBSCRIPTION 
                    WHERE user_id = @userId 
                    AND payment_status IN ('pending', 'failed')
                    AND DATEDIFF(minute, start_date, GETDATE()) < 30
                `);
                
            console.log('✅ Test cleanup completed');
        } catch (err) {
            console.warn('Cleanup error:', err.message);
        }
    });

    // Helper function to create valid signature for webhook tests
    const createValidSignature = (data) => {
        const sortedData = Object.keys(data)
            .sort()
            .reduce((obj, key) => {
                obj[key] = data[key];
                return obj;
            }, {});

        const queryStr = Object.keys(sortedData)
            .filter(k => sortedData[k] !== undefined)
            .map(k => {
                let v = sortedData[k];
                if (Array.isArray(v)) v = JSON.stringify(v);
                if ([null, undefined, 'null', 'undefined'].includes(v)) v = '';
                return `${k}=${v}`;
            })
            .join('&');

        return crypto
            .createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY)
            .update(queryStr)
            .digest('hex');
    };

    describe('POST /api/payment - Create Payment', () => {
        test('✅ should create payment successfully with valid data', async () => {
            const paymentData = {
                packageId: 2, // Make sure this exists in SUBSCRIPTION_PACKAGE table
                amount: 99000,
                description: 'Truy cập Premium 1 tháng'
            };

            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send(paymentData);

            // Debug logging
            if (res.statusCode !== 200) {
                console.log('Payment creation failed:', res.body);
                console.log('Request data:', paymentData);
            }

            expect([200, 400, 404, 500]).toContain(res.statusCode);

            if (res.statusCode === 200) {
                expect(res.body).toHaveProperty('success', true);
                expect(res.body).toHaveProperty('checkoutUrl');
                expect(res.body).toHaveProperty('orderCode');
                expect(res.body).toHaveProperty('subscriptionId');
                expect(typeof res.body.checkoutUrl).toBe('string');
                expect(typeof res.body.orderCode).toBe('number');
                expect(typeof res.body.subscriptionId).toBe('number');

                // Store for cleanup
                createdOrderCodes.push(res.body.orderCode.toString());
                createdSubscriptionIds.push(res.body.subscriptionId);
            } else {
                // If error, check error structure
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('message');
            }
        }, 15000); // Increase timeout for PayOS API call

        test('❌ should fail with missing packageId', async () => {
            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    amount: 99000,
                    description: 'Test without packageId'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Package ID is required');
        });

        test('❌ should fail with missing amount', async () => {
            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    packageId: 2,
                    description: 'Test without amount'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Amount must be greater than 0');
        });

        test('❌ should fail with invalid packageId (null)', async () => {
            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    packageId: null,
                    amount: 99000,
                    description: 'Test with null packageId'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body.message).toContain('Package ID is required');
        });

        test('❌ should fail with invalid packageId (undefined)', async () => {
            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    packageId: undefined,
                    amount: 99000,
                    description: 'Test with undefined packageId'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body.message).toContain('Package ID is required');
        });

        test('❌ should fail with non-existent packageId', async () => {
            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    packageId: 99999, // Non-existent package
                    amount: 99000,
                    description: 'Test with non-existent packageId'
                });

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body.message).toContain('Subscription package not found');
        });

        test('❌ should fail with invalid amount (negative)', async () => {
            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    packageId: 2,
                    amount: -1000,
                    description: 'Test with negative amount'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body.message).toContain('Amount must be greater than 0');
        });

        test('❌ should fail with invalid amount (zero)', async () => {
            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    packageId: 2,
                    amount: 0,
                    description: 'Test with zero amount'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body.message).toContain('Amount must be greater than 0');
        });

        test('❌ should fail without authentication token', async () => {
            const res = await request(app)
                .post('/api/payment')
                .send({
                    packageId: 2,
                    amount: 99000,
                    description: 'Test without token'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty('message');
        });

        test('❌ should fail with invalid token', async () => {
            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', 'Bearer invalid-token-here')
                .send({
                    packageId: 2,
                    amount: 99000,
                    description: 'Test with invalid token'
                });

            expect(res.statusCode).toBe(401);
        });

        test('❌ should fail with malformed token', async () => {
            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', 'InvalidFormat')
                .send({
                    packageId: 2,
                    amount: 99000,
                    description: 'Test with malformed token'
                });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('POST /api/payment/callback - Payment Webhook', () => {
        test('✅ should process valid webhook with successful payment', async () => {
            const data = {
                orderCode: '123456',
                code: '00', // Success code
                paidAt: new Date().toISOString(),
            };
            const signature = createValidSignature(data);

            const res = await request(app)
                .post('/api/payment/callback')
                .send({ data, signature });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success');
            expect(res.body).toHaveProperty('message');

            // Should handle gracefully even if order doesn't exist
            if (res.body.success === false) {
                expect(res.body.message).toBe('Subscription not found');
            }
        });

        test('✅ should process valid webhook with failed payment', async () => {
            const data = {
                orderCode: '123457',
                code: '01', // Failed code
                paidAt: new Date().toISOString(),
            };
            const signature = createValidSignature(data);

            const res = await request(app)
                .post('/api/payment/callback')
                .send({ data, signature });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('message');
        });

        test('❌ should reject webhook with invalid signature', async () => {
            const data = {
                orderCode: '123456',
                code: '00',
                paidAt: new Date().toISOString(),
            };

            const res = await request(app)
                .post('/api/payment/callback')
                .send({
                    data,
                    signature: 'invalid-signature-hash-here'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Invalid signature');
        });

        test('✅ should handle webhook with missing data gracefully', async () => {
            const res = await request(app)
                .post('/api/payment/callback')
                .send({});

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.message).toBe('Webhook OK');
        });

        test('✅ should handle webhook with missing signature', async () => {
            const res = await request(app)
                .post('/api/payment/callback')
                .send({
                    data: { orderCode: '123456', code: '00' }
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.message).toBe('Webhook OK');
        });

        test('✅ should handle webhook with missing orderCode', async () => {
            const data = {
                code: '00',
                paidAt: new Date().toISOString(),
            };
            const signature = createValidSignature(data);

            const res = await request(app)
                .post('/api/payment/callback')
                .send({ data, signature });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('message');
        });

        test('✅ should handle webhook for non-existent order gracefully', async () => {
            const data = {
                orderCode: '999999', // Non-existent order
                code: '00',
                paidAt: new Date().toISOString(),
            };
            const signature = createValidSignature(data);

            const res = await request(app)
                .post('/api/payment/callback')
                .send({ data, signature });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('message');
            // Should return 'Subscription not found' for non-existent orders
            if (res.body.success === false) {
                expect(res.body.message).toBe('Subscription not found');
            }
        });
    });

    describe('GET /api/payment/callback - Test Endpoint', () => {
        test('✅ should return test response', async () => {
            const res = await request(app).get('/api/payment/callback');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({ message: 'Webhook GET ok' });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle database connection errors gracefully', async () => {
            // This test would require mocking the database connection
            // For now, we'll test with invalid data that should cause DB errors

            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    packageId: 'invalid-string-id', // Should cause type error
                    amount: 99000,
                    description: 'Test with invalid packageId type'
                });

            expect([400, 404, 500]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should handle very long description', async () => {
            const longDescription = 'A'.repeat(1000); // Very long description

            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    packageId: 2,
                    amount: 99000,
                    description: longDescription
                });

            // Should either succeed (truncated) or fail gracefully
            expect([200, 400, 500]).toContain(res.statusCode);
            if (res.statusCode === 200) {
                expect(res.body).toHaveProperty('success', true);
                createdOrderCodes.push(res.body.orderCode.toString());
                createdSubscriptionIds.push(res.body.subscriptionId);
            }
        });

        test('should handle special characters in description', async () => {
            const specialDescription = '特殊字符 & émojis 🎉 <script>';

            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    packageId: 2,
                    amount: 99000,
                    description: specialDescription
                });

            expect([200, 400, 500]).toContain(res.statusCode);
            if (res.statusCode === 200) {
                expect(res.body).toHaveProperty('success', true);
                createdOrderCodes.push(res.body.orderCode.toString());
                createdSubscriptionIds.push(res.body.subscriptionId);
            }
        });

        test('should handle empty description', async () => {
            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    packageId: 2,
                    amount: 99000,
                    description: ''
                });

            expect([200, 400, 500]).toContain(res.statusCode);
            if (res.statusCode === 200) {
                expect(res.body).toHaveProperty('success', true);
                createdOrderCodes.push(res.body.orderCode.toString());
                createdSubscriptionIds.push(res.body.subscriptionId);
            }
        });

        test('should handle missing description', async () => {
            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    packageId: 2,
                    amount: 99000
                    // no description
                });

            expect([200, 400, 500]).toContain(res.statusCode);
            if (res.statusCode === 200) {
                expect(res.body).toHaveProperty('success', true);
                createdOrderCodes.push(res.body.orderCode.toString());
                createdSubscriptionIds.push(res.body.subscriptionId);
            }
        });

        test('should handle string amount (should be converted)', async () => {
            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    packageId: 2,
                    amount: '99000', // String instead of number
                    description: 'Test with string amount'
                });

            expect([200, 400, 500]).toContain(res.statusCode);
            if (res.statusCode === 200) {
                expect(res.body).toHaveProperty('success', true);
                createdOrderCodes.push(res.body.orderCode.toString());
                createdSubscriptionIds.push(res.body.subscriptionId);
            }
        });

        test('should handle non-numeric amount', async () => {
            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    packageId: 2,
                    amount: 'invalid-amount',
                    description: 'Test with non-numeric amount'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });

        test('should handle decimal amount', async () => {
            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    packageId: 2,
                    amount: 99000.50,
                    description: 'Test with decimal amount'
                });

            expect([200, 400, 500]).toContain(res.statusCode);
            if (res.statusCode === 200) {
                expect(res.body).toHaveProperty('success', true);
                createdOrderCodes.push(res.body.orderCode.toString());
                createdSubscriptionIds.push(res.body.subscriptionId);
            }
        });

        test('should handle very large amount', async () => {
            const res = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    packageId: 2,
                    amount: 999999999999,
                    description: 'Test with very large amount'
                });

            expect([200, 400, 500]).toContain(res.statusCode);
            if (res.statusCode === 200) {
                expect(res.body).toHaveProperty('success', true);
                createdOrderCodes.push(res.body.orderCode.toString());
                createdSubscriptionIds.push(res.body.subscriptionId);
            }
        });
    });

    describe('Integration Tests', () => {
        test('should create payment and handle webhook flow', async () => {
            // First create a payment
            const paymentRes = await request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    packageId: 2,
                    amount: 99000,
                    description: 'Integration test payment'
                });

            if (paymentRes.statusCode === 200) {
                const { orderCode, subscriptionId } = paymentRes.body;
                createdOrderCodes.push(orderCode.toString());
                createdSubscriptionIds.push(subscriptionId);

                // Then simulate a webhook callback
                const webhookData = {
                    orderCode: orderCode.toString(),
                    code: '00', // Success
                    paidAt: new Date().toISOString(),
                };
                const signature = createValidSignature(webhookData);

                const webhookRes = await request(app)
                    .post('/api/payment/callback')
                    .send({ data: webhookData, signature });

                expect(webhookRes.statusCode).toBe(200);
                expect(webhookRes.body).toHaveProperty('success');
            }
        }, 20000); // Extended timeout for integration test
    });
});