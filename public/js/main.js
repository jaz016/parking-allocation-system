const parkingLotForm = document.getElementById("parking-lot-form");
const parkForm = document.getElementById("park-form");

parkingLotForm.addEventListener('submit', async e => {
	e.preventDefault();


	if(confirm('Are you sure you want to submit these settings? Doing so will reset all parking data (parked cars data)')) {


		const formData = new FormData(parkingLotForm); 
		const entryPoints = formData.get('entryPoints'); 
		const parkingSlots = formData.get('parkingSlots');
		
		// submit
		try {
			const payload = {
				entryPoints: parseInt(entryPoints),
				parkingSlots: parkingSlots.split('\n').map(p => p.split(',').map(c => parseInt(c)))
			}
			console.log(JSON.stringify(payload));
			const response = await fetch('http://localhost:3000/save-parking-lot', {
				method: 'POST',
				headers: {
					'Content-Type' : 'application/json'
				},
				body: JSON.stringify(payload)
			});

			await response.json();
			parkingLotForm.reset();
			alert('Parking Lot Data saved!')

		} catch (error) {
			console.log(error.message)
			alert('Something went wrong during the action. Please try again.')
		}
	}
});



parkForm.addEventListener('submit', async e => {
	e.preventDefault();

	const formData = new FormData(parkForm); 
	const type = formData.get('type'); 
	
	// submit
	try {
		const payload = {
			type
		}
		console.log(JSON.stringify(payload));
		const response = await fetch('http://localhost:3000/park', {
			method: 'POST',
			headers: {
				'Content-Type' : 'application/json'
			},
			body: JSON.stringify(payload)
		});

		const data = await response.json();
		if(response.status === 201) {
			alert(`You've parked a car. You have been assigned slot: ${JSON.stringify(data.data.slotData)}`);
		} else {
			alert(data.message)
		}
		
	} catch (error) {
		console.log(error.message)
		alert('Something went wrong during the action. Please try again.')
	}
	
});