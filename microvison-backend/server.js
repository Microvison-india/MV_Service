const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();

// Connect to database
connectDB().then(() => {
  const migrateLegacyComplaints = require('./utils/migrateLegacyComplaints');
  migrateLegacyComplaints();

  // Auto-seed admins from environment variables on startup
  const seedAdmins = require('./utils/seedAdmins');
  seedAdmins();
});

const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_WWW,
  'https://microvisonservice.co.in',
  'https://www.microvisonservice.co.in',
  'https://mv-service.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/cities', require('./routes/city.routes'));
app.use('/api/presets', require('./routes/preset.routes'));
app.use('/api/service-centres', require('./routes/serviceCentre.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/complaints', require('./routes/complaint.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
