const Product = require('../models/Product');
const pool = require('../config/db'); // for specific analytics not in model

exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const result = await Product.findAll({
      search: req.query.search || '',
      category: req.query.category || '',
      minRating: parseFloat(req.query.minRating) || 0,
      minReviews: parseInt(req.query.minReviews) || 0,
      limit,
      offset
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const data = await Product.getStats();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category_main FROM products ORDER BY category_main');
    res.json({ success: true, data: result.rows.map(r => r.category_main) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getProductsPerCategory = async (req, res) => {
  try {
    const data = await Product.getProductsPerCategory();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getTopReviewed = async (req, res) => {
  try {
    const result = await pool.query('SELECT product_name, rating_count FROM products ORDER BY rating_count DESC LIMIT 10');
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
      FROM products GROUP BY range ORDER BY range
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getCategoryAvgRating = async (req, res) => {
  try {
    const result = await pool.query('SELECT category_main as category, ROUND(AVG(rating)::numeric, 2) as avg_rating FROM products GROUP BY category_main ORDER BY avg_rating DESC LIMIT 10');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
