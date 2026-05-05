const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseOptionalRegionId(value) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function listUsers(req, res) {
  try {
    const users = await userModel.getAllUsers();

    return res.render('users/index', {
      title: 'Manajemen User',
      users
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memuat daftar user.');
    return res.redirect('/dashboard/super-admin');
  }
}

async function showCreateUser(req, res) {
  try {
    const roles = await userModel.getAllRoles();
    const regions = await userModel.getAllRegions();

    return res.render('users/create', {
      title: 'Tambah User',
      roles,
      regions,
      formData: {
        full_name: '',
        username: '',
        role_id: '',
        region_id: ''
      }
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memuat form tambah user.');
    return res.redirect('/users');
  }
}

async function createUser(req, res) {
  try {
    const full_name = normalizeText(req.body.full_name);
    const username = normalizeText(req.body.username);
    const password = normalizeText(req.body.password);
    const role_id = Number(req.body.role_id);

    if (!full_name || !username || !password || !Number.isInteger(role_id)) {
      req.flash('error_msg', 'Nama lengkap, username, password, dan role wajib diisi.');
      return res.redirect('/users/create');
    }

    const [roles, regions] = await Promise.all([
      userModel.getAllRoles(),
      userModel.getAllRegions()
    ]);

    const selectedRole = roles.find(role => role.id === role_id);

    if (!selectedRole) {
      req.flash('error_msg', 'Role tidak valid.');
      return res.redirect('/users/create');
    }

    const usernameTaken = await userModel.isUsernameTaken(username);

    if (usernameTaken) {
      req.flash('error_msg', 'Username sudah digunakan.');
      return res.redirect('/users/create');
    }

    let region_id = parseOptionalRegionId(req.body.region_id);

    if (selectedRole.name === 'eksekutor' && !region_id) {
      req.flash('error_msg', 'Wilayah wajib dipilih untuk role eksekutor.');
      return res.redirect('/users/create');
    }

    if (region_id) {
      const regionExists = regions.some(region => region.id === region_id);
      if (!regionExists) {
        req.flash('error_msg', 'Wilayah tidak valid.');
        return res.redirect('/users/create');
      }
    }

    if (selectedRole.name !== 'eksekutor') {
      region_id = null;
    }

    const password_hash = await bcrypt.hash(password, 10);

    await userModel.createUser({
      full_name,
      username,
      password_hash,
      role_id,
      region_id,
      is_active: 1
    });

    req.flash('success_msg', 'User baru berhasil ditambahkan.');
    return res.redirect('/users');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal menambahkan user.');
    return res.redirect('/users/create');
  }
}

async function showEditUser(req, res) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId)) {
      req.flash('error_msg', 'ID user tidak valid.');
      return res.redirect('/users');
    }

    const [user, roles, regions] = await Promise.all([
      userModel.findById(userId),
      userModel.getAllRoles(),
      userModel.getAllRegions()
    ]);

    if (!user) {
      req.flash('error_msg', 'User tidak ditemukan.');
      return res.redirect('/users');
    }

    return res.render('users/edit', {
      title: 'Edit User',
      user,
      roles,
      regions
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memuat form edit user.');
    return res.redirect('/users');
  }
}

async function updateUser(req, res) {
  const userId = Number(req.params.id);

  try {
    if (!Number.isInteger(userId)) {
      req.flash('error_msg', 'ID user tidak valid.');
      return res.redirect('/users');
    }

    const full_name = normalizeText(req.body.full_name);
    const username = normalizeText(req.body.username);
    const password = normalizeText(req.body.password);
    const role_id = Number(req.body.role_id);
    const is_active = req.body.is_active === '0' ? 0 : 1;

    if (!full_name || !username || !Number.isInteger(role_id)) {
      req.flash('error_msg', 'Nama lengkap, username, dan role wajib diisi.');
      return res.redirect(`/users/${userId}/edit`);
    }

    const [existingUser, roles, regions] = await Promise.all([
      userModel.findById(userId),
      userModel.getAllRoles(),
      userModel.getAllRegions()
    ]);

    if (!existingUser) {
      req.flash('error_msg', 'User tidak ditemukan.');
      return res.redirect('/users');
    }

    const selectedRole = roles.find(role => role.id === role_id);

    if (!selectedRole) {
      req.flash('error_msg', 'Role tidak valid.');
      return res.redirect(`/users/${userId}/edit`);
    }

    const usernameTaken = await userModel.isUsernameTaken(username, userId);

    if (usernameTaken) {
      req.flash('error_msg', 'Username sudah digunakan.');
      return res.redirect(`/users/${userId}/edit`);
    }

    let region_id = parseOptionalRegionId(req.body.region_id);

    if (selectedRole.name === 'eksekutor' && !region_id) {
      req.flash('error_msg', 'Wilayah wajib dipilih untuk role eksekutor.');
      return res.redirect(`/users/${userId}/edit`);
    }

    if (region_id) {
      const regionExists = regions.some(region => region.id === region_id);
      if (!regionExists) {
        req.flash('error_msg', 'Wilayah tidak valid.');
        return res.redirect(`/users/${userId}/edit`);
      }
    }

    if (selectedRole.name !== 'eksekutor') {
      region_id = null;
    }

    const payload = {
      full_name,
      username,
      role_id,
      region_id,
      is_active
    };

    if (password) {
      payload.password_hash = await bcrypt.hash(password, 10);
    }

    await userModel.updateUser(userId, payload);

    req.flash('success_msg', 'Data user berhasil diperbarui.');
    return res.redirect('/users');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memperbarui data user.');
    return res.redirect(`/users/${userId}/edit`);
  }
}

module.exports = {
  listUsers,
  showCreateUser,
  createUser,
  showEditUser,
  updateUser
};
