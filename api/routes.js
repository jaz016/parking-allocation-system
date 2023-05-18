const express = require('express');
const router = express.Router();

router.get('/test', (req, res, next) => {
	return res.status(200).json({
		data: 'test',
		message: 'endpoint reached successfully'
	})
});

module.exports = router;