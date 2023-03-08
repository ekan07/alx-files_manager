import AppController from '../controllers/AppController';

const express = require('express');

// Define custom router
const router = express.Router();

router.route('/status').get(AppController.getStatus);
router.route('/stats').get(AppController.getStats);

export default router;
