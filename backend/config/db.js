import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { execSync } from 'child_process';

// Global in-memory storage simulating MongoDB collections
const memoryStore = {
  User: [],
  Campaign: [],
  Customer: [],
  Communication: [],
  AIInsight: []
};

// Generate random mock database object IDs
const generateMockId = () => Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);

// Helper to compile Mongoose query matching
const matchesQuery = (item, query) => {
  if (!query) return true;
  for (const key in query) {
    const queryValue = query[key];
    const itemValue = item[key];

    // If query values contain sub-queries (like Mongoose ObjectId comparison)
    if (queryValue && typeof queryValue === 'object' && queryValue._id) {
      if (itemValue?.toString() !== queryValue._id.toString()) return false;
    } else if (queryValue instanceof RegExp) {
      if (!queryValue.test(String(itemValue))) return false;
    } else if (itemValue?.toString() !== queryValue?.toString()) {
      return false;
    }
  }
  return true;
};

// A thenable query simulator to support Mongoose style query chaining:
// e.g. User.findById(id).select('-password')
class MockQuery {
  constructor(execFn) {
    this.execFn = execFn;
  }

  select() {
    return this;
  }

  populate() {
    return this;
  }

  sort(sortRule) {
    // Wrap current execFn with sorting logic
    const oldFn = this.execFn;
    this.execFn = async () => {
      const results = await oldFn();
      if (Array.isArray(results) && sortRule && typeof sortRule === 'object') {
        const sortKey = Object.keys(sortRule)[0];
        const sortDirection = sortRule[sortKey];
        return [...results].sort((a, b) => {
          if (a[sortKey] < b[sortKey]) return sortDirection === -1 ? 1 : -1;
          if (a[sortKey] > b[sortKey]) return sortDirection === -1 ? -1 : 1;
          return 0;
        });
      }
      return results;
    };
    return this;
  }

  // Thenable implementation to support await query
  async then(onResolve, onReject) {
    try {
      const result = await this.execFn();
      return onResolve(result);
    } catch (err) {
      if (onReject) return onReject(err);
      throw err;
    }
  }
}

// Custom Mock Model Factory
const createMockModel = (modelName, schema) => {
  console.log(`[Database Mock] Compiling in-memory Model: ${modelName}`);

  class MockModel {
    constructor(data = {}) {
      this._id = data._id || generateMockId();
      this.createdAt = data.createdAt || new Date();
      
      // Load schema default values
      if (schema && schema.obj) {
        for (const field in schema.obj) {
          if (schema.obj[field].default !== undefined) {
            this[field] = typeof schema.obj[field].default === 'function' 
              ? schema.obj[field].default() 
              : schema.obj[field].default;
          }
        }
      }

      // Merge data properties
      Object.assign(this, data);

      // Copy methods from mongoose schema
      if (schema && schema.methods) {
        for (const methodName in schema.methods) {
          this[methodName] = schema.methods[methodName].bind(this);
        }
      }
    }

    // Instance save method (upsert in-memory collection)
    async save() {
      // If it is a User model, trigger password hashing mock
      if (modelName === 'User' && this.password && !this.password.startsWith('$2a$')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      }

      const collection = memoryStore[modelName];
      const idx = collection.findIndex(item => item._id.toString() === this._id.toString());
      if (idx >= 0) {
        collection[idx] = this;
      } else {
        collection.push(this);
      }
      return this;
    }

    isModified(field) {
      return true;
    }
  }

  // Model Static Query Methods returning MockQuery
  MockModel.find = (query = {}) => {
    return new MockQuery(async () => {
      const collection = memoryStore[modelName] || [];
      return collection.filter(item => matchesQuery(item, query));
    });
  };

  MockModel.findOne = (query = {}) => {
    return new MockQuery(async () => {
      const collection = memoryStore[modelName] || [];
      const results = collection.filter(item => matchesQuery(item, query));
      return results[0] || null;
    });
  };

  MockModel.findById = (id) => {
    return new MockQuery(async () => {
      const collection = memoryStore[modelName] || [];
      return collection.find(item => item._id.toString() === id?.toString()) || null;
    });
  };

  MockModel.countDocuments = async (query = {}) => {
    const collection = memoryStore[modelName] || [];
    const results = collection.filter(item => matchesQuery(item, query));
    return results.length;
  };

  MockModel.deleteMany = async (query = {}) => {
    const collection = memoryStore[modelName] || [];
    const keptItems = collection.filter(item => !matchesQuery(item, query));
    memoryStore[modelName] = keptItems;
    return { deletedCount: collection.length - keptItems.length };
  };

  MockModel.insertMany = async (arr = []) => {
    const savedDocs = [];
    for (const data of arr) {
      const doc = new MockModel(data);
      await doc.save();
      savedDocs.push(doc);
    }
    return savedDocs;
  };

  MockModel.findOneAndUpdate = (query = {}, update = {}, options = {}) => {
    return new MockQuery(async () => {
      const collection = memoryStore[modelName] || [];
      let item = collection.find(item => matchesQuery(item, query));
      
      if (!item) {
        if (options.upsert) {
          const newFields = { ...query };
          if (update.$set) {
            Object.assign(newFields, update.$set);
          } else {
            Object.assign(newFields, update);
          }
          item = new MockModel(newFields);
          await item.save();
          return item;
        }
        return null;
      }

      if (update.$set) {
        Object.assign(item, update.$set);
      } else {
        Object.assign(item, update);
      }
      // Re-save to store
      const idx = collection.findIndex(d => d._id.toString() === item._id.toString());
      if (idx >= 0) collection[idx] = item;
      return item;
    });
  };

  return MockModel;
};

// Check database availability synchronously
let useMock = false;
try {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-mini-crm';
  if (uri.includes('127.0.0.1') || uri.includes('localhost')) {
    // Run a quick port status check based on platform (Windows vs Linux/Mac)
    if (process.platform === 'win32') {
      execSync('netstat -ano | findstr 27017');
    } else {
      execSync('nc -z 127.0.0.1 27017 || ss -lnt || grep 27017', { stdio: 'ignore' });
    }
    console.log('[Database] MongoDB active port detected locally.');
  }
} catch (err) {
  // If netstat exits with code 1 (no connection), it throws, entering here
  console.log('[Database] Local MongoDB inactive. Activating in-memory mock interceptor.');
  useMock = true;

  // Intercept mongoose model definitions synchronously
  const originalModel = mongoose.model;
  mongoose.model = function(name, schema) {
    if (!memoryStore[name]) {
      memoryStore[name] = [];
    }
    return createMockModel(name, schema);
  };
}

const connectDB = async () => {
  if (useMock) {
    console.warn(`
┌────────────────────────────────────────────────────────┐
│           ⚠  COULD NOT CONNECT TO MONGO DB             │
├────────────────────────────────────────────────────────┤
│ Local MongoDB is offline or not installed.             │
├────────────────────────────────────────────────────────┤
│ Mock DB mode is active! All campaigns and customer     │
│ profiles will be securely saved in server memory.      │
└────────────────────────────────────────────────────────┘
`);
    return;
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-mini-crm', {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn('[Database] Connection timeout. Switching to Mongoose mock engine.');
    useMock = true;
    const originalModel = mongoose.model;
    mongoose.model = function(name, schema) {
      if (!memoryStore[name]) {
        memoryStore[name] = [];
      }
      return createMockModel(name, schema);
    };
  }
};

export default connectDB;
