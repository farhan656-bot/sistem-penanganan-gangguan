# Technical Plan — Temporary Region Switch Approval

## Feature ID
F007

## Feature Name
Temporary Region Switch Approval

## Objective
Mengimplementasikan mekanisme pengajuan dan persetujuan akses region tambahan sementara bagi eksekutor, sebagai pengganti utama delegasi tiket satu per satu untuk kondisi overload.

## Existing Context
Sistem saat ini sudah memiliki:
- autentikasi dan RBAC,
- task pool tiket,
- ambil tugas,
- lifecycle tiket,
- media Telegram,
- manual report entry,
- approval operasional berbasis koordinator.

Logika lama yang ada:
- koordinator dapat mendelegasikan tiket ke eksekutor tertentu

Logika baru yang dibutuhkan:
- koordinator menyetujui akses region tambahan sementara
- task pool eksekutor mengikuti daftar region aktif user

## Technical Stack
- Node.js
- Express.js
- MySQL
- mysql2/promise
- EJS
- Bootstrap 5

## Database Impact
Feature ini membutuhkan tabel baru.

### New Table
- `region_switch_requests`

### Suggested SQL structure
Fields:
- `id`
- `requester_user_id`
- `home_region_id`
- `target_region_id`
- `reason`
- `status`
- `requested_at`
- `approved_by_user_id`
- `approved_at`
- `start_at`
- `end_at`
- `rejection_reason`
- `created_at`
- `updated_at`

## Files Likely Added or Changed

### New Models
- `models/regionSwitchModel.js`

### Changed Models
- `models/reportModel.js`
- `models/userModel.js` (optional if region helper is needed)

### New Controllers
- `controllers/regionSwitchController.js`

### Changed Controllers
- none required outside task-pool related logic, except if report listing currently lives in report controller

### New Routes
- `routes/regionSwitchRoutes.js`

### Changed Views
- `views/eksekutor/region-switch/index.ejs`
- `views/eksekutor/region-switch/create.ejs`
- `views/koordinator/region-switch/index.ejs`
- optional: update sidebar/navigation
- update task pool related views only if region context needs to be shown

## Backend Design

### Table Logic
`region_switch_requests` stores:
- who requested
- from which home region
- target region
- approval status
- validity window

### Approval Window
When approved:
- `start_at = NOW()`
- `end_at = same date 23:59:59`
- `status = approved`

On later reads:
- if `status = approved` but `NOW() > end_at`
- treat as expired
- optionally auto-update to `expired`

### `regionSwitchModel.js`
Functions suggested:
- `createRequest(data)`
- `getRequestsByRequester(userId)`
- `getPendingRequests()`
- `approveRequest(requestId, coordinatorId)`
- `rejectRequest(requestId, coordinatorId, rejectionReason)`
- `getActiveExtraRegionsByUserId(userId)`
- `expireOldRequests()`

### `reportModel.js`
Update executor ticket visibility:
- fetch user home region
- fetch active extra regions
- show tickets where `current_region_id` IN active region list
- remove dependency on delegated-ticket-only logic as primary overload mechanism

### `regionSwitchController.js`
Suggested handlers:
- `listMyRequests()`
- `showCreateRequestForm()`
- `submitRequest()`
- `listPendingApprovals()`
- `approveRequest()`
- `rejectRequest()`

## Validation Rules
1. requester must be `eksekutor`
2. approver must be `koordinator`
3. target region must be different from home region
4. duplicate active request for same target region must be rejected
5. reason is required
6. request must be `pending` before approval/rejection

## UI/UX Plan

### Eksekutor Menu
New menu:
- `Pengajuan Switch Region`

Pages:
- list my requests
- create new request

### Koordinator Menu
New menu:
- `Approval Switch Region`

Pages:
- list pending requests
- approve / reject actions

### Task Pool UX
Optional label:
- show active regions currently available to executor

## Testing Strategy
1. Eksekutor submit request
2. Koordinator approve
3. Eksekutor sees tickets from two regions
4. Koordinator reject
5. Duplicate request blocked
6. Expired request no longer grants access

## Out of Scope
1. Telegram notification for request approval
2. Permanent transfer of user region
3. Multi-day approval windows
4. More than one custom scheduling rule