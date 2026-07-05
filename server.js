const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./database');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Ruta no encontrada' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize DB and start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`👑 Joyería API corriendo en http://localhost:${PORT}`);
    console.log(`🔐 Acceso: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Error al inicializar la base de datos:', err);
  process.exit(1);
});
