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
const { startResolvers } = require('./1inchExtension/resolvers/resolversManager');
app.use('/api', htlsRoutes);

const port = process.env.PORT;

const totalresolvers = 1;

app.listen(port, () => {
    console.log(`Node.js HTTP server is running on port ${port}`);
    console.log(`http://localhost:${port}`);

	// start resolvers
	const { startResolvers } = require('./1inchExtension/resolvers/resolversManager');
	startResolvers(totalresolvers)
	.then(() => console.log('resolvers started and waiting for orders'))
	.catch(console.error);

});