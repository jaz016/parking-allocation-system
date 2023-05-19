const parkingLotForm = document.getElementById("parking-lot-form");
const parkForm = document.getElementById("park-form");

let globalParkingSlots = [],
	globalParkData = [];

const now = moment().utc(8).toISOString();

fetchParkingLot();
fetchParkData();


async function fetchParkingLot() {
	try {
		const response = await fetch('http://localhost:3000/get-parking-lot');
		const data = await response.json();
		const { parkingSlots } = data;
		globalParkingSlots = [...parkingSlots];
		const parkingSlotsArea = document.getElementById("parking-slots-area");
		parkingSlotsArea.innerHTML = '';
		const ul = document.createElement("ul");
		ul.className = 'list-group';

		parkingSlots.forEach(ps => {
			const li = document.createElement("li");
			li.className = 'list-group-item';
			li.textContent = JSON.stringify(ps.slotData);
			ul.appendChild(li);
		});

		parkingSlotsArea.appendChild(ul);

	  } catch (error) {
			console.log(error.message)
			alert('Something went wrong during the action. Please try again.')
	  }
}


async function fetchParkData() {
	try {
		const response = await fetch('http://localhost:3000/get-parking-data');
		const data = await response.json();
		const parkData = data;
		globalParkData = [...parkData];
		
		const newParkData = globalParkData.map(pd => {
			const foundSlotData = globalParkingSlots.find(ps => pd.slotId === ps.slotId);
			return {
				...pd, slotData: foundSlotData.slotData
			}
		});

		
		const parkedCarsArea = document.getElementById("parked-cars");
		parkedCarsArea.innerHTML = '';
		const ul = document.createElement("ul");
		ul.className = 'list-group list-group-flush';

		newParkData.forEach(pd => {
			const li = document.createElement("li");
			li.className = 'list-group-item';
			const elapsed = moment.duration(moment(now).diff(moment(pd.start))).asHours().toFixed(1);
			li.textContent = `Slot ${JSON.stringify(pd.slotData)} | Car ID: ${pd.carId} | Type: ${pd.type.toUpperCase()} | Elapsed: ${elapsed} hrs | `;

			const anchor = document.createElement("a");
			anchor.className='unpark';
			anchor.setAttribute('href', '#');
			anchor.setAttribute('data-url', `http://localhost:3000/unpark/${pd.carId}`);
			anchor.textContent = 'Unpark';


			anchor.addEventListener('click', async e => {
				e.preventDefault();

				if(confirm('Are you sure you want to unpark this car? Appropriate charges will apply.')) {
					const url = e.target.dataset.url;
					const response = await fetch(url, {
						method: 'DELETE'
					});
					const { data } = await response.json();

					alert(`You have unparked the car. You have been charged a fee of Php${data.cost} for having parked ${data.parkHours} hours.`)

					fetchParkData();
				}
				
			})

			li.appendChild(anchor);
			ul.appendChild(li);
		});

		parkedCarsArea.appendChild(ul);

	  } catch (error) {
			console.log(error.message)
			alert('Something went wrong during the action. Please try again.')
	  }
}


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
			fetchParkingLot();
			fetchParkData();

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
			fetchParkData();
		} else {
			alert(data.message)
		}
		
	} catch (error) {
		console.log(error.message)
		alert('Something went wrong during the action. Please try again.')
	}
	
});