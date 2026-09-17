const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ensureRole } = require('../../middlewares/roleMiddleware');

function createMockReq({ user = null } = {}) {
  const flashCalls = [];
  return {
    session: user ? { user } : {},
    flash: (type, msg) => {
      flashCalls.push({ type, msg });
    },
    _flashCalls: flashCalls
  };
}

function createMockRes() {
  const redirectCalls = [];
  return {
    redirect: (url) => {
      redirectCalls.push(url);
    },
    _redirectCalls: redirectCalls
  };
}

describe('Unit Test: middlewares/roleMiddleware.js', () => {
  describe('ensureRole()', () => {
    it('1. harus mengarahkan ke /auth/login dan mengirim flash error jika user belum login (session kosong)', () => {
      const middleware = ensureRole('eksekutor', 'koordinator');
      const req = createMockReq({ user: null });
      const res = createMockRes();
      let nextCalled = false;

      middleware(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res._redirectCalls.length, 1);
      assert.equal(res._redirectCalls[0], '/auth/login');
      assert.equal(req._flashCalls.length, 1);
      assert.deepEqual(req._flashCalls[0], {
        type: 'error_msg',
        msg: 'Silakan login terlebih dahulu.'
      });
    });

    it('2. harus mengarahkan ke /auth/login dan mengirim flash error jika role user tidak diizinkan', () => {
      const middleware = ensureRole('super_admin');
      const req = createMockReq({
        user: { id: 2, username: 'eksekutor1', role: 'eksekutor' }
      });
      const res = createMockRes();
      let nextCalled = false;

      middleware(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res._redirectCalls.length, 1);
      assert.equal(res._redirectCalls[0], '/auth/login');
      assert.equal(req._flashCalls.length, 1);
      assert.deepEqual(req._flashCalls[0], {
        type: 'error_msg',
        msg: 'Anda tidak memiliki akses ke halaman ini.'
      });
    });

    it('3. harus memanggil next() tepat satu kali dan tidak melakukan redirect jika role user diizinkan', () => {
      const middleware = ensureRole('koordinator', 'super_admin');
      const req = createMockReq({
        user: { id: 1, username: 'koordinator1', role: 'koordinator' }
      });
      const res = createMockRes();
      let nextCallCount = 0;

      middleware(req, res, () => {
        nextCallCount += 1;
      });

      assert.equal(nextCallCount, 1);
      assert.equal(res._redirectCalls.length, 0);
      assert.equal(req._flashCalls.length, 0);
    });
  });
});
