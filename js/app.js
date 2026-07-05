document.addEventListener('DOMContentLoaded', () => {
  DB.init();
  initRouter();
});

let currentPage = '';

function initRouter() {
  window.addEventListener('hashchange', route);
  if (Auth.isLoggedIn()) {
    if (!window.location.hash || window.location.hash === '#login') {
      window.location.hash = '#dashboard';
    } else {
      route();
    }
  } else {
    window.location.hash = '#login';
    route();
  }
}

function route() {
  const hash = window.location.hash || '#login';

  if (hash === '#login') {
    showLogin();
    return;
  }

  if (!Auth.requireAuth()) return;
  showAppLayout();
  const page = hash.replace('#', '');
  if (page !== currentPage) {
    currentPage = page;
    loadPage(page);
  }
}

function showLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="logo">
          <span class="icon">👑</span>
          <h1>JOYERÍA</h1>
          <span>Administración de Lujo</span>
        </div>
        <h2>Iniciar Sesión</h2>
        <div class="login-error" id="loginError"></div>
        <form id="loginForm">
          <div class="form-group">
            <label>Usuario</label>
            <input type="text" id="loginUser" placeholder="Ingrese su usuario" autocomplete="username" required>
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" id="loginPass" placeholder="Ingrese su contraseña" autocomplete="current-password" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block">INGRESAR</button>
        </form>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);font-size:11px;color:var(--text-muted);text-align:center">
          <div>Admin: <strong>admin</strong> / <strong>admin123</strong></div>
          <div style="margin-top:4px">Gerente: <strong>gerente1</strong> / <strong>gerente123</strong></div>
        </div>
      </div>
    </div>`;

  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const errorEl = document.getElementById('loginError');
    errorEl.classList.remove('show');

    const result = Auth.login(user, pass);
    if (result.success) {
      window.location.hash = '#dashboard';
    } else {
      errorEl.textContent = result.error;
      errorEl.classList.add('show');
    }
  });
}

function showAppLayout() {
  const session = Auth.getSession();
  if (!session) return;

  const isAdmin = Auth.isAdmin();
  const sidebarNavItems = [
    { hash: '#dashboard', icon: '📊', label: 'Dashboard' },
    { hash: '#productos', icon: '💍', label: 'Productos' },
    { hash: '#sucursales', icon: '🏛️', label: 'Sucursales' },
    { hash: '#inventario', icon: '📦', label: 'Inventario' },
    { hash: '#usuarios', icon: '👥', label: 'Usuarios' },
    { hash: '#horarios', icon: '🕐', label: 'Horarios' },
    { hash: '#clientes', icon: '👤', label: 'Clientes' },
    { hash: '#proveedores', icon: '🚚', label: 'Proveedores' }
  ];

  const navHtml = sidebarNavItems.map(item =>
    `<div class="nav-item" onclick="navigate('${item.hash}')">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>
    </div>`
  ).join('');

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>👑 JOYERÍA</h2>
          <small>Sistema de Gestión</small>
        </div>
        <nav class="sidebar-nav">
          ${navHtml}
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">${session.nombre.charAt(0)}</div>
            <div class="user-details">
              <div class="name">${session.nombre}</div>
              <div class="role">${UI.rolBadge(session.rol)}</div>
            </div>
          </div>
          <button class="btn btn-outline btn-sm btn-block" onclick="handleLogout()">🔓 Cerrar Sesión</button>
        </div>
      </aside>
      <div class="main-content">
        <header class="topbar">
          <h3 id="pageTitle">Dashboard <small id="pageSubtitle"></small></h3>
          <div class="topbar-actions">
            <span class="datetime" id="clockDisplay"></span>
          </div>
        </header>
        <div class="page-content" id="pageContent">
          <div style="text-align:center;padding:60px;color:var(--text-muted)">Cargando...</div>
        </div>
      </div>
    </div>
    <div class="assistant-container">
      <button class="assistant-btn" onclick="toggleAssistant()">💬</button>
      <div class="assistant-panel" id="assistantPanel">
        <div class="assistant-panel-header">
          <h4>🤖 Asistente Joyería</h4>
          <button class="modal-close" onclick="toggleAssistant()">×</button>
        </div>
        <div class="assistant-panel-body" id="assistantBody"></div>
      </div>
    </div>`;

  updateClock();
  setInterval(updateClock, 10000);
  updateNavActive();
  updateAssistant();
}

function navigate(hash) {
  window.location.hash = hash;
}

function handleLogout() {
  Auth.logout();
  window.location.hash = '#login';
  currentPage = '';
  document.getElementById('app').innerHTML = '';
}

function updateNavActive() {
  const hash = window.location.hash;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('onclick')?.includes(hash));
  });
}

function updateClock() {
  const el = document.getElementById('clockDisplay');
  if (!el) return;
  const now = new Date();
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  el.textContent = now.toLocaleDateString('es-MX', opts);
}

function loadPage(page) {
  const titleMap = {
    dashboard: 'Dashboard', productos: 'Productos', sucursales: 'Sucursales',
    inventario: 'Inventario', usuarios: 'Usuarios', horarios: 'Horarios',
    clientes: 'Clientes', proveedores: 'Proveedores'
  };
  document.getElementById('pageTitle').innerHTML = `${titleMap[page] || page} <small id="pageSubtitle"></small>`;
  updateNavActive();

  const fnMap = {
    dashboard: renderDashboard,
    productos: renderProductos,
    sucursales: renderSucursales,
    inventario: renderInventario,
    usuarios: renderUsuarios,
    horarios: renderHorarios,
    clientes: renderClientes,
    proveedores: renderProveedores
  };

  const container = document.getElementById('pageContent');
  if (fnMap[page]) {
    fnMap[page](container);
  } else {
    container.innerHTML = '<div class="empty-state"><div class="icon">📄</div><h4>Página no encontrada</h4></div>';
  }
}

function updateAssistant() {
  const body = document.getElementById('assistantBody');
  if (!body) return;
  const stats = DB.getEstadisticas();
  const sucursales = DB.getSucursales().filter(s => s.activa);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  body.innerHTML = `
    <div class="assistant-message">
      <p><strong>👋 Buenas, ${Auth.getSession().nombre.split(' ')[0]}</strong></p>
      <p>Resumen general del sistema</p>
      <span class="msg-time">${timeStr}</span>
    </div>
    <div class="assistant-stats">
      <div class="assistant-stat">
        <h6>${stats.totalProductos}</h6>
        <p>Productos</p>
      </div>
      <div class="assistant-stat">
        <h6>${stats.totalItems}</h6>
        <p>Piezas en stock</p>
      </div>
      <div class="assistant-stat">
        <h6>${UI.formatCurrency(stats.totalValorInventario)}</h6>
        <p>Valor inventario</p>
      </div>
      <div class="assistant-stat">
        <h6>${stats.totalEmpleados}</h6>
        <p>Empleados</p>
      </div>
    </div>
    ${stats.productosBajoStock > 0 ? `<div class="assistant-message" style="border-left-color:var(--warning)">
      <p>⚠️ <strong>${stats.productosBajoStock}</strong> productos tienen stock bajo</p>
      <span class="msg-time">Requiere atención</span>
    </div>` : ''}
    <div class="assistant-message" style="border-left-color:var(--success)">
      <p>✅ <strong>${sucursales.length}</strong> sucursales activas</p>
      <p>💰 Ganancia potencial: ${UI.formatCurrency(stats.gananciaPotencial)}</p>
      <span class="msg-time">Datos en tiempo real</span>
    </div>`;
}

function toggleAssistant() {
  const panel = document.getElementById('assistantPanel');
  if (panel) {
    panel.classList.toggle('active');
    if (panel.classList.contains('active')) updateAssistant();
  }
}

// ==================== DASHBOARD ====================
function renderDashboard(container) {
  const stats = DB.getEstadisticas();
  const productos = DB.getProductos().filter(p => p.activo);
  const sucursales = DB.getSucursales().filter(s => s.activa);
  const movimientos = DB.getMovimientos().slice(-10).reverse();
  const inventario = DB.getInventario();

  const bajoStock = inventario
    .filter(i => i.cantidad < 5)
    .map(i => {
      const p = DB.getProductos().find(p => p.id === i.productoId);
      const s = DB.getSucursales().find(s => s.id === i.sucursalId);
      return { ...i, producto: p?.nombre || '—', sucursal: s?.nombre || '—' };
    })
    .slice(0, 5);

  container.innerHTML = `
    <div class="stats-grid">
      ${UI.statCard('💍', 'Productos', stats.totalProductos, null, 'gold')}
      ${UI.statCard('📦', 'Piezas en Stock', stats.totalItems, null, 'blue')}
      ${UI.statCard('💰', 'Valor Inventario', UI.formatCurrency(stats.totalValorInventario), null, 'green')}
      ${UI.statCard('🏛️', 'Sucursales', sucursales.length, null, 'purple')}
      ${UI.statCard('👥', 'Empleados', stats.totalEmpleados, null, 'orange')}
      ${UI.statCard('👤', 'Clientes', stats.totalClientes, { dir: 'up', text: `+${stats.totalProveedores} proveedores` }, 'blue')}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h4>📋 Últimos Movimientos</h4>
        </div>
        <div class="table-container">
          ${movimientos.length === 0
            ? '<div class="empty-state"><p>Sin movimientos registrados</p></div>'
            : `<table>
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Producto</th><th>Sucursal</th><th>Cantidad</th></tr></thead>
              <tbody>
                ${movimientos.map(m => {
                  const p = DB.getProductos().find(p => p.id === m.productoId);
                  const s = DB.getSucursales().find(s => s.id === m.sucursalId);
                  return `<tr>
                    <td>${UI.formatDate(m.fecha)}</td>
                    <td><span class="tag ${m.tipo === 'entrada' ? 'tag-active' : m.tipo === 'venta' ? 'tag-warning' : 'tag-info'}">${m.tipo}</span></td>
                    <td>${p?.nombre || '—'}</td>
                    <td>${s?.nombre || '—'}</td>
                    <td>${m.cantidad}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>`}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h4>⚠️ Stock Bajo</h4>
        </div>
        ${bajoStock.length === 0
          ? '<div class="empty-state"><p>✅ Todos los productos tienen stock suficiente</p></div>'
          : `<div class="table-container"><table>
            <thead><tr><th>Producto</th><th>Sucursal</th><th>Stock</th></tr></thead>
            <tbody>
              ${bajoStock.map(b => `<tr>
                <td>${b.producto}</td>
                <td>${b.sucursal}</td>
                <td><span class="tag tag-warning">${b.cantidad}</span></td>
              </tr>`).join('')}
            </tbody>
          </table></div>`
        }
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4>💎 Productos por Metal</h4>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        ${Object.entries(stats.productosPorMetal).map(([metal, count]) =>
          `<div style="flex:1;min-width:120px;padding:16px;background:var(--bg-input);border-radius:var(--radius);text-align:center">
            <div style="font-size:28px;margin-bottom:4px">${metal === 'oro' ? '🥇' : metal === 'plata' ? '🥈' : metal === 'platino' ? '🏆' : '🔩'}</div>
            <div style="font-size:20px;font-weight:500">${count}</div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:capitalize">${metal}</div>
          </div>`
        ).join('')}
      </div>
    </div>`;
}

// ==================== PRODUCTOS ====================
function renderProductos(container) {
  const productos = DB.getProductos().filter(p => p.activo);
  const metales = ['oro', 'plata', 'platino', 'cobre', 'bronce'];
  const gemas = ['diamante', 'rubi', 'esmeralda', 'zafiro', 'perla', 'ninguna'];
  const tipos = ['anillo', 'collar', 'pulsera', 'aretes', 'dije', 'mancuernillas', 'gargantilla', 'tobillera'];
  const purezas = ['24k', '22k', '18k', '14k', '10k', '950', '925', '900'];

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="searchProductos" placeholder="Buscar productos..." oninput="filterProductos()">
      </div>
      <button class="btn btn-primary" onclick="showFormProducto()">+ Nuevo Producto</button>
    </div>
    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Metal</th>
              <th>Pureza</th>
              <th>Peso</th>
              <th>Gema</th>
              <th>Año</th>
              <th>Precio</th>
              <th>Stock Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="productosTableBody">
            ${productos.map(p => {
              const stockTotal = DB.getInventario().filter(i => i.productoId === p.id).reduce((s, i) => s + i.cantidad, 0);
              return `<tr>
                <td><strong>${p.nombre}</strong></td>
                <td>${UI.tipoProducto(p.tipo)}</td>
                <td>${UI.metalTag(p.metal)}</td>
                <td>${p.pureza}</td>
                <td>${p.peso}g</td>
                <td>${UI.gemaNombre(p.gema)} ${p.tallaGema ? `(${p.tallaGema})` : ''}</td>
                <td>${p.año}</td>
                <td>${UI.formatCurrency(p.precio)}</td>
                <td>${stockTotal}</td>
                <td class="actions">
                  <button class="btn btn-info btn-sm" onclick="showFormProducto('${p.id}')">✏️</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteProducto('${p.id}')">🗑️</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        ${productos.length === 0 ? '<div class="empty-state"><div class="icon">💍</div><h4>No hay productos registrados</h4><p>Agrega tu primer producto</p></div>' : ''}
      </div>
    </div>`;

  window.filterProductos = function() {
    const q = document.getElementById('searchProductos').value.toLowerCase();
    const rows = document.querySelectorAll('#productosTableBody tr');
    rows.forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };

  window.showFormProducto = function(id = null) {
    const p = id ? DB.getProductos().find(p => p.id === id) : null;
    const title = p ? 'Editar Producto' : 'Nuevo Producto';

    const { modal, body, footer, close } = UI.modalDynamic(title, (b) => {
      b.innerHTML = `
        <div class="grid-2">
          ${UI.formField('Nombre', 'text', 'fpNombre', p?.nombre || '')}
          ${UI.formField('Tipo', 'select', 'fpTipo', p?.tipo || 'anillo', tipos.map(t => ({ value: t, label: UI.tipoProducto(t) })))}
          ${UI.formField('Metal', 'select', 'fpMetal', p?.metal || 'oro', metales.map(m => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) })))}
          ${UI.formField('Pureza', 'select', 'fpPureza', p?.pureza || '18k', purezas.map(pz => ({ value: pz, label: pz })))}
          ${UI.formField('Peso (gramos)', 'number', 'fpPeso', p?.peso || '', null, 'step="0.1"')}
          ${UI.formField('Gema', 'select', 'fpGema', p?.gema || 'ninguna', gemas.map(g => ({ value: g, label: g === 'ninguna' ? 'Ninguna' : g.charAt(0).toUpperCase() + g.slice(1) })))}
          ${UI.formField('Talla de Gema', 'text', 'fpTalla', p?.tallaGema || '')}
          ${UI.formField('Año', 'number', 'fpAnio', p?.año || new Date().getFullYear(), null, 'step="1"')}
          ${UI.formField('Precio de Venta ($)', 'number', 'fpPrecio', p?.precio || '', null, 'step="0.01"')}
          ${UI.formField('Costo ($)', 'number', 'fpCosto', p?.costo || '', null, 'step="0.01"')}
        </div>
        <div class="form-group">
          <label>Descripción</label>
          <textarea id="fpDescripcion" style="min-height:60px">${p?.descripcion || ''}</textarea>
        </div>`;
    }, (f) => {
      f.innerHTML = `
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveProducto">${p ? 'Actualizar' : 'Crear'} Producto</button>`;
      f.querySelector('#btnSaveProducto').addEventListener('click', () => {
        const data = {
          nombre: document.getElementById('fpNombre').value.trim(),
          tipo: document.getElementById('fpTipo').value,
          metal: document.getElementById('fpMetal').value,
          pureza: document.getElementById('fpPureza').value,
          peso: parseFloat(document.getElementById('fpPeso').value) || 0,
          gema: document.getElementById('fpGema').value,
          tallaGema: document.getElementById('fpTalla').value.trim(),
          año: parseInt(document.getElementById('fpAnio').value) || new Date().getFullYear(),
          precio: parseFloat(document.getElementById('fpPrecio').value) || 0,
          costo: parseFloat(document.getElementById('fpCosto').value) || 0,
          descripcion: document.getElementById('fpDescripcion').value.trim()
        };
        if (!data.nombre) { UI.toast('El nombre es obligatorio', 'error'); return; }
        if (id) {
          DB.updateProducto(id, data);
          UI.toast('Producto actualizado', 'success');
        } else {
          const nuevo = DB.addProducto(data);
          DB.getSucursales().filter(s => s.activa).forEach(s => {
            DB.addInventario({ sucursalId: s.id, productoId: nuevo.id, cantidad: 0 });
          });
          UI.toast('Producto creado', 'success');
        }
        close();
        renderProductos(container);
      });
    });
  };

  window.deleteProducto = function(id) {
    const p = DB.getProductos().find(p => p.id === id);
    if (!p) return;
    UI.confirmDialog(`¿Eliminar "${p.nombre}"?`, () => {
      DB.updateProducto(id, { activo: false });
      UI.toast('Producto eliminado', 'success');
      renderProductos(container);
    });
  };
}

// ==================== SUCURSALES ====================
function renderSucursales(container) {
  const sucursales = DB.getSucursales().filter(s => s.activa);

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div></div>
      <button class="btn btn-primary" onclick="showFormSucursal()">+ Nueva Sucursal</button>
    </div>
    <div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">
      ${sucursales.map(s => {
        const inv = DB.getInventarioSucursal(s.id);
        const totalItems = inv.reduce((sum, i) => sum + i.cantidad, 0);
        const totalValor = inv.reduce((sum, i) => {
          const p = DB.getProductos().find(p => p.id === i.productoId);
          return sum + (p ? p.precio * i.cantidad : 0);
        }, 0);
        const empleados = DB.getUsuarios().filter(u => u.sucursalId === s.id && u.activo);
        return `<div class="card" style="margin:0">
          <div class="card-header">
            <h4>🏛️ ${s.nombre}</h4>
            <div class="card-actions">
              <button class="btn btn-info btn-sm" onclick="showFormSucursal('${s.id}')">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="deleteSucursal('${s.id}')">🗑️</button>
            </div>
          </div>
          <div style="margin-bottom:12px">
            <div style="color:var(--text-muted);font-size:12px">📍 ${s.direccion}</div>
            <div style="color:var(--text-muted);font-size:12px">📞 ${s.telefono}</div>
          </div>
          <div class="stats-grid" style="grid-template-columns:1fr 1fr;gap:8px;margin:0">
            <div class="assistant-stat"><h6>${totalItems}</h6><p>Piezas</p></div>
            <div class="assistant-stat"><h6>${UI.formatCurrency(totalValor)}</h6><p>Valor</p></div>
            <div class="assistant-stat"><h6>${empleados.length}</h6><p>Empleados</p></div>
            <div class="assistant-stat"><h6 class="${totalItems < 20 ? 'trend down' : ''}">${inv.filter(i => i.cantidad < 5).length}</h6><p>Stock bajo</p></div>
          </div>
        </div>`;
      }).join('')}
    </div>`;

  window.showFormSucursal = function(id = null) {
    const s = id ? DB.getSucursales().find(s => s.id === id) : null;
    const title = s ? 'Editar Sucursal' : 'Nueva Sucursal';
    const m = UI.modal(title,
      `<div class="form-group"><label>Nombre</label><input type="text" id="fsNombre" value="${s?.nombre || ''}"></div>
       <div class="form-group"><label>Dirección</label><input type="text" id="fsDireccion" value="${s?.direccion || ''}"></div>
       <div class="form-group"><label>Teléfono</label><input type="text" id="fsTelefono" value="${s?.telefono || ''}"></div>`,
      `<button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
       <button class="btn btn-primary" onclick="saveSucursal('${id || ''}')">${s ? 'Actualizar' : 'Crear'}</button>`
    );
    window.saveSucursal = function(id) {
      const data = {
        nombre: document.getElementById('fsNombre').value.trim(),
        direccion: document.getElementById('fsDireccion').value.trim(),
        telefono: document.getElementById('fsTelefono').value.trim()
      };
      if (!data.nombre) { UI.toast('El nombre es obligatorio', 'error'); return; }
      if (id) {
        DB.updateSucursal(id, data);
        UI.toast('Sucursal actualizada', 'success');
      } else {
        const nueva = DB.addSucursal(data);
        DB.getProductos().filter(p => p.activo).forEach(p => {
          DB.addInventario({ sucursalId: nueva.id, productoId: p.id, cantidad: 0 });
        });
        UI.toast('Sucursal creada', 'success');
      }
      m.closest('.modal-overlay').remove();
      renderSucursales(container);
    };
  };

  window.deleteSucursal = function(id) {
    const s = DB.getSucursales().find(s => s.id === id);
    if (!s) return;
    UI.confirmDialog(`¿Desactivar "${s.nombre}"?`, () => {
      DB.updateSucursal(id, { activa: false });
      UI.toast('Sucursal desactivada', 'success');
      renderSucursales(container);
    });
  };
}

// ==================== INVENTARIO ====================
function renderInventario(container) {
  const sucursales = DB.getSucursales().filter(s => s.activa);
  const productos = DB.getProductos().filter(p => p.activo);
  const inventario = DB.getInventario();

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="searchInventario" placeholder="Buscar..." oninput="filterInventario()">
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <select id="filterSucursalInv" onchange="filterInventario()" style="padding:8px 12px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-primary)">
          <option value="">Todas las sucursales</option>
          ${sucursales.map(s => `<option value="${s.id}">${s.nombre}</option>`).join('')}
        </select>
        <button class="btn btn-success" onclick="showReabastecer()">📦 Reabastecer</button>
      </div>
    </div>
    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr><th>Sucursal</th><th>Producto</th><th>Tipo</th><th>Metal</th><th>Cantidad</th><th>Valor Total</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody id="inventarioTableBody">
            ${inventario.map(item => {
              const s = sucursales.find(ss => ss.id === item.sucursalId);
              const p = productos.find(pp => pp.id === item.productoId);
              if (!s || !p) return '';
              const valor = p.precio * item.cantidad;
              const estado = item.cantidad === 0 ? 'tag-inactive' : item.cantidad < 5 ? 'tag-warning' : 'tag-active';
              const estadoText = item.cantidad === 0 ? 'Sin stock' : item.cantidad < 5 ? 'Stock bajo' : 'Disponible';
              return `<tr>
                <td><strong>${s.nombre}</strong></td>
                <td>${p.nombre}</td>
                <td>${UI.tipoProducto(p.tipo)}</td>
                <td>${UI.metalTag(p.metal)}</td>
                <td>${item.cantidad}</td>
                <td>${UI.formatCurrency(valor)}</td>
                <td><span class="tag ${estado}">${estadoText}</span></td>
                <td class="actions">
                  <button class="btn btn-success btn-sm" onclick="ajustarStock('${item.id}')">✏️</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  window.filterInventario = function() {
    const q = document.getElementById('searchInventario').value.toLowerCase();
    const sucFiltro = document.getElementById('filterSucursalInv').value;
    const rows = document.querySelectorAll('#inventarioTableBody tr');
    rows.forEach(row => {
      const matchSuc = !sucFiltro || row.cells[0].textContent.includes(sucFiltro);
      const matchQ = row.textContent.toLowerCase().includes(q);
      row.style.display = (matchSuc && matchQ) ? '' : 'none';
    });
  };

  window.ajustarStock = function(id) {
    const item = inventario.find(i => i.id === id);
    if (!item) return;
    const p = DB.getProductos().find(p => p.id === item.productoId);
    const s = DB.getSucursales().find(s => s.id === item.sucursalId);
    if (!p || !s) return;

    const m = UI.modal('Ajustar Stock',
      `<div class="form-group"><label>Sucursal</label><input type="text" value="${s.nombre}" disabled style="opacity:0.6"></div>
       <div class="form-group"><label>Producto</label><input type="text" value="${p.nombre}" disabled style="opacity:0.6"></div>
       <div class="form-group"><label>Stock Actual</label><input type="text" value="${item.cantidad}" disabled style="opacity:0.6"></div>
       <div class="form-group"><label>Nueva Cantidad</label><input type="number" id="nuevaCantidad" value="${item.cantidad}" min="0" step="1"></div>`,
      `<button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
       <button class="btn btn-primary" onclick="saveStock('${id}')">Guardar</button>`
    );
    window.saveStock = function(id) {
      const cant = parseInt(document.getElementById('nuevaCantidad').value);
      if (isNaN(cant) || cant < 0) { UI.toast('Cantidad inválida', 'error'); return; }
      const old = inventario.find(i => i.id === id);
      DB.updateInventario(id, { cantidad: cant });
      const diff = cant - (old ? old.cantidad : 0);
      if (diff !== 0) {
        DB.addMovimiento({
          tipo: diff > 0 ? 'entrada' : 'salida',
          productoId: item.productoId,
          sucursalId: item.sucursalId,
          cantidad: Math.abs(diff)
        });
      }
      UI.toast('Stock actualizado', 'success');
      m.closest('.modal-overlay').remove();
      renderInventario(container);
    };
  };

  window.showReabastecer = function() {
    const m = UI.modal('Reabastecer Sucursal',
      `<div class="form-group">
        <label>Sucursal</label>
        <select id="rbSucursal">
          ${sucursales.map(s => `<option value="${s.id}">${s.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Producto</label>
        <select id="rbProducto">
          ${productos.map(p => `<option value="${p.id}">${p.nombre} - ${UI.formatCurrency(p.precio)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Cantidad a agregar</label>
        <input type="number" id="rbCantidad" value="5" min="1" step="1">
      </div>`,
      `<button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
       <button class="btn btn-success" onclick="doReabastecer()">Reabastecer</button>`
    );
    window.doReabastecer = function() {
      const sucId = document.getElementById('rbSucursal').value;
      const prodId = document.getElementById('rbProducto').value;
      const cant = parseInt(document.getElementById('rbCantidad').value);
      if (!cant || cant < 1) { UI.toast('Cantidad inválida', 'error'); return; }

      const existing = DB.getInventario().find(i => i.sucursalId === sucId && i.productoId === prodId);
      if (existing) {
        DB.updateInventario(existing.id, { cantidad: existing.cantidad + cant });
      } else {
        DB.addInventario({ sucursalId: sucId, productoId: prodId, cantidad: cant });
      }
      DB.addMovimiento({ tipo: 'entrada', productoId: prodId, sucursalId: sucId, cantidad: cant });
      UI.toast('Inventario reabastecido', 'success');
      m.closest('.modal-overlay').remove();
      renderInventario(container);
    };
  };
}

// ==================== USUARIOS ====================
function renderUsuarios(container) {
  const usuarios = DB.getUsuarios().filter(u => u.activo);
  const sucursales = DB.getSucursales().filter(s => s.activa);
  const roles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'gerente', label: 'Gerente' },
    { value: 'operario', label: 'Operario' }
  ];

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div></div>
      <button class="btn btn-primary" onclick="showFormUsuario()">+ Nuevo Usuario</button>
    </div>
    <div class="card">
      <div class="table-container">
        <table>
          <thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Sucursal</th><th>Registro</th><th>Acciones</th></tr></thead>
          <tbody>
            ${usuarios.map(u => `<tr>
              <td><strong>${u.username}</strong></td>
              <td>${u.nombre}</td>
              <td>${UI.rolBadge(u.rol)}</td>
              <td>${UI.sucursalNombre(u.sucursalId)}</td>
              <td>${UI.formatDate(u.fechaRegistro)}</td>
              <td class="actions">
                <button class="btn btn-info btn-sm" onclick="showFormUsuario('${u.id}')">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deleteUsuario('${u.id}')">🗑️</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
        ${usuarios.length === 0 ? '<div class="empty-state"><div class="icon">👥</div><h4>No hay usuarios</h4></div>' : ''}
      </div>
    </div>`;

  window.showFormUsuario = function(id = null) {
    const u = id ? DB.getUsuarios().find(u => u.id === id) : null;
    const title = u ? 'Editar Usuario' : 'Nuevo Usuario';
    const m = UI.modal(title,
      `<div class="grid-2">
        ${UI.formField('Nombre Completo', 'text', 'fuNombre', u?.nombre || '')}
        ${UI.formField('Usuario', 'text', 'fuUsername', u?.username || '')}
        ${UI.formField('Contraseña', 'password', 'fuPassword', '')}
        ${UI.formField('Rol', 'select', 'fuRol', u?.rol || 'operario', roles)}
        ${UI.formField('Sucursal', 'select', 'fuSucursal', u?.sucursalId || '', sucursales.map(s => ({ value: s.id, label: s.nombre })))}
      </div>`,
      `<button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
       <button class="btn btn-primary" onclick="saveUsuario('${id || ''}')">${u ? 'Actualizar' : 'Crear'}</button>`
    );
    window.saveUsuario = function(id) {
      const data = {
        nombre: document.getElementById('fuNombre').value.trim(),
        username: document.getElementById('fuUsername').value.trim(),
        rol: document.getElementById('fuRol').value,
        sucursalId: document.getElementById('fuSucursal').value
      };
      const pass = document.getElementById('fuPassword').value;
      if (pass) data.password = pass;
      if (!data.nombre || !data.username) { UI.toast('Nombre y usuario son obligatorios', 'error'); return; }
      if (!id) {
        if (!pass) { UI.toast('La contraseña es obligatoria', 'error'); return; }
        if (DB.findUsuario(data.username)) { UI.toast('El usuario ya existe', 'error'); return; }
        DB.addUsuario(data);
        UI.toast('Usuario creado', 'success');
      } else {
        DB.updateUsuario(id, data);
        UI.toast('Usuario actualizado', 'success');
      }
      m.closest('.modal-overlay').remove();
      renderUsuarios(container);
    };
  };

  window.deleteUsuario = function(id) {
    const u = DB.getUsuarios().find(u => u.id === id);
    if (!u) return;
    UI.confirmDialog(`¿Desactivar a "${u.nombre}"?`, () => {
      DB.updateUsuario(id, { activo: false });
      UI.toast('Usuario desactivado', 'success');
      renderUsuarios(container);
    });
  };
}

// ==================== HORARIOS ====================
function renderHorarios(container) {
  const horarios = DB.getHorarios();
  const operarios = DB.getUsuarios().filter(u => u.activo && (u.rol === 'operario' || u.rol === 'gerente'));
  const sucursales = DB.getSucursales().filter(s => s.activa);
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  window._reloadHorarios = function() {
    const c = document.getElementById('pageContent');
    if (c) renderHorarios(c);
  };

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <select id="filterOperario" onchange="_reloadHorarios()" style="padding:8px 12px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-primary)">
          <option value="">Todos los operarios</option>
          ${operarios.map(o => `<option value="${o.id}">${o.nombre}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary" onclick="showFormHorario()">+ Asignar Horario</button>
    </div>
    <div class="card">
      <div class="table-container">
        <table>
          <thead><tr><th>Operario</th><th>Sucursal</th><th>Día</th><th>Horario</th><th>Acciones</th></tr></thead>
          <tbody id="horariosTableBody">
            ${horarios.map(h => {
              const op = operarios.find(o => o.id === h.operarioId);
              const s = sucursales.find(ss => ss.id === h.sucursalId);
              const filtroOp = document.getElementById('filterOperario');
              const filtroVal = filtroOp ? filtroOp.value : '';
              if (filtroVal && h.operarioId !== filtroVal) return '';
              return `<tr>
                <td><strong>${op?.nombre || '—'}</strong></td>
                <td>${s?.nombre || '—'}</td>
                <td>${dias[h.dia] || '—'}</td>
                <td>${h.horaInicio} - ${h.horaFin}</td>
                <td class="actions">
                  <button class="btn btn-info btn-sm" onclick="showFormHorario('${h.id}')">✏️</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteHorario('${h.id}')">🗑️</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        ${horarios.length === 0 ? '<div class="empty-state"><div class="icon">🕐</div><h4>No hay horarios asignados</h4></div>' : ''}
      </div>
    </div>`;

  window.showFormHorario = function(id = null) {
    const h = id ? DB.getHorarios().find(h => h.id === id) : null;
    const title = h ? 'Editar Horario' : 'Asignar Horario';
    const m = UI.modal(title,
      `<div class="form-group">
        <label>Operario</label>
        <select id="fhOperario">
          ${operarios.map(o => `<option value="${o.id}" ${h?.operarioId === o.id ? 'selected' : ''}>${o.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Sucursal</label>
        <select id="fhSucursal">
          ${sucursales.map(s => `<option value="${s.id}" ${h?.sucursalId === s.id ? 'selected' : ''}>${s.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="grid-3">
        <div class="form-group">
          <label>Día</label>
          <select id="fhDia">
            ${dias.map((d, i) => `<option value="${i}" ${h?.dia === i ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Hora Inicio</label>
          <input type="time" id="fhInicio" value="${h?.horaInicio || '09:00'}">
        </div>
        <div class="form-group">
          <label>Hora Fin</label>
          <input type="time" id="fhFin" value="${h?.horaFin || '18:00'}">
        </div>
      </div>`,
      `<button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
       <button class="btn btn-primary" onclick="saveHorario('${id || ''}')">${h ? 'Actualizar' : 'Asignar'}</button>`
    );
    window.saveHorario = function(id) {
      const data = {
        operarioId: document.getElementById('fhOperario').value,
        sucursalId: document.getElementById('fhSucursal').value,
        dia: parseInt(document.getElementById('fhDia').value),
        horaInicio: document.getElementById('fhInicio').value,
        horaFin: document.getElementById('fhFin').value
      };
      if (id) {
        DB.updateHorario(id, data);
        UI.toast('Horario actualizado', 'success');
      } else {
        DB.addHorario(data);
        UI.toast('Horario asignado', 'success');
      }
      m.closest('.modal-overlay').remove();
      renderHorarios(container);
    };
  };

  window.deleteHorario = function(id) {
    UI.confirmDialog('¿Eliminar este horario?', () => {
      DB.deleteHorario(id);
      UI.toast('Horario eliminado', 'success');
      renderHorarios(container);
    });
  };
}

// ==================== CLIENTES ====================
function renderClientes(container) {
  const clientes = DB.getClientes();

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="searchClientes" placeholder="Buscar clientes..." oninput="filterClientes()">
      </div>
      <button class="btn btn-primary" onclick="showFormCliente()">+ Nuevo Cliente</button>
    </div>
    <div class="card">
      <div class="table-container">
        <table>
          <thead><tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Dirección</th><th>Notas</th><th>Registro</th><th>Acciones</th></tr></thead>
          <tbody id="clientesTableBody">
            ${clientes.map(c => `<tr>
              <td><strong>${c.nombre}</strong></td>
              <td>${c.telefono || '—'}</td>
              <td>${c.email || '—'}</td>
              <td>${c.direccion || '—'}</td>
              <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.notas || '—'}</td>
              <td>${UI.formatDate(c.fechaRegistro)}</td>
              <td class="actions">
                <button class="btn btn-info btn-sm" onclick="showFormCliente('${c.id}')">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCliente('${c.id}')">🗑️</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
        ${clientes.length === 0 ? '<div class="empty-state"><div class="icon">👤</div><h4>No hay clientes registrados</h4></div>' : ''}
      </div>
    </div>`;

  window.filterClientes = function() {
    const q = document.getElementById('searchClientes').value.toLowerCase();
    const rows = document.querySelectorAll('#clientesTableBody tr');
    rows.forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };

  window.showFormCliente = function(id = null) {
    const c = id ? DB.getClientes().find(c => c.id === id) : null;
    const title = c ? 'Editar Cliente' : 'Nuevo Cliente';
    const m = UI.modal(title,
      `<div class="grid-2">
        ${UI.formField('Nombre', 'text', 'fcNombre', c?.nombre || '')}
        ${UI.formField('Teléfono', 'text', 'fcTelefono', c?.telefono || '')}
        ${UI.formField('Email', 'email', 'fcEmail', c?.email || '')}
        ${UI.formField('Dirección', 'text', 'fcDireccion', c?.direccion || '')}
      </div>
      <div class="form-group"><label>Notas</label><textarea id="fcNotas">${c?.notas || ''}</textarea></div>`,
      `<button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
       <button class="btn btn-primary" onclick="saveCliente('${id || ''}')">${c ? 'Actualizar' : 'Crear'}</button>`
    );
    window.saveCliente = function(id) {
      const data = {
        nombre: document.getElementById('fcNombre').value.trim(),
        telefono: document.getElementById('fcTelefono').value.trim(),
        email: document.getElementById('fcEmail').value.trim(),
        direccion: document.getElementById('fcDireccion').value.trim(),
        notas: document.getElementById('fcNotas').value.trim()
      };
      if (!data.nombre) { UI.toast('El nombre es obligatorio', 'error'); return; }
      if (id) {
        DB.updateCliente(id, data);
        UI.toast('Cliente actualizado', 'success');
      } else {
        DB.addCliente(data);
        UI.toast('Cliente registrado', 'success');
      }
      m.closest('.modal-overlay').remove();
      renderClientes(container);
    };
  };

  window.deleteCliente = function(id) {
    UI.confirmDialog('¿Eliminar este cliente?', () => {
      DB.deleteCliente(id);
      UI.toast('Cliente eliminado', 'success');
      renderClientes(container);
    });
  };
}

// ==================== PROVEEDORES ====================
function renderProveedores(container) {
  const proveedores = DB.getProveedores();

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="searchProveedores" placeholder="Buscar proveedores..." oninput="filterProveedores()">
      </div>
      <button class="btn btn-primary" onclick="showFormProveedor()">+ Nuevo Proveedor</button>
    </div>
    <div class="card">
      <div class="table-container">
        <table>
          <thead><tr><th>Empresa</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>Materiales</th><th>Notas</th><th>Acciones</th></tr></thead>
          <tbody id="proveedoresTableBody">
            ${proveedores.map(p => `<tr>
              <td><strong>${p.empresa}</strong></td>
              <td>${p.contacto || '—'}</td>
              <td>${p.telefono || '—'}</td>
              <td>${p.email || '—'}</td>
              <td>${p.materiales || '—'}</td>
              <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.notas || '—'}</td>
              <td class="actions">
                <button class="btn btn-info btn-sm" onclick="showFormProveedor('${p.id}')">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProveedor('${p.id}')">🗑️</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
        ${proveedores.length === 0 ? '<div class="empty-state"><div class="icon">🚚</div><h4>No hay proveedores registrados</h4></div>' : ''}
      </div>
    </div>`;

  window.filterProveedores = function() {
    const q = document.getElementById('searchProveedores').value.toLowerCase();
    const rows = document.querySelectorAll('#proveedoresTableBody tr');
    rows.forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };

  window.showFormProveedor = function(id = null) {
    const p = id ? DB.getProveedores().find(p => p.id === id) : null;
    const title = p ? 'Editar Proveedor' : 'Nuevo Proveedor';
    const m = UI.modal(title,
      `<div class="grid-2">
        ${UI.formField('Empresa', 'text', 'fpEmpresa', p?.empresa || '')}
        ${UI.formField('Contacto', 'text', 'fpContacto', p?.contacto || '')}
        ${UI.formField('Teléfono', 'text', 'fpTelefono', p?.telefono || '')}
        ${UI.formField('Email', 'email', 'fpEmail', p?.email || '')}
      </div>
      <div class="form-group"><label>Materiales que provee</label><input type="text" id="fpMateriales" value="${p?.materiales || ''}"></div>
      <div class="form-group"><label>Notas</label><textarea id="fpNotas">${p?.notas || ''}</textarea></div>`,
      `<button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
       <button class="btn btn-primary" onclick="saveProveedor('${id || ''}')">${p ? 'Actualizar' : 'Crear'}</button>`
    );
    window.saveProveedor = function(id) {
      const data = {
        empresa: document.getElementById('fpEmpresa').value.trim(),
        contacto: document.getElementById('fpContacto').value.trim(),
        telefono: document.getElementById('fpTelefono').value.trim(),
        email: document.getElementById('fpEmail').value.trim(),
        materiales: document.getElementById('fpMateriales').value.trim(),
        notas: document.getElementById('fpNotas').value.trim()
      };
      if (!data.empresa) { UI.toast('El nombre de empresa es obligatorio', 'error'); return; }
      if (id) {
        DB.updateProveedor(id, data);
        UI.toast('Proveedor actualizado', 'success');
      } else {
        DB.addProveedor(data);
        UI.toast('Proveedor registrado', 'success');
      }
      m.closest('.modal-overlay').remove();
      renderProveedores(container);
    };
  };

  window.deleteProveedor = function(id) {
    UI.confirmDialog('¿Eliminar este proveedor?', () => {
      DB.deleteProveedor(id);
      UI.toast('Proveedor eliminado', 'success');
      renderProveedores(container);
    });
  };
}
