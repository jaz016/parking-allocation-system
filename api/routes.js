const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const { parseISO, differenceInMinutes } = require('date-fns');
const { utcToZonedTime, format } = require('date-fns-tz')

const jsonPath = path.join(__dirname, 'data.json');
const data = fs.readFileSync(jsonPath);
const jsonData = JSON.parse(data);


// todo: put it this a controller
router.get('/get-parking-lot', (req, res, next) => {
	const { parkingLot } = jsonData;
	return res.status(200).json(parkingLot);
})

// todo: put it this a controller
router.get('/get-parking-data', (req, res, next) => {
	const { parkData, cars } = jsonData;
	const filteredParkData = parkData.length ? parkData.map(pd => {
		const carData = cars.find(c => c.carId === pd.carId);
		return {...pd, type: carData.type}
	}).filter(pd => pd.isParked) : [];
	return res.status(200).json(filteredParkData);
})

// todo: put it this a controller
// add validation for parkingSlots input
router.post('/save-parking-lot', (req, res, next) => {

	const { entryPoints, parkingSlots } = req.body;

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
	const nextId = jsonData.cars.length > 0 ? Math.max(...jsonData.cars.map(car => car.carId)) + 1 : 1;
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

		// filter only slots that are available for the car type
		const filteredParkingSlotsBySize = parkingSlots.filter(slot => allowedParkingSize.includes(slot.slotData[entryPoints]));

		if(filteredParkingSlotsBySize.length) {

			const filteredParkingSlots = filteredParkingSlotsBySize.filter(slot => parkData.findIndex(pd => pd.slotId === slot.slotId && pd.isParked) === -1 );

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


				const nextParkDataId = parkData.length > 0 ? Math.max(...parkData.map(pd => pd.parkDataId)) + 1 : 1;
				// insert into parkData
				const newParkData = {
					parkDataId: nextParkDataId,
					slotId: assignedSlot.slotId,
					carId: newCar.carId,
					start: format(utcToZonedTime(new Date(), 'Asia/Manila'), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
					isParked: true
				}

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

					return res.status(201).json({
						data: {...newParkData, slotData: assignedSlot.slotData},
						message: 'Data saved successfully'
					})
				})
				
			} else {
				return res.status(404).json({
					data: [],
					message: 'There are no parking slots available.'
				});
			}

		} else {
			return res.status(404).json({
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


// todo: put it this a controller
router.delete('/unpark/:carId', (req, res, next) => {
	const { carId } = req.params;
	const { parkData, cars } = jsonData;
	const { entryPoints, parkingSlots } = jsonData.parkingLot;

	// todo: add validation for carId if isNaN


	const parkDataIdx = parkData.findIndex(pd => pd.carId == carId && pd.isParked);
	const carIdx = cars.findIndex(c => c.carId == carId);

	if(parkDataIdx !== -1 && carIdx !== -1) {

		const now = parseISO(format(utcToZonedTime(new Date(), 'Asia/Manila'), "yyyy-MM-dd'T'HH:mm:ss'Z'"));
		let fetchedParkData = parkData[parkDataIdx];
		let fetchCarData = cars[carIdx];
		const slot = parkingSlots.find(ps => fetchedParkData.slotId == ps.slotId);
		const slotSize = slot.slotData[entryPoints];
		const hrsElapsed = (differenceInMinutes(now, parseISO(fetchedParkData.start)) / 60).toFixed(2);
		const cost = calculateCost(hrsElapsed, slotSize);

		fetchedParkData.isParked = fetchCarData.isParked = false;

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
				data: {
					cost,
					parkHours: parseFloat(hrsElapsed),
					parkData: fetchedParkData
				},
				message: 'Successfully unparked'
			})

		})

		// return res.status(200).json({
		// 	data: [],
		// 	message: 'test'
		// });
	
	} else {
		return res.status(404).json({
			data: [],
			message: 'Did not find any active parking data related to car ID: ' + carId
		});
	}

	function calculateCost(hours, slotSize) {
		// const hoursRounded = Math.ceil(hours);
		const hoursRounded = parseFloat(hours).toFixed(0);
		const initialCost = 40;
		const chunkCost = hoursRounded >= 24 ? 5000 * (Math.floor(hoursRounded/24)) : 0;

		if(hoursRounded <= 3)
			return initialCost;
		else {
			switch(slotSize) {
				case 0: return !chunkCost ? initialCost + (20 * (hoursRounded-3)) : chunkCost + (hoursRounded-24 <= 3 ? initialCost : 20 * (parseFloat(hoursRounded - 24).toFixed(0)));
				case 1: return !chunkCost ? initialCost + (60 * (hoursRounded-3)) : chunkCost + (hoursRounded-24 <= 3 ? initialCost : 60 * (parseFloat(hoursRounded - 24).toFixed(0)));
				case 2: return !chunkCost ? initialCost + (100 * (hoursRounded-3)) : chunkCost + (hoursRounded-24 <= 3 ? initialCost : 100 * (parseFloat(hoursRounded - 24).toFixed(0)));
				default: return 0;
			}
		}
	}
});

module.exports = router;