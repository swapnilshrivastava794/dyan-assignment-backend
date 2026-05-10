const xlsx = require('xlsx');
const pool = require('../config/db');

// Helper to clean numeric strings
const cleanNumber = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const parseCategory = (catString) => {
  if (!catString) return { full: '', main: 'Other' };
  const parts = catString.split('|').map((s) => s.trim());
  return {
    full: catString,
    main: parts[0] || 'Other',
  };
};

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log(`Starting upload for ${data.length} products...`);

    // Ensure table exists
    await pool.query(`
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

    let successCount = 0;
    for (const row of data) {
      const cat = parseCategory(row.category);
      const discountedPrice = cleanNumber(row.discounted_price);
      const actualPrice = cleanNumber(row.actual_price);
      const rating = cleanNumber(row.rating);
      const ratingCount = Math.floor(cleanNumber(row.rating_count));
      
      let discountPerc = cleanNumber(row.discount_percentage);
      if (discountPerc === 0 && actualPrice > 0) {
        discountPerc = Math.round(((actualPrice - discountedPrice) / actualPrice) * 100);
      }

      const values = [
        row.product_id || `ID-${Math.random().toString(36).substr(2, 9)}`,
        row.product_name || 'No Name',
        cat.full,
        cat.main,
        discountedPrice,
        actualPrice,
        discountPerc,
        rating,
        ratingCount,
        row.about_product || '',
        row.user_id || '',
        row.user_name || '',
        row.review_id || '',
        row.review_title || '',
        row.review_content || '',
        row.img_link || '',
        row.product_link || ''
      ];

      try {
        await pool.query(`
          INSERT INTO products (
            product_id, product_name, category, category_main, 
            discounted_price, actual_price, discount_percentage, 
            rating, rating_count, about_product, user_id, user_name, 
            review_id, review_title, review_content, img_link, product_link
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (product_id) DO UPDATE SET
            product_name = EXCLUDED.product_name,
            rating = EXCLUDED.rating,
            rating_count = EXCLUDED.rating_count
        `, values);
        successCount++;
      } catch (err) {
        console.error(`Row fail: ${row.product_id}`, err.message);
      }
    }

    console.log(`Successfully uploaded ${successCount} products.`);
    res.json({ success: true, message: `${successCount} products uploaded successfully!` });
  } catch (error) {
    console.error('Critical Upload Error:', error);
    res.status(500).json({ success: false, message: 'Error processing file' });
  }
};
