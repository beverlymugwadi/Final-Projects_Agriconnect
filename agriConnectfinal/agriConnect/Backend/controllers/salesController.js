// controllers/salesController.js
const Sale = require('../models/Sale');
const mongoose = require('mongoose');

// Get sales summary for a farmer
exports.getSalesSummary = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    const farmerId = new mongoose.Types.ObjectId(req.user.id);

    // Get total sales amount
    const totalSalesResult = await Sale.aggregate([
      { $match: { farmer: farmerId } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].total : 0;

    // Get monthly sales for the past 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySales = await Sale.aggregate([
      { 
        $match: { 
          farmer: farmerId,
          createdAt: { $gte: sixMonthsAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Format monthly sales data
    const formattedMonthlySales = monthlySales.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      amount: item.total
    }));

    // Get recent orders (last 5)
    const recentOrders = await Sale.find({ farmer: farmerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name')
      .populate('products.product', 'name');

    res.json({
      success: true,
      totalSales,
      monthlySales: formattedMonthlySales,
      recentOrders
    });
  } catch (error) {
    console.error('Sales summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
