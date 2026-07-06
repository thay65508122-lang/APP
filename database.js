const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'joyeria.db');
let db = null;

async function initDB() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  initTables();
  seedIfEmpty();
  return db;
}

function getDB() {
  if (!db) throw new Error('Base de datos no inicializada. Llama a initDB() primero.');
  return db;
}

function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initTables() {
  db.run('CREATE TABLE IF NOT EXISTS usuarios (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, nombre TEXT NOT NULL, rol TEXT NOT NULL DEFAULT \'operario\', sucursalId TEXT, activo INTEGER DEFAULT 1, fechaRegistro TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS sucursales (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, direccion TEXT, telefono TEXT, activa INTEGER DEFAULT 1, fechaRegistro TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS productos (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, tipo TEXT, metal TEXT, pureza TEXT, peso REAL, gema TEXT, tallaGema TEXT, año INTEGER, precio REAL, costo REAL, descripcion TEXT, activo INTEGER DEFAULT 1, fechaRegistro TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS inventario (id TEXT PRIMARY KEY, sucursalId TEXT NOT NULL, productoId TEXT NOT NULL, cantidad INTEGER DEFAULT 0, fechaRegistro TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS clientes (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, telefono TEXT, email TEXT, direccion TEXT, notas TEXT, fechaRegistro TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS proveedores (id TEXT PRIMARY KEY, empresa TEXT NOT NULL, contacto TEXT, telefono TEXT, email TEXT, materiales TEXT, notas TEXT, fechaRegistro TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS horarios (id TEXT PRIMARY KEY, operarioId TEXT NOT NULL, sucursalId TEXT NOT NULL, dia INTEGER NOT NULL, horaInicio TEXT NOT NULL, horaFin TEXT NOT NULL)');
  db.run('CREATE TABLE IF NOT EXISTS movimientos (id TEXT PRIMARY KEY, tipo TEXT NOT NULL, productoId TEXT, sucursalId TEXT, cantidad INTEGER, total REAL DEFAULT 0, descripcion TEXT, fecha TEXT)');
  saveDB();
}

function _id() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }
function _now() { return new Date().toISOString(); }

function seedIfEmpty() {
  const count = db.exec('SELECT COUNT(*) as c FROM sucursales');
  if (count.length > 0 && count[0].values[0][0] > 0) return;

  const s1 = _id(); const s2 = _id(); const s3 = _id();
  const now = _now();

  db.run('INSERT INTO sucursales VALUES (?,?,?,?,1,?)', [s1, 'Joyería Centro', 'Av. Principal 123, Centro', '555-0101', now]);
  db.run('INSERT INTO sucursales VALUES (?,?,?,?,1,?)', [s2, 'Joyería Plaza Norte', 'Blvd. Norte 456, Plaza Comercial', '555-0102', now]);
  db.run('INSERT INTO sucursales VALUES (?,?,?,?,1,?)', [s3, 'Joyería Sur', 'Calle del Sol 789, Zona Sur', '555-0103', now]);

  const hAdmin = bcrypt.hashSync('admin123', 10);
  const hGerente = bcrypt.hashSync('gerente123', 10);
  const hOperario = bcrypt.hashSync('operario123', 10);
  db.run('INSERT INTO usuarios VALUES (?,?,?,?,?,?,1,?)', [_id(), 'admin', hAdmin, 'Jorge Administrador', 'admin', s1, now]);
  db.run('INSERT INTO usuarios VALUES (?,?,?,?,?,?,1,?)', [_id(), 'gerente1', hGerente, 'María García', 'gerente', s1, now]);
  db.run('INSERT INTO usuarios VALUES (?,?,?,?,?,?,1,?)', [_id(), 'operario1', hOperario, 'Carlos López', 'operario', s1, now]);
  db.run('INSERT INTO usuarios VALUES (?,?,?,?,?,?,1,?)', [_id(), 'operario2', hOperario, 'Ana Martínez', 'operario', s2, now]);

  const prods = [
    { n: 'Anillo de Oro Blanco 18k', t: 'anillo', m: 'oro', p: '18k', pe: 5.2, g: 'diamante', tg: '0.5ct', a: 2024, pr: 12500, c: 8500, d: 'Anillo elegante con diamante central' },
    { n: 'Collar de Plata Ley 925', t: 'collar', m: 'plata', p: '925', pe: 15.8, g: 'ninguna', tg: '', a: 2024, pr: 2800, c: 1200, d: 'Collar clásico de plata esterlina' },
    { n: 'Pulsera de Oro Amarillo 14k', t: 'pulsera', m: 'oro', p: '14k', pe: 8.5, g: 'rubi', tg: '0.3ct', a: 2024, pr: 8900, c: 5600, d: 'Pulsera con rubíes engastados' },
    { n: 'Aretes de Platino con Esmeralda', t: 'aretes', m: 'platino', p: '950', pe: 4.8, g: 'esmeralda', tg: '0.8ct', a: 2024, pr: 18500, c: 12000, d: 'Aretes de lujo con esmeraldas colombianas' },
    { n: 'Anillo de Compromiso Oro Rosa 18k', t: 'anillo', m: 'oro', p: '18k', pe: 6.0, g: 'diamante', tg: '1.0ct', a: 2024, pr: 22000, c: 15000, d: 'Anillo de compromiso con diamante solitario' },
    { n: 'Dije de Rubí en Oro Amarillo', t: 'dije', m: 'oro', p: '14k', pe: 3.2, g: 'rubi', tg: '0.6ct', a: 2024, pr: 7500, c: 4800, d: 'Dije con rubí talla corazón' },
    { n: 'Mancuernillas de Plata con Zafiro', t: 'mancuernillas', m: 'plata', p: '925', pe: 6.5, g: 'zafiro', tg: '0.4ct', a: 2024, pr: 4200, c: 2500, d: 'Mancuernillas elegantes con zafiros azules' },
    { n: 'Collar de Perlas con Cierre de Oro', t: 'collar', m: 'oro', p: '14k', pe: 12.0, g: 'perla', tg: '8mm', a: 2024, pr: 9800, c: 6200, d: 'Collar de perlas cultivadas con cierre de oro' }
  ];
  const prodIds = [];
  for (const p of prods) {
    const id = _id();
    prodIds.push(id);
    db.run('INSERT INTO productos VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?)', [id, p.n, p.t, p.m, p.p, p.pe, p.g, p.tg, p.a, p.pr, p.c, p.d, now]);
  }
  for (const pid of prodIds) {
    for (const sid of [s1, s2, s3]) {
      db.run('INSERT INTO inventario VALUES (?,?,?,?,?)', [_id(), sid, pid, Math.floor(Math.random() * 15) + 3, now]);
    }
  }
  db.run('INSERT INTO clientes VALUES (?,?,?,?,?,?,?)', [_id(), 'Roberto Fernández', '555-2001', 'roberto@email.com', 'Calle Roble 45', 'Cliente VIP - compra frecuente', now]);
  db.run('INSERT INTO clientes VALUES (?,?,?,?,?,?,?)', [_id(), 'Laura Castillo', '555-2002', 'laura@email.com', 'Av. Olmo 78', 'Interesada en anillos de compromiso', now]);
  db.run('INSERT INTO clientes VALUES (?,?,?,?,?,?,?)', [_id(), 'Miguel Ángel Ruiz', '555-2003', 'miguel@email.com', 'Blvd. Pino 12', 'Cliente corporativo', now]);
  db.run('INSERT INTO proveedores VALUES (?,?,?,?,?,?,?,?)', [_id(), 'Diamantes Internacional S.A.', 'John Smith', '555-3001', 'john@diamantes.com', 'Diamantes, rubíes, esmeraldas', 'Proveedor principal de gemas', now]);
  db.run('INSERT INTO proveedores VALUES (?,?,?,?,?,?,?,?)', [_id(), 'Metales Finos del Sur', 'Pedro Ramírez', '555-3002', 'pedro@metalesfinos.com', 'Oro, plata, platino', 'Certificación de pureza incluida', now]);
  db.run('INSERT INTO proveedores VALUES (?,?,?,?,?,?,?,?)', [_id(), 'Perlas del Pacífico', 'María Wong', '555-3003', 'maria@perlas.com', 'Perlas cultivadas', 'Perlas de alta calidad', now]);
  saveDB();
}

module.exports = { initDB, getDB };
