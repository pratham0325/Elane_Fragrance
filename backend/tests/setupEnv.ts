// Minimal env so config/env.ts validation passes under test.
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elane_test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_long_enough';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_long_enough';
process.env.AI_PROVIDER = 'none';
process.env.AI_API_KEY = '';
