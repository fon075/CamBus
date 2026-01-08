const express = require('express');
const router = express.Router();
const routesController = require('../controllers/routes.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', routesController.getAllRoutes);
router.get('/:id', routesController.getRouteById);
router.post('/', authenticate, authorize('admin', 'operator'), routesController.createRoute);
router.put('/:id', authenticate, authorize('admin', 'operator'), routesController.updateRoute);
router.delete('/:id', authenticate, authorize('admin'), routesController.deleteRoute);

module.exports = router;