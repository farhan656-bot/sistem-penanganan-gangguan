const regionSwitchModel = require('../models/regionSwitchModel');
const userModel = require('../models/userModel');

function buildRequestFormData(body = {}) {
  return {
    target_region_id: body.target_region_id || '',
    reason: body.reason || ''
  };
}

async function listMyRequests(req, res) {
  try {
    const requests = await regionSwitchModel.getRequestsByRequester(req.session.user.id);

    return res.render('eksekutor/region-switch/index', {
      title: 'Pengajuan Switch Region',
      requests
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memuat daftar pengajuan switch region.');
    return res.redirect('/dashboard/eksekutor');
  }
}

async function showCreateRequestForm(req, res) {
  try {
    const regions = await userModel.getAllRegions();

    return res.render('eksekutor/region-switch/create', {
      title: 'Form Pengajuan Switch Region',
      regions,
      formData: buildRequestFormData(),
      homeRegionId: req.session.user.region_id
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memuat form pengajuan switch region.');
    return res.redirect('/region-switch/my');
  }
}

async function submitRequest(req, res) {
  try {
    const requesterId = req.session.user.id;
    const homeRegionId = req.session.user.region_id;
    const targetRegionId = Number(req.body.target_region_id);
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';

    if (!homeRegionId) {
      req.flash('error_msg', 'Wilayah utama belum terdaftar. Hubungi admin.');
      return res.redirect('/region-switch/create');
    }

    if (!targetRegionId) {
      req.flash('error_msg', 'Region tujuan wajib dipilih.');
      return res.redirect('/region-switch/create');
    }

    if (Number(homeRegionId) === Number(targetRegionId)) {
      req.flash('error_msg', 'Region tujuan tidak boleh sama dengan region utama.');
      return res.redirect('/region-switch/create');
    }

    if (!reason) {
      req.flash('error_msg', 'Alasan pengajuan wajib diisi.');
      return res.redirect('/region-switch/create');
    }

    const regions = await userModel.getAllRegions();
    const isTargetValid = regions.some((region) => Number(region.id) === Number(targetRegionId));

    if (!isTargetValid) {
      req.flash('error_msg', 'Region tujuan tidak valid.');
      return res.redirect('/region-switch/create');
    }

    const hasDuplicate = await regionSwitchModel.hasDuplicateActiveOrPendingRequest(
      requesterId,
      targetRegionId
    );

    if (hasDuplicate) {
      req.flash('error_msg', 'Pengajuan untuk region ini sudah ada dan masih aktif/pending.');
      return res.redirect('/region-switch/my');
    }

    await regionSwitchModel.createRequest({
      requester_user_id: requesterId,
      home_region_id: homeRegionId,
      target_region_id: targetRegionId,
      reason
    });

    req.flash('success_msg', 'Pengajuan switch region berhasil dikirim.');
    return res.redirect('/region-switch/my');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', error.message || 'Gagal mengirim pengajuan switch region.');
    return res.redirect('/region-switch/create');
  }
}

async function listPendingApprovals(req, res) {
  try {
    const requests = await regionSwitchModel.getPendingRequests();

    return res.render('koordinator/region-switch/index', {
      title: 'Approval Switch Region',
      requests
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memuat daftar approval switch region.');
    return res.redirect('/dashboard/koordinator');
  }
}

async function approveRequest(req, res) {
  try {
    const requestId = Number(req.params.id);

    if (!requestId) {
      req.flash('error_msg', 'Pengajuan tidak ditemukan.');
      return res.redirect('/region-switch/pending');
    }

    const request = await regionSwitchModel.getRequestById(requestId);

    if (!request) {
      req.flash('error_msg', 'Pengajuan tidak ditemukan.');
      return res.redirect('/region-switch/pending');
    }

    if (request.status !== 'pending') {
      req.flash('error_msg', 'Pengajuan sudah diproses dan tidak bisa di-approve ulang.');
      return res.redirect('/region-switch/pending');
    }

    await regionSwitchModel.approveRequest(requestId, req.session.user.id);
    req.flash('success_msg', 'Pengajuan switch region berhasil di-approve.');
    return res.redirect('/region-switch/pending');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', error.message || 'Gagal menyetujui pengajuan switch region.');
    return res.redirect('/region-switch/pending');
  }
}

async function rejectRequest(req, res) {
  try {
    const requestId = Number(req.params.id);
    const rejectionReason = typeof req.body.rejection_reason === 'string' ? req.body.rejection_reason.trim() : '';

    if (!requestId) {
      req.flash('error_msg', 'Pengajuan tidak ditemukan.');
      return res.redirect('/region-switch/pending');
    }

    if (!rejectionReason) {
      req.flash('error_msg', 'Alasan penolakan wajib diisi.');
      return res.redirect('/region-switch/pending');
    }

    const request = await regionSwitchModel.getRequestById(requestId);

    if (!request) {
      req.flash('error_msg', 'Pengajuan tidak ditemukan.');
      return res.redirect('/region-switch/pending');
    }

    if (request.status !== 'pending') {
      req.flash('error_msg', 'Pengajuan sudah diproses dan tidak bisa di-reject ulang.');
      return res.redirect('/region-switch/pending');
    }

    await regionSwitchModel.rejectRequest(requestId, req.session.user.id, rejectionReason);
    req.flash('success_msg', 'Pengajuan switch region berhasil ditolak.');
    return res.redirect('/region-switch/pending');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', error.message || 'Gagal menolak pengajuan switch region.');
    return res.redirect('/region-switch/pending');
  }
}

module.exports = {
  listMyRequests,
  showCreateRequestForm,
  submitRequest,
  listPendingApprovals,
  approveRequest,
  rejectRequest
};
