const path = require('path');
const express = require('express');
const PORT = 3000;

// routes
const routes = require('./routes');
const app = express();

// parse application/json
app.use(express.json());

// register routes
app.use(routes);

// expose public folder
app.use(express.static(path.join(__dirname,'../public')));


app.listen(PORT, () => {
	console.log(`Server now listening at port ${PORT}..`);
});
