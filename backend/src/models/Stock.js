import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'Stock symbol is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Stock symbol cannot exceed 10 characters']
  },
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  exchange: {
    type: String,
    required: [true, 'Exchange is required'],
    enum: ['NYSE', 'NASDAQ', 'LSE', 'TSE', 'EURONEXT', 'TSX', 'ASX', 'SSE', 'SZSE', 'OTHER'],
    default: 'NYSE'
  },
  sector: {
    type: String,
    required: [true, 'Sector is required'],
    enum: [
      'Technology',
      'Healthcare',
      'Financial Services',
      'Consumer Cyclical',
      'Consumer Defensive',
      'Energy',
      'Utilities',
      'Real Estate',
      'Materials',
      'Industrials',
      'Communication Services',
      'Other'
    ]
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true,
    maxlength: [100, 'Industry cannot exceed 100 characters']
  },
  currentPrice: {
    type: Number,
    required: [true, 'Current price is required'],
    min: [0, 'Price cannot be negative']
  },
  previousClose: {
    type: Number,
    required: [true, 'Previous close is required'],
    min: [0, 'Price cannot be negative']
  },
  changePercent: {
    type: Number,
    required: [true, 'Change percent is required']
  },
  changeAmount: {
    type: Number,
    required: [true, 'Change amount is required']
  },
  dayHigh: {
    type: Number,
    required: [true, 'Day high is required'],
    min: [0, 'Price cannot be negative']
  },
  dayLow: {
    type: Number,
    required: [true, 'Day low is required'],
    min: [0, 'Price cannot be negative']
  },
  volume: {
    type: Number,
    required: [true, 'Volume is required'],
    min: [0, 'Volume cannot be negative']
  },
  averageVolume: {
    type: Number,
    required: [true, 'Average volume is required'],
    min: [0, 'Volume cannot be negative']
  },
  marketCap: {
    type: Number,
    required: [true, 'Market cap is required'],
    min: [0, 'Market cap cannot be negative']
  },
  peRatio: {
    type: Number,
    min: [0, 'PE ratio cannot be negative'],
    default: null
  },
  dividendYield: {
    type: Number,
    min: [0, 'Dividend yield cannot be negative'],
    default: null
  },
  beta: {
    type: Number,
    default: null
  },
  week52High: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    default: null
  },
  week52Low: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    default: null
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  website: {
    type: String,
    trim: true,
    maxlength: [200, 'Website URL cannot exceed 200 characters']
  },
  logo: {
    type: String,
    trim: true,
    maxlength: [500, 'Logo URL cannot exceed 500 characters']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'HKD', 'SGD'],
    default: 'USD'
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    maxlength: [100, 'Country cannot exceed 100 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  employees: {
    type: Number,
    min: [0, 'Employee count cannot be negative'],
    default: null
  },
  founded: {
    type: Number,
    min: [1800, 'Founded year seems too old'],
    max: [new Date().getFullYear(), 'Founded year cannot be in the future'],
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for price change direction
stockSchema.virtual('priceDirection').get(function() {
  if (this.changeAmount > 0) return 'up';
  if (this.changeAmount < 0) return 'down';
  return 'neutral';
});

// Virtual for formatted market cap
stockSchema.virtual('marketCapFormatted').get(function() {
  if (this.marketCap >= 1e12) {
    return `$${(this.marketCap / 1e12).toFixed(2)}T`;
  } else if (this.marketCap >= 1e9) {
    return `$${(this.marketCap / 1e9).toFixed(2)}B`;
  } else if (this.marketCap >= 1e6) {
    return `$${(this.marketCap / 1e6).toFixed(2)}M`;
  } else {
    return `$${this.marketCap.toFixed(2)}`;
  }
});

// Virtual for formatted volume
stockSchema.virtual('volumeFormatted').get(function() {
  if (this.volume >= 1e9) {
    return `${(this.volume / 1e9).toFixed(2)}B`;
  } else if (this.volume >= 1e6) {
    return `${(this.volume / 1e6).toFixed(2)}M`;
  } else if (this.volume >= 1e3) {
    return `${(this.volume / 1e3).toFixed(2)}K`;
  } else {
    return this.volume.toString();
  }
});

// Update lastUpdated before saving
stockSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Create indexes for better performance
stockSchema.index({ symbol: 1 });
stockSchema.index({ exchange: 1 });
stockSchema.index({ sector: 1 });
stockSchema.index({ marketCap: -1 });
stockSchema.index({ volume: -1 });
stockSchema.index({ lastUpdated: -1 });

const Stock = mongoose.model('Stock', stockSchema);

export default Stock; 