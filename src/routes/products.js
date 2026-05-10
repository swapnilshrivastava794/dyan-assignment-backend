const express = require('express');
const router = express.Router();
const {
  getProducts,
  getCategories,
  getStats,
  getProductsPerCategory,
  getTopReviewed,
  getDiscountDistribution,
  getCategoryAvgRating,
} = require('../controllers/productController');

// Main product routes
router.get('/', getProducts);
router.get('/categories', getCategories);

// Analytics routes
router.get('/analytics/stats', getStats);
router.get('/analytics/products-per-category', getProductsPerCategory);
router.get('/analytics/top-reviewed', getTopReviewed);
router.get('/analytics/discount-distribution', getDiscountDistribution);
router.get('/analytics/category-avg-rating', getCategoryAvgRating);

module.exports = router;
