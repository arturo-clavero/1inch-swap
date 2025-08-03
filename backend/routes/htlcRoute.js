const express = require('express');
const { generateSecret } = require('../controllers/generate');
const { fetchQuote } = require('../1inchExtension/utils/fetchQuote');
const { storeTempOrder } = require('../1inchExtension/order');
const announcement = require('../1inchExtension/phases/2_announcement');

const router  = express.Router();

router.get('/', (req, res) =>{
    res.send('this is bacjend');
});

router.post('/1inchQuote', async (req, res) => {
	const {srcTokenAddress, dstTokenAddress, amount } = req.body;
	const quote = await fetchQuote(srcTokenAddress, dstTokenAddress, amount);
	res.json({quote})
});

router.post('/storeTempOrder', async (req) => {
	console.log("reached backend!")
	const order = req.body;
	//console.log("order: ", order);
	await storeTempOrder(order);
});

router.post('/broadcastVerifiedOrder', async (req, res) => {
	console.log("reached backend!");
	console.log("order id:", req.body.id);
	await announcement(req.body.id);
	res.sendStatus(200);
  });
  

// router.post('/generate', (req, res) =>{
//     const {hash} = generateSecret();
//     res.json( {hash});//fly to frontend
// });
// router.post('/lock', (req, res) =>{
//     res.send('Lock the token here')
//     //use the secret and private wallet to lock tokens in the htlc
// });
// router.post('/withdraw', (req, res) =>{
//     res.send('Called when its time to redeem')
// });
// router.post('/refund', (req, res) =>{
//     res.send('timelock expired')
// });



module.exports = router;
