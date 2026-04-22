function ensureRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session.user) {
      req.flash('error_msg', 'Silakan login terlebih dahulu.');
      return res.redirect('/auth/login');
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      req.flash('error_msg', 'Anda tidak memiliki akses ke halaman ini.');
      return res.redirect('/auth/login');
    }

    next();
  };
}

module.exports = {
  ensureRole
};