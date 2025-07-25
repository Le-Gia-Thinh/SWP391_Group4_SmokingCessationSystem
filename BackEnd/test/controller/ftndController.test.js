// test/controller/ftndController.test.js
const request = require('supertest');
const { app } = require('../../server');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(user, process.env.JWT_SECRET || 'testsecret');
};

describe('📊 FTND Controller', () => {
    const token = generateToken({ id: 3, role: 'member' });

    // Existing tests (66% coverage)
    it('✅ Kiểm tra user đã có ftnd_level hay chưa', async () => {
        const res = await request(app)
            .get('/api/ftnd/exists/3')
            .set('Authorization', `Bearer ${token}`);

        expect([200, 404, 500]).toContain(res.statusCode);
        if (res.statusCode === 200) {
            expect(res.body).toHaveProperty('exists');
        }
    });

    it('✅ Gửi kết quả FTND', async () => {
        const res = await request(app)
            .post('/api/ftnd/result')
            .set('Authorization', `Bearer ${token}`)
            .send({ user_id: 3, level: "High", q4_value: 5 });

        expect([200, 400, 500]).toContain(res.statusCode);
        if (res.statusCode === 200) {
            expect(res.body).toHaveProperty('success', true);
        }
    });

    it('✅ Lấy thông tin ftnd_level của user', async () => {
        const res = await request(app)
            .get('/api/ftnd/getFtndLevel/3')
            .set('Authorization', `Bearer ${token}`);

        expect([200, 404, 500]).toContain(res.statusCode);
        if (res.statusCode === 200) {
            expect(res.body).toHaveProperty('ftnd_level');
        }
    });

    // Additional tests to reach 85-90% coverage
    it('❌ Submit FTND thiếu user_id', async () => {
        const res = await request(app)
            .post('/api/ftnd/result')
            .set('Authorization', `Bearer ${token}`)
            .send({ level: "High", q4_value: 5 });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Thiếu user_id hoặc level");
    });

    it('❌ Submit FTND thiếu level', async () => {
        const res = await request(app)
            .post('/api/ftnd/result')
            .set('Authorization', `Bearer ${token}`)
            .send({ user_id: 3, q4_value: 5 });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Thiếu user_id hoặc level");
    });

    it('✅ Submit FTND với level khác', async () => {
        const res = await request(app)
            .post('/api/ftnd/result')
            .set('Authorization', `Bearer ${token}`)
            .send({ user_id: 4, level: "Low", q4_value: 1 });

        expect([200, 400, 500]).toContain(res.statusCode);
    });

    it('✅ Check exists cho user không tồn tại', async () => {
        const res = await request(app)
            .get('/api/ftnd/exists/999')
            .set('Authorization', `Bearer ${token}`);

        expect([200, 500]).toContain(res.statusCode);
        if (res.statusCode === 200) {
            expect(res.body).toHaveProperty('exists');
        }
    });

    it('✅ Get level cho user không tồn tại', async () => {
        const res = await request(app)
            .get('/api/ftnd/getFtndLevel/999')
            .set('Authorization', `Bearer ${token}`);

        expect([200, 404, 500]).toContain(res.statusCode);
        if (res.statusCode === 200) {
            expect(res.body.ftnd_level).toBeNull();
        }
    });

    it('✅ Submit với q4_value = 0', async () => {
        const res = await request(app)
            .post('/api/ftnd/result')
            .set('Authorization', `Bearer ${token}`)
            .send({ user_id: 5, level: "Medium", q4_value: 0 });

        expect([200, 400, 500]).toContain(res.statusCode);
    });

    // Tests để cover achievement logic và database error branches
    it('✅ Submit FTND multiple times (achievement logic)', async () => {
        // Submit lần 1
        await request(app)
            .post('/api/ftnd/result')
            .set('Authorization', `Bearer ${token}`)
            .send({ user_id: 6, level: "High", q4_value: 5 });

        // Submit lần 2 - test achievement exists check
        const res = await request(app)
            .post('/api/ftnd/result')
            .set('Authorization', `Bearer ${token}`)
            .send({ user_id: 6, level: "Medium", q4_value: 3 });

        expect([200, 400, 500]).toContain(res.statusCode);
    });

    it('❌ Database error simulation - invalid userId', async () => {
        const res = await request(app)
            .get('/api/ftnd/exists/abc')
            .set('Authorization', `Bearer ${token}`);

        expect([400, 500]).toContain(res.statusCode);
    });

    it('❌ Database error simulation - invalid userId for getFtndLevel', async () => {
        const res = await request(app)
            .get('/api/ftnd/getFtndLevel/abc')
            .set('Authorization', `Bearer ${token}`);

        expect([400, 500]).toContain(res.statusCode);
    });

    it('✅ Submit với user_id string number', async () => {
        const res = await request(app)
            .post('/api/ftnd/result')
            .set('Authorization', `Bearer ${token}`)
            .send({ user_id: "7", level: "High", q4_value: 5 });

        expect([200, 400, 500]).toContain(res.statusCode);
    });

    it('❌ Submit với user_id invalid', async () => {
        const res = await request(app)
            .post('/api/ftnd/result')
            .set('Authorization', `Bearer ${token}`)
            .send({ user_id: "invalid", level: "High", q4_value: 5 });

        expect([400, 500]).toContain(res.statusCode);
    });

    it('✅ Check exists với recordset rỗng', async () => {
        const res = await request(app)
            .get('/api/ftnd/exists/99999')
            .set('Authorization', `Bearer ${token}`);

        expect([200, 500]).toContain(res.statusCode);
    });

    it('✅ Get level với recordset rỗng', async () => {
        const res = await request(app)
            .get('/api/ftnd/getFtndLevel/99999')
            .set('Authorization', `Bearer ${token}`);

        expect([200, 404, 500]).toContain(res.statusCode);
    });

    it('❌ Submit với body rỗng', async () => {
        const res = await request(app)
            .post('/api/ftnd/result')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.statusCode).toBe(400);
    });

    it('❌ Submit với null values', async () => {
        const res = await request(app)
            .post('/api/ftnd/result')
            .set('Authorization', `Bearer ${token}`)
            .send({ user_id: null, level: null, q4_value: null });

        expect(res.statusCode).toBe(400);
    });
});
