const API = {
  _base: '',
  _token: null,

  init() {
    this._token = localStorage.getItem('joyeria_token');
  },

  _getToken() {
    return localStorage.getItem('joyeria_token');
  },

  _headers() {
    const h = { 'Content-Type': 'application/json' };
    const token = this._getToken();
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  },

  async _fetch(method, url, body = null) {
    const opts = { method, headers: this._headers() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(this._base + url, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
    return data;
  },

  _get(url) { return this._fetch('GET', url); },
  _post(url, body) { return this._fetch('POST', url, body); },
  _put(url, body) { return this._fetch('PUT', url, body); },
  _delete(url) { return this._fetch('DELETE', url); },

  // Auth
  async login(username, password) {
    const res = await this._post('/api/auth/login', { username, password });
    localStorage.setItem('joyeria_token', res.token);
    return res;
  },
  logout() {
    localStorage.removeItem('joyeria_token');
  },
  getSession() {
    const token = this._getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { userId: payload.id, username: payload.username, nombre: payload.nombre, rol: payload.rol, sucursalId: payload.sucursalId };
    } catch { return null; }
  },
  isLoggedIn() { return !!this._getToken(); },

  // Dashboard
  getDashboard() { return this._get('/api/dashboard/stats'); },

  // Productos
  getProductos() { return this._get('/api/productos'); },
  getProducto(id) { return this._get(`/api/productos/${id}`); },
  addProducto(p) { return this._post('/api/productos', p); },
  updateProducto(id, p) { return this._put(`/api/productos/${id}`, p); },
  deleteProducto(id) { return this._delete(`/api/productos/${id}`); },

  // Sucursales
  getSucursales() { return this._get('/api/sucursales'); },
  addSucursal(s) { return this._post('/api/sucursales', s); },
  updateSucursal(id, s) { return this._put(`/api/sucursales/${id}`, s); },
  deleteSucursal(id) { return this._delete(`/api/sucursales/${id}`); },

  // Inventario
  getInventario(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this._get(`/api/inventario${q ? '?' + q : ''}`);
  },
  updateInventario(id, data) { return this._put(`/api/inventario/${id}`, data); },
  reabastecer(data) { return this._post('/api/inventario/reabastecer', data); },

  // Usuarios
  getUsuarios() { return this._get('/api/usuarios'); },
  addUsuario(u) { return this._post('/api/usuarios', u); },
  updateUsuario(id, u) { return this._put(`/api/usuarios/${id}`, u); },
  deleteUsuario(id) { return this._delete(`/api/usuarios/${id}`); },

  // Horarios
  getHorarios(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this._get(`/api/horarios${q ? '?' + q : ''}`);
  },
  addHorario(h) { return this._post('/api/horarios', h); },
  updateHorario(id, h) { return this._put(`/api/horarios/${id}`, h); },
  deleteHorario(id) { return this._delete(`/api/horarios/${id}`); },

  // Clientes
  getClientes() { return this._get('/api/clientes'); },
  addCliente(c) { return this._post('/api/clientes', c); },
  updateCliente(id, c) { return this._put(`/api/clientes/${id}`, c); },
  deleteCliente(id) { return this._delete(`/api/clientes/${id}`); },

  // Proveedores
  getProveedores() { return this._get('/api/proveedores'); },
  addProveedor(p) { return this._post('/api/proveedores', p); },
  updateProveedor(id, p) { return this._put(`/api/proveedores/${id}`, p); },
  deleteProveedor(id) { return this._delete(`/api/proveedores/${id}`); },

  // Movimientos
  getMovimientos() { return this._get('/api/movimientos'); }
};
