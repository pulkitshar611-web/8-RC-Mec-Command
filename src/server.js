const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080',
    'https://8rcmeccommand.kiaantechnology.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Assuming you want separate admin routes

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/topics', require('./routes/topicRoutes'));
app.use('/api/meta', require('./routes/metaRoutes'));

app.get('/', (req, res) => {
  res.json({ message: "Welcome to Institutional Platform API v1.4" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Trigger restart for .env changes
