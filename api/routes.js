const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const { formatISO } = require('date-fns');
const { utcToZonedTime, format } = require('date-fns-tz')

const jsonPath = path.join(__dirname, 'data.json');
const data = fs.readFileSync(jsonPath);
const jsonData = JSON.parse(data);


// todo: put it this a controller
// add validation for parkingSlots input
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
	let { type } = req.body;
	type = type.toLowerCase();


	// routine 0: insert into cars data
	console.log('jsonData.cars',jsonData.cars);
	const nextId = jsonData.cars.length > 0 ? Math.max(...jsonData.cars.map(car => car.carId)) + 1 : 1;
	console.log('nextId', nextId);

	const newCar = {
		carId: nextId,
		type: type,
		isParked: true
	}

	jsonData.cars.push(newCar); // todo: put this in a class (instantiate a car object), add models
	// end: routine 0


	// routine 1: filter and assign a parking slot upon park
	const { entryPoints, parkingSlots } = jsonData.parkingLot
			,parkData = jsonData.parkData;

	if(parkingSlots.length) {

		const allowedParkingSize = getAllowedParkingSize(type);
		console.log('allowedParkingSize',allowedParkingSize);
		console.log('parkingSlots',parkingSlots);

		// filter only slots that are available for the car type
		const filteredParkingSlotsBySize = parkingSlots.filter(slot => allowedParkingSize.includes(slot.slotData[entryPoints]));
		console.log('filteredParkingSlotsBySize',filteredParkingSlotsBySize);

		if(filteredParkingSlotsBySize.length) {
			console.log('parkData', parkData);

			const filteredParkingSlots = filteredParkingSlotsBySize.filter(slot => parkData.findIndex(pd => pd.slotId === slot.slotId) === -1 );
			console.log('filteredParkingSlots',filteredParkingSlots);

			if(filteredParkingSlots.length) {

				// sorted parking slots by nearest first
				const assignedSlot = filteredParkingSlots.sort((x,y) => {
					const xDistance = x.slotData.slice(0,entryPoints).reduce((a,c) => a + c, 0)
						 ,yDistance = y.slotData.slice(0,entryPoints).reduce((a,c) => a + c, 0);

					if(xDistance > yDistance)
						return 1;
					else if(xDistance < yDistance)
						return -1
					else
						return 0;
				})[0];


				console.log('assignedSlot', assignedSlot);
				

				// insert into parkData
				const newParkData = {
					slotId: assignedSlot.slotId,
					carId: newCar.carId,
					start: formatISO(utcToZonedTime(new Date(), 'Asia/Manila'))
				}

				console.log('newParkData',newParkData);
				parkData.push(newParkData); // todo: put this in a class (instantiate a car object), add models


				// todo: create util function for this
				fs.writeFile(jsonPath, JSON.stringify(jsonData), (err) => {
					if(err) {
						console.log('error: ', err.message); // todo, detail error msg
						return res.status(500).json({
							data: [],
							message: 'Something went wrong'
						})
					}


					return res.status(200).json({
						data: {...newParkData, slotData: assignedSlot.slotData},
						message: 'Data saved successfully'
					})

				})
				
			} else {
				return res.status(500).json({
					data: [],
					message: 'There are no parking slots available.'
				});
			}

		} else {
			return res.status(500).json({
				data: [],
				message: 'There are no parking slots available.'
			});
		}

	} else {
		return res.status(500).json({
			data: [],
			message: 'There are no parking slots data. Setup one first via /save-parking-lot API.'
		});
	}
	// end: routine 1

	function getAllowedParkingSize(carType) {
		switch(carType) {
			case 's': return [0,1,2]; 
			case 'm': return [1,2]; 
			case 'l': return [2];
		}
	}

})


module.exports = router;