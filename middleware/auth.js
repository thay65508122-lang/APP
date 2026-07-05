const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'JoyeriaSecretKey2024';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, rol: user.rol, nombre: user.nombre, sucursalId: user.sucursalId },
    SECRET,
    { expiresIn: '24h' }
  );
}

function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acción solo para administradores' });
  }
  next();
}

module.exports = { generateToken, verifyToken, requireAdmin };
