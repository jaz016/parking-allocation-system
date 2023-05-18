const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const jsonPath = path.join(__dirname, 'data.json');
const data = fs.readFileSync(jsonPath);
const jsonData = JSON.parse(data);


// todo: put it this a controller
router.post('/save-parking-lot', (req, res, next) => {

	const { entryPoints, parkingSlots } = req.body;

	// console.log('entryPoints',entryPoints);
	// console.log('parkingSlots',parkingSlots);

	// todo: put this in a class
	jsonData.parkingLot = {
		entryPoints,
		parkingSlots: parkingSlots.map((slot,i) => {
			return {slotId: i+1, slotData: slot}
		}),
	}

	// clear parked cars
	jsonData.parkData = [];

	fs.writeFile(jsonPath, JSON.stringify(jsonData), (err) => {
		if(err) {
			console.log('error: ', err.message); // todo
			return res.status(500).json({
				data: [],
				message: 'Something went wrong'
			})
		}

		fs.readFile(jsonPath, 'utf-8', (err, data) => {
			if(err) {
				console.log('error: ', err.message); // todo
				return res.status(500).json({
					data: [],
					message: 'Something went wrong'
				})
			}

			return res.status(200).json({
				data: JSON.parse(data).parkingLot,
				message: 'Data saved successfully'
			})
		})
	})

	// return res.status(200).json({
	// 	data: 'test',
	// 	message: 'success'
	// })

});

module.exports = router;