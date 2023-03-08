import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const express = require('express');

// Define custom router
const router = express.Router();

router.route('/status').get(AppController.getStatus);
router.route('/stats').get(AppController.getStats);

// users routes
router.route('/users').post(UsersController.postNew);
router.route('/users/me').get(UsersController.getMe);

// Auth
router.route('/connect').get(AuthController.getConnect);
router.route('/disconnect').get(AuthController.getDisconnect);

// Files
router.route('/files').post(FilesController.postUpload);

export default router;
