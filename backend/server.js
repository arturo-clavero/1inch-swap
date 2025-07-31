const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');

const app  = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('<h1>Server is still running!</h1>');
});

const htlsRoutes = require('./routes/htlcRoute');
const { startRelayers } = require('./1inchExtension/relayers/relayersManager');
app.use('/api', htlsRoutes);

const port = process.env.PORT;

const totalresolvers = 1;

app.listen(port, () => {
    console.log(`Node.js HTTP server is running on port ${port}`);
    console.log(`http://localhost:${port}`);

	// start resolvers
	const { startRelayers } = require('./1inchExtension/relayers/relayersManager');
	startRelayers(totalresolvers)
	.then(() => console.log('relayers started and waiting for orders'))
	.catch(console.error);

    // Start listening for orders
    require('./1inchExtension/phases/2_announcement')();

});