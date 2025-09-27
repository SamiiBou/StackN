import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const TURNKEY_STATUS_VALUES = ['not_started', 'pending', 'migrated', 'completed', 'error', 'not_required'];

const TurnkeyMetadataSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: TURNKEY_STATUS_VALUES,
  },
  subOrganizationId: {
    type: String,
    default: null,
  },
  walletId: {
    type: String,
    default: null,
  },
  rootUserId: {
    type: String,
    default: null,
  },
  apiKeyId: {
    type: String,
    default: null,
  },
  accountId: {
    type: String,
    default: null,
  },
  walletAccountId: {
    type: String,
    default: null,
  },
  curve: {
    type: String,
    default: 'API_KEY_CURVE_SECP256K1',
  },
  publicKey: {
    type: String,
    default: null,
  },
  migratedAt: {
    type: Date,
    default: null,
  },
  lastCheckedAt: {
    type: Date,
    default: null,
  },
  lastError: {
    type: String,
    default: null,
  },
}, {
  _id: false,
  minimize: true,
});

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  balance: {
    type: Number,
    default: 10000.00, // Starting balance
    min: [0, 'Balance cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      acceptedAt: {
        type: Date,
        default: null
      },
      priceAlerts: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']
    }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // World ID authentication
  worldId: {
    type: String,
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness
  },
  worldIdVerified: {
    type: Boolean,
    default: false
  },
  // World Wallet Address (Worldchain)
  worldAddress: {
    type: String,
    default: null,
    lowercase: true,
    trim: true
  },
  // Partner user flag and metadata
  isPartnerUser: {
    type: Boolean,
    default: false,
    index: true
  },
  partnerInfo: {
    source: { type: String, default: null },
    referrer: { type: String, default: null },
    appId: { type: String, default: null },
    firstSeenAt: { type: Date, default: null }
  },
  // Solana wallet information
  solanaWallet: {
    storage: {
      type: String,
      enum: ['vault', 'kms'],
      default: 'vault'
    },
    publicKey: {
      type: String,
      default: null
    },
    kmsKeyId: {
      type: String,
      default: null // Legacy Google Cloud KMS key identifier (unused)
    },
    // Vault payload when storage === 'vault'
    vault: {
      cipherText: { type: String, default: null },
      iv: { type: String, default: null },
      authTag: { type: String, default: null },
      salt: { type: String, default: null },
      version: { type: Number, default: null }
    },
    createdAt: {
      type: Date,
      default: null
    },
    vaultMigratedAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  // World wallet public key cache (recovered via SIWE)
  worldAddressPublicKey: {
    type: String,
    default: null,
    lowercase: true,
  },
  // Turnkey migration metadata
  turnkey: {
    type: TurnkeyMetadataSchema,
    default: undefined,
  },
  // First login tracking
  firstWorldIdLogin: {
    type: Date,
    default: null
  },
  // Portfolio tracking for Solana stocks
  portfolio: {
    stocks: [{
      symbol: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      solanaAddress: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 0
      },
      averagePrice: {
        type: Number,
        required: true,
        min: 0
      },
      totalInvested: {
        type: Number,
        required: true,
        min: 0
      },
      firstPurchaseDate: {
        type: Date,
        required: true
      },
      lastPurchaseDate: {
        type: Date,
        required: true
      },
      purchaseHistory: [{
        date: {
          type: Date,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 0
        },
        pricePerToken: {
          type: Number,
          required: true,
          min: 0
        },
        totalAmount: {
          type: Number,
          required: true,
          min: 0
        },
        transactionHash: {
          type: String,
          required: true
        },
        flowId: {
          type: String,
          required: true
        }
      }]
    }],
    totalValue: {
      type: Number,
      default: 0,
      min: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Hide sensitive fields when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  return user;
};

// Create indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

export default User; 
