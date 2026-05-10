const pool = require('../config/db');

exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const minRating = parseFloat(req.query.minRating) || 0;
    const minReviews = parseInt(req.query.minReviews) || 0;

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

    console.log(`Fetching products: Page ${page}, Limit ${limit}, Search: "${search}"`);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM products ${where}`,
      values
    );

    const result = await pool.query(
      `SELECT * FROM products ${where} ORDER BY id DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limit, offset]
    );

    console.log(`Found ${result.rows.length} products (Total: ${countResult.rows[0].count})`);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- Analytics Functions ---

exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category_main FROM products WHERE category_main IS NOT NULL ORDER BY category_main'
    );
    res.json({ success: true, data: result.rows.map((r) => r.category_main) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(DISTINCT category_main) as total_categories,
        COALESCE(ROUND(AVG(rating)::numeric, 2), 0) as avg_rating,
        COALESCE(SUM(rating_count), 0) as total_reviews,
        COALESCE(ROUND(AVG(discount_percentage)::numeric, 1), 0) as avg_discount
      FROM products
    `);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getProductsPerCategory = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT category_main as category, COUNT(*) as count 
      FROM products 
      GROUP BY category_main 
      ORDER BY count DESC 
      LIMIT 10
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getTopReviewed = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT product_name, rating_count 
      FROM products 
      ORDER BY rating_count DESC 
      LIMIT 10
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getDiscountDistribution = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        CASE 
          WHEN discount_percentage < 10 THEN '0-10%'
          WHEN discount_percentage < 30 THEN '10-30%'
          WHEN discount_percentage < 50 THEN '30-50%'
          WHEN discount_percentage < 70 THEN '50-70%'
          ELSE '70%+' 
        END as range,
        COUNT(*) as count
      FROM products
      GROUP BY range
      ORDER BY range
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getCategoryAvgRating = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT category_main as category, COALESCE(ROUND(AVG(rating)::numeric, 2), 0) as avg_rating
      FROM products
      GROUP BY category_main
      ORDER BY avg_rating DESC
      LIMIT 10
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
