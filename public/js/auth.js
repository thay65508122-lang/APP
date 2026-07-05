const Auth = {
  async login(username, password) {
    try {
      const res = await API.login(username, password);
      return { success: true, user: res.user };
    } catch (e) {
      return { success: false, error: e.message || 'Error al iniciar sesión' };
    }
  },

  logout() {
    API.logout();
  },

  getSession() {
    return API.getSession();
  },

  isLoggedIn() {
    return API.isLoggedIn();
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
