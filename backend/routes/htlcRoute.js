const express = require('express');
const { generateSecret } = require('../controllers/generate');
const { fetchQuote } = require('../1inchExtension/utils/fetchQuote');

const router  = express.Router();

router.get('/', (req, res) =>{
    res.send('this is bacjend');
});

// router.post('/1inchQuote', (req, res) =>{
//     const {quote} = fetchQuote();
//     res.json( {quote});//fly to frontend
// });
router.post('/generate', (req, res) =>{
    const {hash} = generateSecret();
    res.json( {hash});//fly to frontend
});
router.post('/lock', (req, res) =>{
    res.send('Lock the token here')
    //use the secret and private wallet to lock tokens in the htlc
});
router.post('/withdraw', (req, res) =>{
    res.send('Called when its time to redeem')
});
router.post('/refund', (req, res) =>{
    res.send('timelock expired')
});

module.exports = router;

router.post('/1inchQuote', async (req, res) => {
	const { srcChain, dstChain, srcTokenAddress, dstTokenAddress, amount } = req.body;

	console.log('Received from frontend:', req.body);

	// Example: make 1inch API call here if needed
	const quote = await fetchQuote(srcChain, dstChain, srcTokenAddress, dstTokenAddress, amount);

	res.json({quote})
});
