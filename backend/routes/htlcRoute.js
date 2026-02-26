const express = require('express');
const { pendingSwapsByHashlock } = require('../controllers/relayerListeners');
const htlcRouter = express.Router();

htlcRouter.get('/', (req, res) => {
    res.send('this is bacjend');
});
htlcRouter.get('/ready/:hashlock', (req, res) => {
    const hashlock = req.params.hashlock;
    console.log("the hashlock is ", req.params.hashlock)
    const pendingSwap = pendingSwapsByHashlock.get(hashlock);
    if (pendingSwap && pendingSwap.ethSwapId && pendingSwap.scrollSwapId) {
        return res.json({ ready: true });
    }
    else {
        return res.json({ ready: false });
    }
});
htlcRouter.get('/swap/:hashlock', (req, res) => {
    const hashlock = req.params.hashlock;
    console.log("the hashlock is ", req.params.hashlock)
    console.log("swapinside:", pendingSwapsByHashlock);
    const swapRecord = pendingSwapsByHashlock.get(hashlock);
    if (!swapRecord) {
        return res.status(404).json({ error: "swap was not found" });
    }
    return res.json({
        swapId: swapRecord.ethSwapId || swapRecord.scrollSwapId
    })
})
htlcRouter.post('/refund', (req, res) => {
    res.send('timelock expired')
});

module.exports = htlcRouter;