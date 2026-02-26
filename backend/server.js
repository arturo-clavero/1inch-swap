const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { startRelayerEventListeners } = require('./controllers/relayerListeners');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('<h1>Server is still running!</h1>');
});

const htlcRoutes = require('./routes/htlcRoute');
app.use('/api', htlcRoutes);

const port = process.env.PORT;
app.listen(port, () => {
    console.log(`Node.js HTTP server is running on port ${port}`);
    console.log(`http://localhost:3000`);
    startRelayerEventListeners();


});
//listening for the contract's events (withdrawn and refunded)