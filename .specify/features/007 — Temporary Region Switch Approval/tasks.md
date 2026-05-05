# Tasks — Temporary Region Switch Approval

## Feature ID
F007

## Database
- [ ] Create table `region_switch_requests`
- [ ] Add foreign keys to users and regions
- [ ] Verify enum/status structure

## Model
- [ ] Create `models/regionSwitchModel.js`
- [ ] Implement `createRequest()`
- [ ] Implement `getRequestsByRequester()`
- [ ] Implement `getPendingRequests()`
- [ ] Implement `approveRequest()`
- [ ] Implement `rejectRequest()`
- [ ] Implement `getActiveExtraRegionsByUserId()`
- [ ] Implement `expireOldRequests()`

## Controller
- [ ] Create `controllers/regionSwitchController.js`
- [ ] Implement executor request list
- [ ] Implement executor create request form
- [ ] Implement executor submit request
- [ ] Implement coordinator approval list
- [ ] Implement approve handler
- [ ] Implement reject handler

## Routes
- [ ] Create `routes/regionSwitchRoutes.js`
- [ ] Add executor routes
- [ ] Add coordinator routes
- [ ] Protect routes with auth and role middleware

## Views
- [ ] Create executor request list page
- [ ] Create executor create request form
- [ ] Create coordinator pending approval page
- [ ] Add approve/reject action buttons
- [ ] Add navigation links for new menus

## Task Pool Logic
- [ ] Review executor task visibility logic in `reportModel.js`
- [ ] Include active extra regions in region filter
- [ ] Ensure region utama tetap selalu included
- [ ] Ensure expired approvals no longer affect task pool

## Validation
- [ ] Prevent same-region request
- [ ] Prevent duplicate active request for same target region
- [ ] Require reason
- [ ] Require request status pending before approval/rejection

## Manual Testing
- [ ] Test executor creates request
- [ ] Test coordinator sees pending request
- [ ] Test approve request
- [ ] Test reject request
- [ ] Test task pool after approval
- [ ] Test task pool after expiry
- [ ] Test duplicate request blocked

## Documentation
- [ ] Save screenshot executor request form
- [ ] Save screenshot coordinator approval page
- [ ] Save screenshot task pool showing two regions
- [ ] Note changed files for BAB IV