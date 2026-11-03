const test = require('node:test');
const assert = require('node:assert/strict');
const userController = require('../../controllers/userController');
const userModel = require('../../models/userModel');

test('Unit Test: controllers/userController.js (Search & Pagination)', async (t) => {
  await t.test('1. listUsers() memanggil countUsers & getAllUsers dengan filter search dan limit 10', async () => {
    const origCount = userModel.countUsers;
    const origGetAll = userModel.getAllUsers;
    const origGetRoles = userModel.getAllRoles;

    let capturedFilters = null;
    let renderedView = null;
    let renderedData = null;

    userModel.countUsers = async (filters) => {
      capturedFilters = filters;
      return 15;
    };

    userModel.getAllUsers = async (filters) => {
      assert.equal(filters.limit, 10);
      assert.equal(filters.offset, 0);
      assert.equal(filters.search, 'farhan');
      return [
        { id: 1, full_name: 'Farhan Muhammad', username: 'farhan', role_name: 'eksekutor' }
      ];
    };

    userModel.getAllRoles = async () => [
      { id: 1, name: 'eksekutor' },
      { id: 2, name: 'koordinator' }
    ];

    const req = {
      query: { search: 'farhan', page: '1' }
    };
    const res = {
      render: (view, data) => {
        renderedView = view;
        renderedData = data;
      }
    };

    try {
      await userController.listUsers(req, res);

      assert.equal(renderedView, 'users/index');
      assert.equal(capturedFilters.search, 'farhan');
      assert.equal(renderedData.users.length, 1);
      assert.equal(renderedData.pagination.totalItems, 15);
      assert.equal(renderedData.pagination.page, 1);
      assert.equal(renderedData.pagination.totalPages, 2);
      assert.equal(renderedData.pagination.hasNext, true);
    } finally {
      userModel.countUsers = origCount;
      userModel.getAllUsers = origGetAll;
      userModel.getAllRoles = origGetRoles;
    }
  });

  await t.test('2. listUsers() halaman ke-2 menghitung offset dengan benar (offset = 10)', async () => {
    const origCount = userModel.countUsers;
    const origGetAll = userModel.getAllUsers;
    const origGetRoles = userModel.getAllRoles;

    userModel.countUsers = async () => 11;
    userModel.getAllUsers = async (filters) => {
      assert.equal(filters.limit, 10);
      assert.equal(filters.offset, 10);
      return [
        { id: 11, full_name: 'Akram Makruf', username: 'akram', role_name: 'eksekutor' }
      ];
    };
    userModel.getAllRoles = async () => [];

    let renderedData = null;
    const req = {
      query: { page: '2' }
    };
    const res = {
      render: (view, data) => {
        renderedData = data;
      }
    };

    try {
      await userController.listUsers(req, res);

      assert.equal(renderedData.pagination.page, 2);
      assert.equal(renderedData.pagination.offset, 10);
      assert.equal(renderedData.pagination.from, 11);
      assert.equal(renderedData.pagination.to, 11);
      assert.equal(renderedData.pagination.hasPrevious, true);
      assert.equal(renderedData.pagination.hasNext, false);
    } finally {
      userModel.countUsers = origCount;
      userModel.getAllUsers = origGetAll;
      userModel.getAllRoles = origGetRoles;
    }
  });
});
