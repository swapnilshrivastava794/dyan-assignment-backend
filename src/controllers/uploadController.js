const xlsx = require('xlsx');
const Product = require('../models/Product');

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
  return { full: catString, main: parts[0] || 'Other' };
};

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    console.log("File received, starting processing...");

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // This is where it might fail if DB connection is wrong
    await Product.initTable();

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
        await Product.upsert(values);
        successCount++;
      } catch (err) {
        // Log individual row errors but continue
        console.error(`Row fail: ${row.product_id}`, err.message);
      }
    }

    res.json({ success: true, message: `${successCount} products uploaded successfully!` });
  } catch (error) {
    console.error('CRITICAL UPLOAD ERROR:', error);
    // Returning the actual error message to the frontend for debugging
    res.status(500).json({ 
      success: false, 
      message: 'Error processing file', 
      error: error.message,
      stack: error.stack // Optional: remove this after debugging
    });
  }
};
