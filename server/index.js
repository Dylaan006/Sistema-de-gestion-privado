import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './src/utils/logger.js';
import prisma from './prismaClient.js';

import authRoutes from './src/routes/auth.routes.js';
import userRoutes from './src/routes/user.routes.js';
import productRoutes from './src/routes/product.routes.js';
import stockRoutes from './src/routes/stock.routes.js';
import saleRoutes from './src/routes/sale.routes.js';
import organizationRoutes from './src/routes/organization.routes.js';
import clientRoutes from './src/routes/client.routes.js';
import afipRoutes from './src/routes/afip.routes.js';
import statsRoutes from './src/routes/stats.routes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Request Logger Middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/afip', afipRoutes);
app.use('/api/stock', stockRoutes); // Mount stock routes at /api/stock
app.use('/api/stats', statsRoutes);

// Mount routes that define their own paths (legacy or mixed)
app.use('/api', productRoutes); // Handles /products
app.use('/api', saleRoutes);    // Handles /sales


// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled Error', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
});