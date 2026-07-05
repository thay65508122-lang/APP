const DB = {
  _prefix: 'joyeria_',

  init() {
    if (!localStorage.getItem(this._prefix + 'init')) {
      this.seed();
      localStorage.setItem(this._prefix + 'init', 'true');
    }
  },

  _get(collection) {
    try {
      return JSON.parse(localStorage.getItem(this._prefix + collection)) || [];
    } catch { return []; }
  },

  _set(collection, data) {
    localStorage.setItem(this._prefix + collection, JSON.stringify(data));
  },

  _id() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  _now() {
    return new Date().toISOString();
  },

  // --- USUARIOS ---
  getUsuarios() { return this._get('usuarios'); },
  setUsuarios(d) { this._set('usuarios', d); },
  addUsuario(u) {
    const list = this.getUsuarios();
    u.id = this._id();
    u.fechaRegistro = this._now();
    u.activo = true;
    list.push(u);
    this.setUsuarios(list);
    return u;
  },
  updateUsuario(id, data) {
    const list = this.getUsuarios();
    const idx = list.findIndex(u => u.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    this.setUsuarios(list);
    return list[idx];
  },
  deleteUsuario(id) {
    let list = this.getUsuarios();
    list = list.filter(u => u.id !== id);
    this.setUsuarios(list);
  },
  findUsuario(username) {
    return this.getUsuarios().find(u => u.username === username);
  },

  // --- SUCURSALES ---
  getSucursales() { return this._get('sucursales'); },
  setSucursales(d) { this._set('sucursales', d); },
  addSucursal(s) {
    const list = this.getSucursales();
    s.id = this._id();
    s.activa = true;
    s.fechaRegistro = this._now();
    list.push(s);
    this.setSucursales(list);
    return s;
  },
  updateSucursal(id, data) {
    const list = this.getSucursales();
    const idx = list.findIndex(s => s.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    this.setSucursales(list);
    return list[idx];
  },
  deleteSucursal(id) {
    let list = this.getSucursales();
    list = list.filter(s => s.id !== id);
    this.setSucursales(list);
  },

  // --- PRODUCTOS ---
  getProductos() { return this._get('productos'); },
  setProductos(d) { this._set('productos', d); },
  addProducto(p) {
    const list = this.getProductos();
    p.id = this._id();
    p.activo = true;
    p.fechaRegistro = this._now();
    list.push(p);
    this.setProductos(list);
    return p;
  },
  updateProducto(id, data) {
    const list = this.getProductos();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    this.setProductos(list);
    return list[idx];
  },
  deleteProducto(id) {
    let list = this.getProductos();
    list = list.filter(p => p.id !== id);
    this.setProductos(list);
  },

  // --- INVENTARIO ---
  getInventario() { return this._get('inventario'); },
  setInventario(d) { this._set('inventario', d); },
  addInventario(i) {
    const list = this.getInventario();
    i.id = this._id();
    i.fechaRegistro = this._now();
    list.push(i);
    this.setInventario(list);
    return i;
  },
  updateInventario(id, data) {
    const list = this.getInventario();
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    this.setInventario(list);
    return list[idx];
  },
  getInventarioSucursal(sucursalId) {
    return this.getInventario().filter(i => i.sucursalId === sucursalId);
  },
  getStock(sucursalId, productoId) {
    const item = this.getInventario().find(i => i.sucursalId === sucursalId && i.productoId === productoId);
    return item ? item.cantidad : 0;
  },

  // --- CLIENTES ---
  getClientes() { return this._get('clientes'); },
  setClientes(d) { this._set('clientes', d); },
  addCliente(c) {
    const list = this.getClientes();
    c.id = this._id();
    c.fechaRegistro = this._now();
    list.push(c);
    this.setClientes(list);
    return c;
  },
  updateCliente(id, data) {
    const list = this.getClientes();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    this.setClientes(list);
    return list[idx];
  },
  deleteCliente(id) {
    let list = this.getClientes();
    list = list.filter(c => c.id !== id);
    this.setClientes(list);
  },

  // --- PROVEEDORES ---
  getProveedores() { return this._get('proveedores'); },
  setProveedores(d) { this._set('proveedores', d); },
  addProveedor(p) {
    const list = this.getProveedores();
    p.id = this._id();
    p.fechaRegistro = this._now();
    list.push(p);
    this.setProveedores(list);
    return p;
  },
  updateProveedor(id, data) {
    const list = this.getProveedores();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    this.setProveedores(list);
    return list[idx];
  },
  deleteProveedor(id) {
    let list = this.getProveedores();
    list = list.filter(p => p.id !== id);
    this.setProveedores(list);
  },

  // --- HORARIOS ---
  getHorarios() { return this._get('horarios'); },
  setHorarios(d) { this._set('horarios', d); },
  addHorario(h) {
    const list = this.getHorarios();
    h.id = this._id();
    list.push(h);
    this.setHorarios(list);
    return h;
  },
  updateHorario(id, data) {
    const list = this.getHorarios();
    const idx = list.findIndex(h => h.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    this.setHorarios(list);
    return list[idx];
  },
  deleteHorario(id) {
    let list = this.getHorarios();
    list = list.filter(h => h.id !== id);
    this.setHorarios(list);
  },
  getHorariosOperario(operarioId) {
    return this.getHorarios().filter(h => h.operarioId === operarioId);
  },

  // --- MOVIMIENTOS ---
  getMovimientos() { return this._get('movimientos'); },
  setMovimientos(d) { this._set('movimientos', d); },
  addMovimiento(m) {
    const list = this.getMovimientos();
    m.id = this._id();
    m.fecha = this._now();
    list.push(m);
    this.setMovimientos(list);
    return m;
  },

  // --- SEED DATA ---
  seed() {
    const sucursales = [
      { id: 's1', nombre: 'Joyería Centro', direccion: 'Av. Principal 123, Centro', telefono: '555-0101', activa: true, fechaRegistro: this._now() },
      { id: 's2', nombre: 'Joyería Plaza Norte', direccion: 'Blvd. Norte 456, Plaza Comercial', telefono: '555-0102', activa: true, fechaRegistro: this._now() },
      { id: 's3', nombre: 'Joyería Sur', direccion: 'Calle del Sol 789, Zona Sur', telefono: '555-0103', activa: true, fechaRegistro: this._now() }
    ];
    this.setSucursales(sucursales);

    this.addUsuario({
      username: 'admin',
      password: 'admin123',
      nombre: 'Jorge Administrador',
      rol: 'admin',
      sucursalId: 's1'
    });

    this.addUsuario({
      username: 'gerente1',
      password: 'gerente123',
      nombre: 'María García',
      rol: 'gerente',
      sucursalId: 's1'
    });

    this.addUsuario({
      username: 'operario1',
      password: 'operario123',
      nombre: 'Carlos López',
      rol: 'operario',
      sucursalId: 's1'
    });

    this.addUsuario({
      username: 'operario2',
      password: 'operario123',
      nombre: 'Ana Martínez',
      rol: 'operario',
      sucursalId: 's2'
    });

    const productos = [
      { nombre: 'Anillo de Oro Blanco 18k', tipo: 'anillo', metal: 'oro', pureza: '18k', peso: 5.2, gema: 'diamante', tallaGema: '0.5ct', año: 2024, precio: 12500, costo: 8500, activo: true, descripcion: 'Anillo elegante con diamante central' },
      { nombre: 'Collar de Plata Ley 925', tipo: 'collar', metal: 'plata', pureza: '925', peso: 15.8, gema: 'ninguna', tallaGema: '', año: 2024, precio: 2800, costo: 1200, activo: true, descripcion: 'Collar clásico de plata esterlina' },
      { nombre: 'Pulsera de Oro Amarillo 14k', tipo: 'pulsera', metal: 'oro', pureza: '14k', peso: 8.5, gema: 'rubi', tallaGema: '0.3ct', año: 2024, precio: 8900, costo: 5600, activo: true, descripcion: 'Pulsera con rubíes engastados' },
      { nombre: 'Aretes de Platino con Esmeralda', tipo: 'aretes', metal: 'platino', pureza: '950', peso: 4.8, gema: 'esmeralda', tallaGema: '0.8ct', año: 2024, precio: 18500, costo: 12000, activo: true, descripcion: 'Aretes de lujo con esmeraldas colombianas' },
      { nombre: 'Anillo de Compromiso Oro Rosa 18k', tipo: 'anillo', metal: 'oro', pureza: '18k', peso: 6.0, gema: 'diamante', tallaGema: '1.0ct', año: 2024, precio: 22000, costo: 15000, activo: true, descripcion: 'Anillo de compromiso con diamante solitario' },
      { nombre: 'Dije de Rubí en Oro Amarillo', tipo: 'dije', metal: 'oro', pureza: '14k', peso: 3.2, gema: 'rubi', tallaGema: '0.6ct', año: 2024, precio: 7500, costo: 4800, activo: true, descripcion: 'Dije con rubí talla corazón' },
      { nombre: 'Mancuernillas de Plata con Zafiro', tipo: 'mancuernillas', metal: 'plata', pureza: '925', peso: 6.5, gema: 'zafiro', tallaGema: '0.4ct', año: 2024, precio: 4200, costo: 2500, activo: true, descripcion: 'Mancuernillas elegantes con zafiros azules' },
      { nombre: 'Collar de Perlas con Cierre de Oro', tipo: 'collar', metal: 'oro', pureza: '14k', peso: 12.0, gema: 'perla', tallaGema: '8mm', año: 2024, precio: 9800, costo: 6200, activo: true, descripcion: 'Collar de perlas cultivadas con cierre de oro' }
    ];

    productos.forEach(p => {
      const prod = this.addProducto(p);
      sucursales.forEach(s => {
        this.addInventario({
          sucursalId: s.id,
          productoId: prod.id,
          cantidad: Math.floor(Math.random() * 15) + 3
        });
      });
    });

    this.addCliente({ nombre: 'Roberto Fernández', telefono: '555-2001', email: 'roberto@email.com', direccion: 'Calle Roble 45', notas: 'Cliente VIP - compra frecuente' });
    this.addCliente({ nombre: 'Laura Castillo', telefono: '555-2002', email: 'laura@email.com', direccion: 'Av. Olmo 78', notas: 'Interesada en anillos de compromiso' });
    this.addCliente({ nombre: 'Miguel Ángel Ruiz', telefono: '555-2003', email: 'miguel@email.com', direccion: 'Blvd. Pino 12', notas: 'Cliente corporativo' });

    this.addProveedor({ empresa: 'Diamantes Internacional S.A.', contacto: 'John Smith', telefono: '555-3001', email: 'john@diamantes.com', materiales: 'Diamantes, rubíes, esmeraldas', notas: 'Proveedor principal de gemas' });
    this.addProveedor({ empresa: 'Metales Finos del Sur', contacto: 'Pedro Ramírez', telefono: '555-3002', email: 'pedro@metalesfinos.com', materiales: 'Oro, plata, platino', notas: 'Certificación de pureza incluida' });
    this.addProveedor({ empresa: 'Perlas del Pacífico', contacto: 'María Wong', telefono: '555-3003', email: 'maria@perlas.com', materiales: 'Perlas cultivadas', notas: 'Perlas de alta calidad' });
  },

  // --- REPORTES ---
  getEstadisticas() {
    const productos = this.getProductos().filter(p => p.activo);
    const sucursales = this.getSucursales().filter(s => s.activa);
    const inventario = this.getInventario();
    const usuarios = this.getUsuarios().filter(u => u.activo);

    const totalProductos = productos.length;
    const totalValorInventario = inventario.reduce((sum, item) => {
      const prod = productos.find(p => p.id === item.productoId);
      return sum + (prod ? prod.precio * item.cantidad : 0);
    }, 0);
    const totalCostoInventario = inventario.reduce((sum, item) => {
      const prod = productos.find(p => p.id === item.productoId);
      return sum + (prod ? prod.costo * item.cantidad : 0);
    }, 0);
    const totalClientes = this.getClientes().length;
    const totalProveedores = this.getProveedores().length;
    const totalEmpleados = usuarios.length;
    const totalItems = inventario.reduce((sum, i) => sum + i.cantidad, 0);

    const productosBajoStock = inventario.filter(i => i.cantidad < 5).length;

    const ventas = this.getMovimientos().filter(m => m.tipo === 'venta');
    const totalVentas = ventas.reduce((sum, v) => sum + (v.total || 0), 0);

    const productosPorMetal = {};
    productos.forEach(p => {
      productosPorMetal[p.metal] = (productosPorMetal[p.metal] || 0) + 1;
    });

    return {
      totalProductos,
      totalValorInventario,
      totalCostoInventario,
      totalClientes,
      totalProveedores,
      totalEmpleados,
      totalItems,
      productosBajoStock,
      totalVentas,
      productosPorMetal,
      gananciaPotencial: totalValorInventario - totalCostoInventario
    };
  }
};
