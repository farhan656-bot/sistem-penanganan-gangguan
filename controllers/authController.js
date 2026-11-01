const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

function getRoleDashboardPath(role) {
  switch (role) {
    case 'eksekutor':
      return '/dashboard/eksekutor';
    case 'koordinator':
      return '/dashboard/koordinator';
    case 'supervisor':
      return '/dashboard/supervisor';
    case 'super_admin':
      return '/dashboard/super-admin';
    default:
      return '/';
  }
}

function showLoginPage(req, res) {
  if (req.session && req.session.user) {
    return res.redirect(getRoleDashboardPath(req.session.user.role));
  }

  res.render('auth/login', {
    title: 'Login'
  });
}

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      req.flash('error_msg', 'Username dan password wajib diisi.');
      return res.redirect('/auth/login');
    }

    const user = await userModel.findByUsername(username);

    if (!user) {
      req.flash('error_msg', 'Username atau password salah.');
      return res.redirect('/auth/login');
    }

    if (!user.is_active) {
      req.flash('error_msg', 'Akun tidak aktif.');
      return res.redirect('/auth/login');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      req.flash('error_msg', 'Username atau password salah.');
      return res.redirect('/auth/login');
    }

    req.session.regenerate((regenErr) => {
      if (regenErr) {
        console.error('Session regenerate error:', regenErr);
        req.flash('error_msg', 'Terjadi kesalahan saat menginisialisasi sesi.');
        return res.redirect('/auth/login');
      }

      req.session.user = {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        role: user.role_name,
        region_id: user.region_id,
        region_code: user.region_code,
        region_name: user.region_name
      };

      req.flash('success_msg', 'Login berhasil.');

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error during login:', saveErr);
          req.flash('error_msg', 'Terjadi kesalahan saat menyimpan sesi login.');
          return res.redirect('/auth/login');
        }

        return res.redirect(getRoleDashboardPath(user.role_name));
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat login.');
    return res.redirect('/auth/login');
  }
}

function logout(req, res) {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.clearCookie('sid', { path: '/' });
    return res.redirect('/auth/login');
  });
}

module.exports = {
  getRoleDashboardPath,
  showLoginPage,
  login,
  logout
};
