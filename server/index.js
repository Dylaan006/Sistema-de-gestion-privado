import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.routes.js'; // Importamos las rutas

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Usamos las rutas de autenticación
// Todo lo que esté en authRoutes empezará con /api/auth
app.use('/api/auth', authRoutes); 

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});