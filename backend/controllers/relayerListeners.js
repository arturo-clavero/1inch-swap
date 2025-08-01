const { ethHTLC, scrollHTLC, ethWallet, scrollWallet} = require('./relayer');
const { Contract, ethers } = require('ethers');

const RELAYER_ADDRESS = ethWallet.address;
const pendingSwaps = new Map();
//relayers locking

const startEventListeners = () => {
        console.log("Relayer is listening...");

//user locks on eth -> relayer locks on scroll
    ethHTLC.on("SwapCreated", async (swapId, sender, receiver, amount, hashlock, timelock) => {  
        console.log("SwapCreated on ETH:", swapId);
            //relaier is receiver
            if (receiver.toLowerCase() != RELAYER_ADDRESS.toLowerCase()){
                console.log("Not for relayer");
                return;
            }
            console.log(`User ${sender} locked ${ethers.formatEther(amount)} ETH. Lockin on tje scroll...`);
            try{
                const scrollTime = timelock > 360n ? timelock - 300n : 60n;
                const txn = await scrollHTLC.createSwap(
                        sender,
                        hashlock,
                        scrollTime,
                        {value: amount}
                );
                const proof = await txn.wait();
                console.log(`[SCROLL] relayer locked ${ethers.formatEther(amount)} ETH for ${sender}`);
                console.log(`Txn: ${proof.hash}`);
                
                //to map to track
                pendingSwaps.set(hashlock.toString(), {
                        path: "eth->scroll",
                        userAddress: sender,
                        amount: amount.toString(),
                        ethSwapId: swapId,
                        scrollTime: timelock
                })
            } catch(err){
                console.error("Failed to lock on scroll",err.message );
            }
        });
//scroll-> eth
        scrollHTLC.on("SwapCreated", async (swapId, sender, receiver, amount, hashlock, timelock) => {
            console.log("SwapCreated on SCROLL:", swapId);
            //relaier is receiver
            if (receiver.toLowerCase() != RELAYER_ADDRESS.toLowerCase()){
                console.log("Not for relayer");
                return;
            }
            console.log(`User ${sender} locked ${ethers.formatEther(amount)} ETH on the scroll. Lockin on the ethereum...`);
            try{
                //MIXING avoid
                const ethTime = timelock > 360n ? timelock - 300n : 60n;
                const txn = await ethHTLC.createSwap(
                        sender,
                        hashlock,
                        ethTime,
                        {value: amount}
                );
                const proof = await txn.wait();
                console.log(`[ETH] relayer locked ${ethers.formatEther(amount)} SCROLL for ${sender}`);
                console.log(`Txn: ${proof.hash}`);
                
                //to map to track
                pendingSwaps.set(hashlock.toString(), {
                        path: "scroll->eth",
                        userAddress: sender,
                        amount: amount.toString(),
                        scrollSwapId: swapId,
                        ethTime: timelock
                })
            } catch(err){
                console.error("Failed to lock on ethereum",err.message );
            }
        });


        scrollHTLC.on("SwapWithdrawn", async (swapId, secret) => {
            console.log("[SCROLL]SwapWithdrawn:", swapId);
            //relaier is receiver
            const pending = pendingSwaps.get(swapId.toString());
            if (!pending){
                console.log("No pending swaps");
                return;
            }
            try{
                console.log(`[ETH] Withdrawing and the secret word was ${secret}`);
                const txn = await ethHTLC.withdraw(pending.ethSwapId, secret);
                const proof = await txn.wait();

                console.log (`[ETH] the withdraw was successfull, txn is ${proof.hash}`);
                pendingSwaps.delete(swapId.toString());
            } catch(err){
                console.error("[ETH] Withdraw faild",err.message );
            }
        });

        ethHTLC.on("SwapWithdrawn", async (swapId, secret) => {
            console.log("[ETH]SwapWithdrawn:", swapId);
            //relaier is receiver
            const pending = pendingSwaps.get(swapId.toString());
            if (!pending){
                console.log("No pending swaps");
                return;
            }
            try{
                console.log(`[SCROLL] Withdrawing and the secret word was ${secret}`);
                const txn = await scrollHTLC.withdraw(pending.scrollSwapId, secret);
                const proof = await txn.wait();

                console.log (`[SCROLL] the withdraw was successfull, txn is ${proof.hash}`);
                pendingSwaps.delete(swapId.toString());
            } catch(err){
                console.error("Withdraw faild",err.message );
            }
        });
}
module.exports = { startEventListeners};