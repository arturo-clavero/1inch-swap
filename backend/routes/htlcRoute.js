const express = require('express');
const { pendingSwaps } = require('../controllers/relayerListeners'); 
const { Contract, ethers } = require('ethers');
const router  = express.Router();

router.get('/', (req, res) =>{
    res.send('this is bacjend');
});
router.get('/ready/:hashlock', (req, res) =>{
    const hashlock = req.params.hashlock;
    console.log("the hashlock is ", req.params.hashlock)
    const pending = pendingSwaps.get(hashlock);
    if(pending && pending.ethSwapId && pending.scrollSwapId) {
        return res.json({ready: true});
    }
    else {
        return res.json({ready: false});
    }
});
router.get('/swap/:hashlock', (req, res) =>{
    const hashlock = req.params.hashlock;
    console.log("the hashlock is ", req.params.hashlock)
    console.log("swapinside:", pendingSwaps);
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