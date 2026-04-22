function ensureAuthenticated(req, res, next) {
  if (!req.session.user) {
    req.flash('error_msg', 'Silakan login terlebih dahulu.');
    return res.redirect('/auth/login');
  }
  next();
}

module.exports = {
  ensureAuthenticated
};