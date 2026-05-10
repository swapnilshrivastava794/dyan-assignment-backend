const pool = require('../config/db');

const Product = {
  // Create table
  initTable: async () => {
    return pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        product_id TEXT UNIQUE,
        product_name TEXT,
        category TEXT,
        category_main TEXT,
        discounted_price NUMERIC,
        actual_price NUMERIC,
        discount_percentage NUMERIC,
        rating NUMERIC,
        rating_count INTEGER,
        about_product TEXT,
        user_id TEXT,
        user_name TEXT,
        review_id TEXT,
        review_title TEXT,
        review_content TEXT,
        img_link TEXT,
        product_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },

  // Bulk Insert/Update
  upsert: async (values) => {
    const query = `
      INSERT INTO products (
        product_id, product_name, category, category_main, 
        discounted_price, actual_price, discount_percentage, 
        rating, rating_count, about_product, user_id, user_name, 
        review_id, review_title, review_content, img_link, product_link
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (product_id) DO UPDATE SET
        product_name = EXCLUDED.product_name,
        rating = EXCLUDED.rating,
        rating_count = EXCLUDED.rating_count,
        discounted_price = EXCLUDED.discounted_price,
        actual_price = EXCLUDED.actual_price
    `;
    return pool.query(query, values);
  },

  // Find all with filters
  findAll: async ({ search, category, minRating, minReviews, limit, offset }) => {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (search) {
      conditions.push(`product_name ILIKE $${idx++}`);
      values.push(`%${search}%`);
    }
    if (category) {
      conditions.push(`category_main ILIKE $${idx++}`);
      values.push(`%${category}%`);
    }
    if (minRating > 0) {
      conditions.push(`rating >= $${idx++}`);
      values.push(minRating);
    }
    if (minReviews > 0) {
      conditions.push(`rating_count >= $${idx++}`);
      values.push(minReviews);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countRes = await pool.query(`SELECT COUNT(*) FROM products ${where}`, values);
    const dataRes = await pool.query(
      `SELECT * FROM products ${where} ORDER BY id DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limit, offset]
    );

    return {
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count)
    };
  },

  // Get Analytics Stats
  getStats: async () => {
    const res = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(DISTINCT category_main) as total_categories,
        COALESCE(ROUND(AVG(rating)::numeric, 2), 0) as avg_rating,
        COALESCE(SUM(rating_count), 0) as total_reviews,
        COALESCE(ROUND(AVG(discount_percentage)::numeric, 1), 0) as avg_discount
      FROM products
    `);
    return res.rows[0];
  },

  // Other analytics
  getProductsPerCategory: async () => {
    const res = await pool.query(`
      SELECT category_main as category, COUNT(*) as count 
      FROM products 
      GROUP BY category_main ORDER BY count DESC LIMIT 10
    `);
    return res.rows;
  }
};

module.exports = Product;
