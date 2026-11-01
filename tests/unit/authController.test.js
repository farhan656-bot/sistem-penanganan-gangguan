const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const authController = require('../../controllers/authController');
const userModel = require('../../models/userModel');

function createMockReq({ session = {}, body = {} } = {}) {
  const flashCalls = [];
  return {
    session: {
      user: null,
      regenerate: function (cb) {
        this.regenerated = true;
        this.user = null;
        if (cb) cb(null);
      },
      save: function (cb) {
        this.saved = true;
        if (cb) cb(null);
      },
      destroy: function (cb) {
        this.destroyed = true;
        if (cb) cb(null);
      },
      ...session
    },
    body,
    flash: (type, msg) => {
      flashCalls.push({ type, msg });
    },
    _flashCalls: flashCalls
  };
}

function createMockRes() {
  const redirectCalls = [];
  const renderCalls = [];
  const clearCookieCalls = [];
  return {
    redirect: (url) => {
      redirectCalls.push(url);
    },
    render: (view, data) => {
      renderCalls.push({ view, data });
    },
    clearCookie: (name, options) => {
      clearCookieCalls.push({ name, options });
    },
    _redirectCalls: redirectCalls,
    _renderCalls: renderCalls,
    _clearCookieCalls: clearCookieCalls
  };
}

describe('Unit Test: controllers/authController.js', () => {
  describe('getRoleDashboardPath()', () => {
    it('1. harus memetakan semua role RBAC dengan benar ke dashboard masing-masing', () => {
      assert.equal(authController.getRoleDashboardPath('eksekutor'), '/dashboard/eksekutor');
      assert.equal(authController.getRoleDashboardPath('koordinator'), '/dashboard/koordinator');
      assert.equal(authController.getRoleDashboardPath('supervisor'), '/dashboard/supervisor');
      assert.equal(authController.getRoleDashboardPath('super_admin'), '/dashboard/super-admin');
      assert.equal(authController.getRoleDashboardPath('unknown'), '/');
    });
  });

  describe('showLoginPage()', () => {
    it('2. harus me-render auth/login jika user belum login', () => {
      const req = createMockReq({ session: { user: null } });
      const res = createMockRes();

      authController.showLoginPage(req, res);

      assert.equal(res._renderCalls.length, 1);
      assert.equal(res._renderCalls[0].view, 'auth/login');
      assert.equal(res._redirectCalls.length, 0);
    });

    it('3. harus mengarahkan user yang sudah login langsung ke dashboard sesuai role (Session Guard)', () => {
      const roles = [
        { role: 'eksekutor', target: '/dashboard/eksekutor' },
        { role: 'koordinator', target: '/dashboard/koordinator' },
        { role: 'supervisor', target: '/dashboard/supervisor' },
        { role: 'super_admin', target: '/dashboard/super-admin' }
      ];

      for (const item of roles) {
        const req = createMockReq({ session: { user: { role: item.role } } });
        const res = createMockRes();

        authController.showLoginPage(req, res);

        assert.equal(res._redirectCalls.length, 1);
        assert.equal(res._redirectCalls[0], item.target);
        assert.equal(res._renderCalls.length, 0);
      }
    });
  });

  describe('login()', () => {
    it('4. harus menolak jika username atau password kosong', async () => {
      const req = createMockReq({ body: { username: '', password: '' } });
      const res = createMockRes();

      await authController.login(req, res);

      assert.equal(res._redirectCalls.length, 1);
      assert.equal(res._redirectCalls[0], '/auth/login');
      assert.deepEqual(req._flashCalls[0], {
        type: 'error_msg',
        msg: 'Username dan password wajib diisi.'
      });
    });

    it('5. harus menolak jika user tidak ditemukan', async () => {
      const originalFindByUsername = userModel.findByUsername;
      userModel.findByUsername = async () => null;

      try {
        const req = createMockReq({ body: { username: 'tidak_ada', password: 'password123' } });
        const res = createMockRes();

        await authController.login(req, res);

        assert.equal(res._redirectCalls.length, 1);
        assert.equal(res._redirectCalls[0], '/auth/login');
        assert.deepEqual(req._flashCalls[0], {
          type: 'error_msg',
          msg: 'Username atau password salah.'
        });
      } finally {
        userModel.findByUsername = originalFindByUsername;
      }
    });

    it('6. harus menolak jika akun tidak aktif', async () => {
      const originalFindByUsername = userModel.findByUsername;
      userModel.findByUsername = async () => ({
        id: 10,
        username: 'nonaktif',
        is_active: 0
      });

      try {
        const req = createMockReq({ body: { username: 'nonaktif', password: 'password123' } });
        const res = createMockRes();

        await authController.login(req, res);

        assert.equal(res._redirectCalls.length, 1);
        assert.equal(res._redirectCalls[0], '/auth/login');
        assert.deepEqual(req._flashCalls[0], {
          type: 'error_msg',
          msg: 'Akun tidak aktif.'
        });
      } finally {
        userModel.findByUsername = originalFindByUsername;
      }
    });

    it('7. harus berhasil login, meregenerasi sesi, menyimpan ke store sebelum redirect ke dashboard RBAC', async () => {
      const originalFindByUsername = userModel.findByUsername;
      const hashedPassword = await bcrypt.hash('secret123', 10);

      userModel.findByUsername = async () => ({
        id: 5,
        full_name: 'Farhan Eksekutor',
        username: 'farhan',
        role_name: 'eksekutor',
        region_id: 1,
        region_code: 'PDG',
        region_name: 'Padang',
        is_active: 1,
        password_hash: hashedPassword
      });

      try {
        const req = createMockReq({ body: { username: 'farhan', password: 'secret123' } });
        const res = createMockRes();

        await authController.login(req, res);

        assert.equal(req.session.regenerated, true, 'Sesi harus diregenerasi untuk cegah session fixation');
        assert.equal(req.session.saved, true, 'Sesi harus disimpan secara eksplisit sebelum redirect');
        assert.equal(res._redirectCalls.length, 1);
        assert.equal(res._redirectCalls[0], '/dashboard/eksekutor');
        assert.deepEqual(req.session.user, {
          id: 5,
          full_name: 'Farhan Eksekutor',
          username: 'farhan',
          role: 'eksekutor',
          region_id: 1,
          region_code: 'PDG',
          region_name: 'Padang'
        });
        assert.deepEqual(req._flashCalls[0], {
          type: 'success_msg',
          msg: 'Login berhasil.'
        });
      } finally {
        userModel.findByUsername = originalFindByUsername;
      }
    });
  });

  describe('logout()', () => {
    it('8. harus menghancurkan sesi, menghapus cookie sid path /, dan mengarahkan ke /auth/login', () => {
      const req = createMockReq({ session: { user: { id: 1, username: 'user1' } } });
      const res = createMockRes();

      authController.logout(req, res);

      assert.equal(req.session.destroyed, true);
      assert.equal(res._clearCookieCalls.length, 1);
      assert.deepEqual(res._clearCookieCalls[0], {
        name: 'sid',
        options: { path: '/' }
      });
      assert.equal(res._redirectCalls.length, 1);
      assert.equal(res._redirectCalls[0], '/auth/login');
    });
  });
});

