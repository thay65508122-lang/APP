const UI = {
  toast(msg, type = 'info', duration = 4000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${msg}</span>`;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, duration);
  },

  modal(title, content, footer = '') {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">${content}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>`;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    return overlay.querySelector('.modal');
  },

  modalDynamic(title, bodyFn, footerFn) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body"></div>
      <div class="modal-footer"></div>`;
    overlay.appendChild(modal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    const body = modal.querySelector('.modal-body');
    const footer = modal.querySelector('.modal-footer');
    if (bodyFn) bodyFn(body);
    if (footerFn) footerFn(footer);
    return { modal, body, footer, overlay, close: () => overlay.remove() };
  },

  formField(label, type, id, value = '', options = null, extraAttrs = '') {
    let input = '';
    if (type === 'select' && options) {
      let opts = options.map(o => `<option value="${o.value}" ${o.value === value ? 'selected' : ''}>${o.label}</option>`).join('');
      input = `<select id="${id}" ${extraAttrs}>${opts}</select>`;
    } else if (type === 'textarea') {
      input = `<textarea id="${id}" ${extraAttrs}>${value}</textarea>`;
    } else {
      input = `<input type="${type}" id="${id}" value="${value}" ${extraAttrs}>`;
    }
    return `<div class="form-group"><label for="${id}">${label}</label>${input}</div>`;
  },

  confirmDialog(msg, cb) {
    const m = this.modal('Confirmar',
      `<p style="margin:0;color:var(--text-secondary)">${msg}</p>`,
      `<button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
       <button class="btn btn-danger" id="btn-confirm">Eliminar</button>`
    );
    m.querySelector('#btn-confirm').addEventListener('click', () => {
      m.closest('.modal-overlay').remove();
      if (cb) cb();
    });
  },

  statCard(icon, label, value, trend = null, iconClass = 'gold') {
    const trendHtml = trend ? `<div class="trend ${trend.dir}">${trend.text}</div>` : '';
    return `<div class="stat-card">
      <div class="stat-icon ${iconClass}">${icon}</div>
      <div class="stat-info">
        <h5>${value}</h5>
        <p>${label}</p>
        ${trendHtml}
      </div>
    </div>`;
  },

  metalTag(metal) {
    const map = { oro: 'Oro', plata: 'Plata', platino: 'Platino', cobre: 'Cobre', bronce: 'Bronce' };
    const display = map[metal] || metal;
    return `<span class="tag tag-${metal}">${display}</span>`;
  },

  gemaNombre(gema) {
    const map = {
      diamante: '💎 Diamante',
      rubi: '🔴 Rubí',
      esmeralda: '🟢 Esmeralda',
      zafiro: '🔵 Zafiro',
      perla: '⚪ Perla',
      ninguna: '—'
    };
    return map[gema] || gema;
  },

  tipoProducto(tipo) {
    const map = {
      anillo: 'Anillo',
      collar: 'Collar',
      pulsera: 'Pulsera',
      aretes: 'Aretes',
      dije: 'Dije',
      mancuernillas: 'Mancuernillas',
      gargantilla: 'Gargantilla',
      tobillera: 'Tobillera'
    };
    return map[tipo] || tipo;
  },

  formatCurrency(n) {
    return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  },

  rolBadge(rol) {
    const map = { admin: 'Administrador', gerente: 'Gerente', operario: 'Operario' };
    const colorMap = { admin: 'tag-gold', gerente: 'tag-info', operario: 'tag-silver' };
    return `<span class="tag ${colorMap[rol] || 'tag-info'}">${map[rol] || rol}</span>`;
  },

  sucursalNombre(id, sucursales = null) {
    if (sucursales) {
      const s = sucursales.find(s => s.id === id);
      return s ? s.nombre : '—';
    }
    return '—';
  },

  diaNombre(dia) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[dia] || dia;
  }
};
