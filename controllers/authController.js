const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

function showLoginPage(req, res) {
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

    if (user.role_name === 'eksekutor') {
      return res.redirect('/dashboard/eksekutor');
    }

    if (user.role_name === 'koordinator') {
      return res.redirect('/dashboard/koordinator');
    }

    if (user.role_name === 'supervisor') {
      return res.redirect('/dashboard/supervisor');
    }

    if (user.role_name === 'super_admin') {
      return res.redirect('/dashboard/super-admin');
    }

    return res.redirect('/');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Terjadi kesalahan saat login.');
    return res.redirect('/auth/login');
  }
}

function logout(req, res) {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.redirect('/');
    }
    res.clearCookie('sid');
    return res.redirect('/auth/login');
  });
}

module.exports = {
  showLoginPage,
  login,
  logout
};