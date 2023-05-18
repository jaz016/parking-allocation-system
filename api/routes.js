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

	// todo: put this in a class, add models
	jsonData.parkingLot = {
		entryPoints,
		parkingSlots: parkingSlots.map((slot,i) => {
			return {slotId: i+1, slotData: slot}
		}),
	}

	// clear parked cars
	jsonData.parkData = [];

	// todo: create util function for this
	fs.writeFile(jsonPath, JSON.stringify(jsonData), (err) => {
		if(err) {
			console.log('error: ', err.message); // todo, detail error msg
			return res.status(500).json({
				data: [],
				message: 'Something went wrong'
			})
		}

		fs.readFile(jsonPath, 'utf-8', (err, data) => {
			if(err) {
				console.log('error: ', err.message); // todo, detail error msg
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


// todo: put it this a controller
router.post('/park', (req, res, next) => {
	const { carType } = req.body;

	console.log('jsonData.cars',jsonData.cars);
	const nextId = jsonData.cars.length > 0 ? Math.max(...jsonData.cars.map(car => car.carId)) + 1 : 1;
	console.log('nextId', nextId);

	const newCar = {
		carId: nextId,
		type: carType,
		isParked: true
	}

	jsonData.cars.push(newCar); // todo: put this in a class (instantiate a car object), add models

	// todo: create util function for this
	fs.writeFile(jsonPath, JSON.stringify(jsonData), (err) => {
		if(err) {
			console.log('error: ', err.message); // todo, detail error msg
			return res.status(500).json({
				data: [],
				message: 'Something went wrong'
			})
		}

		fs.readFile(jsonPath, 'utf-8', (err, data) => {
			if(err) {
				console.log('error: ', err.message); // todo, detail error msg
				return res.status(500).json({
					data: [],
					message: 'Something went wrong'
				})
			}

			return res.status(200).json({
				data: newCar,
				message: 'Data saved successfully'
			})
		})
	})
})


module.exports = router;