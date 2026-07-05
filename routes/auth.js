const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB } = require('../database');
const { generateToken, verifyToken } = require('../middleware/auth');
const router = express.Router();

function query(sql, params = []) {
  const db = getDB();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const result = [];
  while (stmt.step()) {
    result.push(stmt.getAsObject());
  }
  stmt.free();
  return result;
}

function queryOne(sql, params = []) {
  const rows = query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function execute(sql, params = []) {
  const db = getDB();
  db.run(sql, params);
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }
  const user = queryOne('SELECT * FROM usuarios WHERE username = ? AND activo = 1', [username]);
  if (!user) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, username: user.username, nombre: user.nombre, rol: user.rol, sucursalId: user.sucursalId }
  });
});

router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
