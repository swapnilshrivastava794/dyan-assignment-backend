const request = require('supertest');
const express = require('express');
const productRoutes = require('../src/routes/products');
const uploadRoutes = require('../src/routes/upload');

// Improved Mocking for Database
jest.mock('../src/config/db', () => ({
  query: jest.fn().mockImplementation((query) => {
    if (query.includes('COUNT(*)')) {
      return Promise.resolve({ rows: [{ count: '0' }] }); // Count query response
    }
    return Promise.resolve({ rows: [], rowCount: 0 }); // Other queries response
  })
}));

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);

describe('Backend API Tests', () => {
  
  test('GET /api/products should return success', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  test('GET /api/products/categories should return categories', async () => {
    const res = await request(app).get('/api/products/categories');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/products/analytics/stats should return stats', async () => {
    // Add mock specifically for stats if needed
    const res = await request(app).get('/api/products/analytics/stats');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

});
