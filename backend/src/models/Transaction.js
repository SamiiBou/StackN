import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  stockSymbol: {
    type: String,
    required: [true, 'Stock symbol is required'],
    uppercase: true,
    trim: true
  },
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: [true, 'Stock ID is required']
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: ['BUY', 'SELL', 'DIVIDEND', 'SPLIT', 'MERGER', 'SPINOFF'],
    default: 'BUY'
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  fees: {
    type: Number,
    default: 0,
    min: [0, 'Fees cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'HKD', 'SGD'],
    default: 'USD'
  },
  exchangeRate: {
    type: Number,
    default: 1,
    min: [0, 'Exchange rate cannot be negative']
  },
  transactionDate: {
    type: Date,
    required: [true, 'Transaction date is required'],
    default: Date.now
  },
  settlementDate: {
    type: Date,
    required: [true, 'Settlement date is required']
  },
  orderId: {
    type: String,
    trim: true,
    maxlength: [100, 'Order ID cannot exceed 100 characters']
  },
  orderType: {
    type: String,
    enum: ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'TRAILING_STOP'],
    default: 'MARKET'
  },
  status: {
    type: String,
    enum: ['PENDING', 'EXECUTED', 'PARTIALLY_FILLED', 'CANCELLED', 'REJECTED'],
    default: 'EXECUTED'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  source: {
    type: String,
    enum: ['MANUAL', 'API', 'IMPORT', 'SYSTEM'],
    default: 'MANUAL'
  },
  dividendInfo: {
    exDate: {
      type: Date
    },
    paymentDate: {
      type: Date
    },
    dividendPerShare: {
      type: Number,
      min: [0, 'Dividend per share cannot be negative']
    },
    dividendType: {
      type: String,
      enum: ['CASH', 'STOCK', 'SPECIAL'],
      default: 'CASH'
    }
  },
  splitInfo: {
    ratio: {
      type: String, // e.g., "2:1" or "1:2"
      trim: true
    },
    splitDate: {
      type: Date
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    broker: {
      type: String,
      trim: true,
      maxlength: [100, 'Broker name cannot exceed 100 characters']
    },
    account: {
      type: String,
      trim: true,
      maxlength: [100, 'Account cannot exceed 100 characters']
    },
    platform: {
      type: String,
      trim: true,
      maxlength: [100, 'Platform cannot exceed 100 characters']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for net amount (total amount +/- fees)
transactionSchema.virtual('netAmount').get(function() {
  if (this.type === 'BUY') {
    return this.totalAmount + this.fees;
  } else if (this.type === 'SELL') {
    return this.totalAmount - this.fees;
  }
  return this.totalAmount;
});

// Virtual for formatted transaction date
transactionSchema.virtual('formattedTransactionDate').get(function() {
  return this.transactionDate.toLocaleDateString();
});

// Virtual for days since transaction
transactionSchema.virtual('daysSinceTransaction').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.transactionDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Calculate total amount before saving
transactionSchema.pre('save', function(next) {
  if (this.isModified('quantity') || this.isModified('price')) {
    this.totalAmount = this.quantity * this.price;
  }
  
  // Set settlement date if not provided (T+2 for stocks)
  if (!this.settlementDate) {
    const settlement = new Date(this.transactionDate);
    settlement.setDate(settlement.getDate() + 2);
    this.settlementDate = settlement;
  }
  
  next();
});

// Static method to get user's transaction history
transactionSchema.statics.getUserTransactionHistory = function(userId, options = {}) {
  const {
    symbol,
    type,
    startDate,
    endDate,
    limit = 50,
    skip = 0,
    sort = { transactionDate: -1 }
  } = options;
  
  const filter = { userId, isActive: true };
  
  if (symbol) filter.stockSymbol = symbol;
  if (type) filter.type = type;
  if (startDate || endDate) {
    filter.transactionDate = {};
    if (startDate) filter.transactionDate.$gte = new Date(startDate);
    if (endDate) filter.transactionDate.$lte = new Date(endDate);
  }
  
  return this.find(filter)
    .populate('stockId', 'name sector exchange')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get transaction summary
transactionSchema.statics.getTransactionSummary = function(userId, period = 'all') {
  const filter = { userId, isActive: true };
  
  if (period !== 'all') {
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    filter.transactionDate = { $gte: startDate };
  }
  
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalFees: { $sum: '$fees' },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);
};

// Create indexes for better performance
transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ stockSymbol: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, stockSymbol: 1, transactionDate: -1 });
transactionSchema.index({ type: 1, transactionDate: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ settlementDate: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction; 