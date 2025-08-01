const express = require('express');
const { pendingSwaps } = require('../controllers/relayerListeners'); 
const { Contract, ethers } = require('ethers');
const router  = express.Router();

router.get('/', (req, res) =>{
    res.send('this is bacjend');
});
router.get('/swap/:hashlock', (req, res) =>{
    const hashlock = req.params.hashlock;

    const swapData = pendingSwaps.get(hashlock);
    if(!swapData) {
        return res.status(404).json({error: "swap was not found"});
    }
    return res.json({
        swapId: swapData.ethSwapId || swapData.scrollSwapId
    })
})
router.post('/refund', (req, res) =>{
    res.send('timelock expired')
});

module.exports = router;