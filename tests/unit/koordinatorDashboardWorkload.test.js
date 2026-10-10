const test = require('node:test');
const assert = require('node:assert/strict');
const dashboardModel = require('../../models/dashboardModel');
const userModel = require('../../models/userModel');

test('Koordinator Dashboard Workload & Delegation Support', async (t) => {
  await t.test('1. getKoordinatorDashboard returns regionSummary, disparityAlert, and eksekutorWorkload', async () => {
    const mockUser = { id: 7, role: 'koordinator' };
    const data = await dashboardModel.getKoordinatorDashboard(mockUser, { period: 'all' });

    assert.ok(data.summary, 'Harus memuat objek summary');
    assert.ok(Array.isArray(data.regionSummary), 'regionSummary harus berupa array');
    assert.ok(Array.isArray(data.eksekutorWorkload), 'eksekutorWorkload harus berupa array');
    assert.ok(data.regionSummary.length > 0, 'regionSummary tidak boleh kosong');

    // Pastikan setiap wilayah memiliki field is_overloaded boolean
    data.regionSummary.forEach((reg) => {
      assert.strictEqual(typeof reg.is_overloaded, 'boolean', 'is_overloaded harus boolean');
      assert.ok(['PDG', 'BKT'].includes(reg.region_code), 'region_code harus PDG atau BKT');
    });

    // Periksa struktur eksekutorWorkload
    if (data.eksekutorWorkload.length > 0) {
      const eksekutor = data.eksekutorWorkload[0];
      assert.ok(eksekutor.id, 'Eksekutor harus memiliki id');
      assert.ok(eksekutor.full_name, 'Eksekutor harus memiliki full_name');
      assert.strictEqual(typeof eksekutor.active_tickets, 'number', 'active_tickets harus number');
      assert.strictEqual(typeof eksekutor.period_taken, 'number', 'period_taken harus number');
      assert.strictEqual(typeof eksekutor.period_completed, 'number', 'period_completed harus number');
      assert.ok(eksekutor.load_badge, 'Harus memiliki objek load_badge');
      assert.ok(eksekutor.load_badge.label, 'load_badge harus memiliki label');
      assert.strictEqual(typeof eksekutor.load_badge.canDelegate, 'boolean', 'canDelegate harus boolean');
    }
  });

  await t.test('2. getKoordinatorDashboard menangani filter tanggal custom dengan baik', async () => {
    const mockUser = { id: 7, role: 'koordinator' };
    const data = await dashboardModel.getKoordinatorDashboard(mockUser, {
      period: 'custom',
      startDateTime: '2026-10-01 00:00:00',
      endDateTime: '2026-10-10 23:59:59'
    });

    assert.ok(Array.isArray(data.regionSummary), 'regionSummary harus berupa array');
    assert.ok(Array.isArray(data.eksekutorWorkload), 'eksekutorWorkload harus berupa array');
  });

  await t.test('3. userModel.getEksekutorUsersByRegionCode mengembalikan active_tickets terurut ASC', async () => {
    const usersBKT = await userModel.getEksekutorUsersByRegionCode('BKT');

    assert.ok(Array.isArray(usersBKT), 'Hasil harus array');
    if (usersBKT.length > 0) {
      usersBKT.forEach((u) => {
        assert.strictEqual(typeof u.active_tickets, 'number', 'active_tickets harus number');
        assert.strictEqual(u.region_code, 'BKT');
      });

      // Verifikasi urutan beban active_tickets ASC
      for (let i = 0; i < usersBKT.length - 1; i++) {
        assert.ok(
          usersBKT[i].active_tickets <= usersBKT[i + 1].active_tickets,
          'Urutan harus terurut dari beban aktif paling sedikit'
        );
      }
    }
  });

  await t.test('4. Deteksi disparitas antrean menandai wilayah dengan beban jauh lebih tinggi', async () => {
    const mockUser = { id: 7, role: 'koordinator' };
    const data = await dashboardModel.getKoordinatorDashboard(mockUser, { period: 'all' });

    const pdg = data.regionSummary.find((r) => r.region_code === 'PDG');
    const bkt = data.regionSummary.find((r) => r.region_code === 'BKT');

    if (pdg && bkt && Math.abs(pdg.total_available - bkt.total_available) >= 3) {
      assert.ok(data.disparityAlert !== null, 'Disparitas signifikan harus memicu disparityAlert');
      assert.ok(data.disparityAlert.message.length > 0, 'Pesan disparitas harus informatif');
      const higher = pdg.total_available > bkt.total_available ? pdg : bkt;
      assert.strictEqual(higher.is_overloaded, true, 'Wilayah dengan antrean tinggi harus is_overloaded=true');
    }
  });
});
