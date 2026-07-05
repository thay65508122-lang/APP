const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB } = require('../database');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken);

// === HELPERS ===
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

function _id() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
function _now() {
  return new Date().toISOString();
}

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', (req, res) => {
  const totalProductos = queryOne('SELECT COUNT(*) as c FROM productos WHERE activo = 1').c;
  const totalSucursales = queryOne('SELECT COUNT(*) as c FROM sucursales WHERE activa = 1').c;
  const totalClientes = queryOne('SELECT COUNT(*) as c FROM clientes').c;
  const totalProveedores = queryOne('SELECT COUNT(*) as c FROM proveedores').c;
  const totalEmpleados = queryOne('SELECT COUNT(*) as c FROM usuarios WHERE activo = 1').c;
  const totalItems = queryOne('SELECT COALESCE(SUM(cantidad),0) as c FROM inventario').c;
  const totalValor = queryOne('SELECT COALESCE(SUM(i.cantidad * p.precio),0) as c FROM inventario i JOIN productos p ON p.id = i.productoId WHERE p.activo = 1').c;
  const totalCosto = queryOne('SELECT COALESCE(SUM(i.cantidad * p.costo),0) as c FROM inventario i JOIN productos p ON p.id = i.productoId WHERE p.activo = 1').c;
  const bajoStock = queryOne('SELECT COUNT(*) as c FROM inventario WHERE cantidad < 5').c;
  const productosPorMetal = query('SELECT metal, COUNT(*) as count FROM productos WHERE activo = 1 GROUP BY metal');
  const movimientos = query(`SELECT m.*, p.nombre as productoNombre, s.nombre as sucursalNombre
    FROM movimientos m LEFT JOIN productos p ON p.id = m.productoId LEFT JOIN sucursales s ON s.id = m.sucursalId
    ORDER BY m.fecha DESC LIMIT 10`);
  const bajoStockDetalle = query(`SELECT i.*, p.nombre as productoNombre, s.nombre as sucursalNombre
    FROM inventario i JOIN productos p ON p.id = i.productoId JOIN sucursales s ON s.id = i.sucursalId
    WHERE i.cantidad < 5 ORDER BY i.cantidad ASC LIMIT 5`);

  res.json({
    totalProductos, totalSucursales, totalClientes, totalProveedores,
    totalEmpleados, totalItems, totalValorInventario: totalValor,
    totalCostoInventario: totalCosto, gananciaPotencial: totalValor - totalCosto,
    productosBajoStock: bajoStock, productosPorMetal,
    movimientos, bajoStock: bajoStockDetalle
  });
});

// ==================== PRODUCTOS ====================
router.get('/productos', (req, res) => {
  res.json(query('SELECT * FROM productos WHERE activo = 1 ORDER BY fechaRegistro DESC'));
});

router.get('/productos/:id', (req, res) => {
  const p = queryOne('SELECT * FROM productos WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(p);
});

router.post('/productos', (req, res) => {
  const p = req.body;
  const id = _id();
  const now = _now();
  execute('INSERT INTO productos (id, nombre, tipo, metal, pureza, peso, gema, tallaGema, año, precio, costo, descripcion, activo, fechaRegistro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)',
    [id, p.nombre, p.tipo, p.metal, p.pureza, p.peso, p.gema, p.tallaGema, p.año, p.precio, p.costo, p.descripcion, now]);
  const sucursales = query('SELECT id FROM sucursales WHERE activa = 1');
  for (const s of sucursales) {
    execute('INSERT INTO inventario (id, sucursalId, productoId, cantidad, fechaRegistro) VALUES (?, ?, ?, 0, ?)',
      [_id(), s.id, id, now]);
  }
  res.status(201).json(queryOne('SELECT * FROM productos WHERE id = ?', [id]));
});

router.put('/productos/:id', (req, res) => {
  const p = req.body;
  execute('UPDATE productos SET nombre=?, tipo=?, metal=?, pureza=?, peso=?, gema=?, tallaGema=?, año=?, precio=?, costo=?, descripcion=? WHERE id=?',
    [p.nombre, p.tipo, p.metal, p.pureza, p.peso, p.gema, p.tallaGema, p.año, p.precio, p.costo, p.descripcion, req.params.id]);
  res.json(queryOne('SELECT * FROM productos WHERE id = ?', [req.params.id]));
});

router.delete('/productos/:id', (req, res) => {
  execute('UPDATE productos SET activo = 0 WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ==================== SUCURSALES ====================
router.get('/sucursales', (req, res) => {
  const sucursales = query('SELECT * FROM sucursales WHERE activa = 1 ORDER BY fechaRegistro DESC');
  const result = sucursales.map(s => {
    const inv = queryOne('SELECT COALESCE(SUM(cantidad),0) as totalItems FROM inventario WHERE sucursalId = ?', [s.id]);
    const valor = queryOne('SELECT COALESCE(SUM(i.cantidad * p.precio),0) as v FROM inventario i JOIN productos p ON p.id = i.productoId WHERE i.sucursalId = ?', [s.id]);
    const empleados = queryOne('SELECT COUNT(*) as c FROM usuarios WHERE sucursalId = ? AND activo = 1', [s.id]);
    const bajoStock = queryOne('SELECT COUNT(*) as c FROM inventario WHERE sucursalId = ? AND cantidad < 5', [s.id]);
    return { ...s, totalItems: inv.totalItems, totalValor: valor.v, empleados: empleados.c, bajoStock: bajoStock.c };
  });
  res.json(result);
});

router.post('/sucursales', (req, res) => {
  const s = req.body;
  const id = _id();
  execute('INSERT INTO sucursales (id, nombre, direccion, telefono, activa, fechaRegistro) VALUES (?, ?, ?, ?, 1, ?)',
    [id, s.nombre, s.direccion, s.telefono, _now()]);
  const productos = query('SELECT id FROM productos WHERE activo = 1');
  for (const p of productos) {
    execute('INSERT INTO inventario (id, sucursalId, productoId, cantidad, fechaRegistro) VALUES (?, ?, ?, 0, ?)',
      [_id(), id, p.id, _now()]);
  }
  res.status(201).json(queryOne('SELECT * FROM sucursales WHERE id = ?', [id]));
});

router.put('/sucursales/:id', (req, res) => {
  const s = req.body;
  execute('UPDATE sucursales SET nombre=?, direccion=?, telefono=? WHERE id=?',
    [s.nombre, s.direccion, s.telefono, req.params.id]);
  res.json(queryOne('SELECT * FROM sucursales WHERE id = ?', [req.params.id]));
});

router.delete('/sucursales/:id', (req, res) => {
  execute('UPDATE sucursales SET activa = 0 WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ==================== INVENTARIO ====================
router.get('/inventario', (req, res) => {
  let sql = `SELECT i.*, p.nombre as productoNombre, p.tipo, p.metal, p.precio, p.costo,
    s.nombre as sucursalNombre FROM inventario i
    JOIN productos p ON p.id = i.productoId
    JOIN sucursales s ON s.id = i.sucursalId
    WHERE p.activo = 1 AND s.activa = 1`;
  const params = [];
  if (req.query.sucursalId) { sql += ' AND i.sucursalId = ?'; params.push(req.query.sucursalId); }
  if (req.query.productoId) { sql += ' AND i.productoId = ?'; params.push(req.query.productoId); }
  sql += ' ORDER BY s.nombre, p.nombre';
  res.json(query(sql, params));
});

router.put('/inventario/:id', (req, res) => {
  const { cantidad } = req.body;
  const old = queryOne('SELECT * FROM inventario WHERE id = ?', [req.params.id]);
  if (!old) return res.status(404).json({ error: 'Registro no encontrado' });
  execute('UPDATE inventario SET cantidad = ? WHERE id = ?', [cantidad, req.params.id]);
  const diff = cantidad - old.cantidad;
  if (diff !== 0) {
    execute('INSERT INTO movimientos (id, tipo, productoId, sucursalId, cantidad, fecha) VALUES (?, ?, ?, ?, ?, ?)',
      [_id(), diff > 0 ? 'entrada' : 'salida', old.productoId, old.sucursalId, Math.abs(diff), _now()]);
  }
  res.json(queryOne('SELECT * FROM inventario WHERE id = ?', [req.params.id]));
});

router.post('/inventario/reabastecer', (req, res) => {
  const { sucursalId, productoId, cantidad } = req.body;
  if (!sucursalId || !productoId || !cantidad || cantidad < 1) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
  const existing = queryOne('SELECT * FROM inventario WHERE sucursalId = ? AND productoId = ?', [sucursalId, productoId]);
  if (existing) {
    execute('UPDATE inventario SET cantidad = cantidad + ? WHERE id = ?', [cantidad, existing.id]);
  } else {
    execute('INSERT INTO inventario (id, sucursalId, productoId, cantidad, fechaRegistro) VALUES (?, ?, ?, ?, ?)',
      [_id(), sucursalId, productoId, cantidad, _now()]);
  }
  execute('INSERT INTO movimientos (id, tipo, productoId, sucursalId, cantidad, fecha) VALUES (?, ?, ?, ?, ?, ?)',
    [_id(), 'entrada', productoId, sucursalId, cantidad, _now()]);
  res.json({ success: true });
});

// ==================== USUARIOS ====================
router.get('/usuarios', (req, res) => {
  res.json(query('SELECT id, username, nombre, rol, sucursalId, activo, fechaRegistro FROM usuarios WHERE activo = 1 ORDER BY fechaRegistro DESC'));
});

router.post('/usuarios', requireAdmin, (req, res) => {
  const u = req.body;
  if (!u.username || !u.password || !u.nombre) {
    return res.status(400).json({ error: 'Nombre, usuario y contraseña requeridos' });
  }
  const existing = queryOne('SELECT id FROM usuarios WHERE username = ?', [u.username]);
  if (existing) return res.status(400).json({ error: 'El usuario ya existe' });
  const id = _id();
  const hash = bcrypt.hashSync(u.password, 10);
  execute('INSERT INTO usuarios (id, username, password, nombre, rol, sucursalId, activo, fechaRegistro) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
    [id, u.username, hash, u.nombre, u.rol || 'operario', u.sucursalId || '', _now()]);
  res.status(201).json({ id, username: u.username, nombre: u.nombre, rol: u.rol || 'operario', sucursalId: u.sucursalId || '' });
});

router.put('/usuarios/:id', requireAdmin, (req, res) => {
  const u = req.body;
  if (u.password && u.password.length > 0) {
    const hash = bcrypt.hashSync(u.password, 10);
    execute('UPDATE usuarios SET nombre=?, username=?, password=?, rol=?, sucursalId=? WHERE id=?',
      [u.nombre, u.username, hash, u.rol, u.sucursalId, req.params.id]);
  } else {
    execute('UPDATE usuarios SET nombre=?, username=?, rol=?, sucursalId=? WHERE id=?',
      [u.nombre, u.username, u.rol, u.sucursalId, req.params.id]);
  }
  res.json({ success: true });
});

router.delete('/usuarios/:id', requireAdmin, (req, res) => {
  execute('UPDATE usuarios SET activo = 0 WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ==================== HORARIOS ====================
router.get('/horarios', (req, res) => {
  let sql = `SELECT h.*, u.nombre as operarioNombre, s.nombre as sucursalNombre
    FROM horarios h JOIN usuarios u ON u.id = h.operarioId JOIN sucursales s ON s.id = h.sucursalId`;
  const params = [];
  if (req.query.operarioId) { sql += ' WHERE h.operarioId = ?'; params.push(req.query.operarioId); }
  sql += ' ORDER BY h.dia, h.horaInicio';
  res.json(query(sql, params));
});

router.post('/horarios', (req, res) => {
  const h = req.body;
  const id = _id();
  execute('INSERT INTO horarios (id, operarioId, sucursalId, dia, horaInicio, horaFin) VALUES (?, ?, ?, ?, ?, ?)',
    [id, h.operarioId, h.sucursalId, h.dia, h.horaInicio, h.horaFin]);
  res.status(201).json(queryOne('SELECT * FROM horarios WHERE id = ?', [id]));
});

router.put('/horarios/:id', (req, res) => {
  const h = req.body;
  execute('UPDATE horarios SET operarioId=?, sucursalId=?, dia=?, horaInicio=?, horaFin=? WHERE id=?',
    [h.operarioId, h.sucursalId, h.dia, h.horaInicio, h.horaFin, req.params.id]);
  res.json(queryOne('SELECT * FROM horarios WHERE id = ?', [req.params.id]));
});

router.delete('/horarios/:id', (req, res) => {
  execute('DELETE FROM horarios WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ==================== CLIENTES ====================
router.get('/clientes', (req, res) => {
  res.json(query('SELECT * FROM clientes ORDER BY fechaRegistro DESC'));
});

router.post('/clientes', (req, res) => {
  const c = req.body;
  const id = _id();
  execute('INSERT INTO clientes (id, nombre, telefono, email, direccion, notas, fechaRegistro) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, c.nombre, c.telefono || '', c.email || '', c.direccion || '', c.notas || '', _now()]);
  res.status(201).json(queryOne('SELECT * FROM clientes WHERE id = ?', [id]));
});

router.put('/clientes/:id', (req, res) => {
  const c = req.body;
  execute('UPDATE clientes SET nombre=?, telefono=?, email=?, direccion=?, notas=? WHERE id=?',
    [c.nombre, c.telefono || '', c.email || '', c.direccion || '', c.notas || '', req.params.id]);
  res.json(queryOne('SELECT * FROM clientes WHERE id = ?', [req.params.id]));
});

router.delete('/clientes/:id', (req, res) => {
  execute('DELETE FROM clientes WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ==================== PROVEEDORES ====================
router.get('/proveedores', (req, res) => {
  res.json(query('SELECT * FROM proveedores ORDER BY fechaRegistro DESC'));
});

router.post('/proveedores', (req, res) => {
  const p = req.body;
  const id = _id();
  execute('INSERT INTO proveedores (id, empresa, contacto, telefono, email, materiales, notas, fechaRegistro) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, p.empresa, p.contacto || '', p.telefono || '', p.email || '', p.materiales || '', p.notas || '', _now()]);
  res.status(201).json(queryOne('SELECT * FROM proveedores WHERE id = ?', [id]));
});

router.put('/proveedores/:id', (req, res) => {
  const p = req.body;
  execute('UPDATE proveedores SET empresa=?, contacto=?, telefono=?, email=?, materiales=?, notas=? WHERE id=?',
    [p.empresa, p.contacto || '', p.telefono || '', p.email || '', p.materiales || '', p.notas || '', req.params.id]);
  res.json(queryOne('SELECT * FROM proveedores WHERE id = ?', [req.params.id]));
});

router.delete('/proveedores/:id', (req, res) => {
  execute('DELETE FROM proveedores WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ==================== MOVIMIENTOS ====================
router.get('/movimientos', (req, res) => {
  res.json(query(`SELECT m.*, p.nombre as productoNombre, s.nombre as sucursalNombre
    FROM movimientos m LEFT JOIN productos p ON p.id = m.productoId LEFT JOIN sucursales s ON s.id = m.sucursalId
    ORDER BY m.fecha DESC LIMIT 50`));
});

module.exports = router;
