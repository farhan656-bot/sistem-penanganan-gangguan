const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const sessionMiddleware = require('./config/session');
const { initTelegramBotService } = require('./services/telegramBotService');
const viewHelpers = require('./utils/viewHelpers');

dotenv.config();
const app = express();

try {
  initTelegramBotService();
} catch (error) {
  console.error('Gagal inisialisasi Telegram bot service:', error.message || error);
}

// routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const regionSwitchRoutes = require('./routes/regionSwitchRoutes');
// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(sessionMiddleware);
app.use(flash());

// global variables
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.warning_msg = req.flash('warning_msg');
  res.locals.info_msg = req.flash('info_msg');

  // Shared UI helpers for EJS (badge meta + date formatting)
  // Kept in res.locals so partial includes don't need to "export" symbols.
  Object.assign(res.locals, viewHelpers);
  next();
});

// root
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  if (req.session.user.role === 'eksekutor') {
    return res.redirect('/dashboard/eksekutor');
  }

  if (req.session.user.role === 'koordinator') {
    return res.redirect('/dashboard/koordinator');
  }

  if (req.session.user.role === 'supervisor') {
    return res.redirect('/dashboard/supervisor');
  }

  if (req.session.user.role === 'super_admin') {
    return res.redirect('/dashboard/super-admin');
  }

  return res.redirect('/auth/login');
});

// use routes
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/reports', reportRoutes);
app.use('/users', userRoutes);
app.use('/region-switch', regionSwitchRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});