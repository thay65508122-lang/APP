const Auth = {
  _sessionKey: 'joyeria_session',

  login(username, password) {
    const user = DB.findUsuario(username);
    if (!user || user.password !== password) {
      return { success: false, error: 'Usuario o contraseña incorrectos' };
    }
    if (!user.activo) {
      return { success: false, error: 'Esta cuenta está desactivada' };
    }
    const session = {
      userId: user.id,
      username: user.username,
      nombre: user.nombre,
      rol: user.rol,
      sucursalId: user.sucursalId
    };
    localStorage.setItem(this._sessionKey, JSON.stringify(session));
    return { success: true, user: session };
  },

  logout() {
    localStorage.removeItem(this._sessionKey);
  },

  getSession() {
    try {
      return JSON.parse(localStorage.getItem(this._sessionKey));
    } catch {
      return null;
    }
  },

  isLoggedIn() {
    return this.getSession() !== null;
  },

  isAdmin() {
    const s = this.getSession();
    return s && s.rol === 'admin';
  },

  isGerente() {
    const s = this.getSession();
    return s && (s.rol === 'admin' || s.rol === 'gerente');
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.hash = '#login';
      return false;
    }
    return true;
  }
};
