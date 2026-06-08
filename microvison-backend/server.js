const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/cities', require('./routes/city.routes'));
app.use('/api/presets', require('./routes/preset.routes'));
app.use('/api/service-centres', require('./routes/serviceCentre.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/complaints', require('./routes/complaint.routes'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
