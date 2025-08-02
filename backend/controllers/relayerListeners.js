const { ethHTLC, scrollHTLC, ethWallet, scrollWallet} = require('./relayer');
const { Contract, ethers, keccak256 } = require('ethers');

const RELAYER_ADDRESS = ethWallet.address;
const pendingSwaps = new Map();
const hashlockHandled = new Set();
//relayers locking

const startEventListeners = () => {
        console.log("Relayer is listening...");

//user locks on eth -> relayer locks on scroll
    ethHTLC.on("SwapCreated", async (swapId, sender, receiver, amount, hashlock, timelock) => {  
        console.log("SwapCreated on ETH:", swapId);
            //relaier is receiver
            if (hashlockHandled.has(hashlock)){
                console.log("already existing swap");
                return;
            }
            console.log(`User ${sender} locked ${ethers.formatEther(amount)} ETH. Lockin on tje scroll...`);
            hashlockHandled.add(hashlock);
            try{
                const scrollTime = timelock > 360n ? timelock - 300n : 60n;
                const txn = await scrollHTLC.createSwap(
                        sender,
                        hashlock,
                        scrollTime,
                        {value: amount}
                );
                const proof = await txn.wait();
                const scrollSwapId = proof.logs.find(log => log.fragment?.name === "SwapCreated")?.args?.swapId;
                console.log(`[SCROLL] relayer locked ${ethers.formatEther(amount)} ETH for ${sender}`);
                console.log(`Txn: ${proof.hash}`);
                //to map to track
                pendingSwaps.set(hashlock.toString(), {
                        path: "eth->scroll",
                        userAddress: sender,
                        receiver: receiver,
                        amount: amount.toString(),
                        ethSwapId: swapId,
                        scrollSwapId: scrollSwapId,
                        
                })
            } catch(err){
                console.error("Failed to lock on scroll",err.message );
            }
        });
//scroll-> eth
        scrollHTLC.on("SwapCreated", async (swapId, sender, receiver, amount, hashlock, timelock) => {
            console.log("SwapCreated on SCROLL:", swapId);
             if (hashlockHandled.has(hashlock)){
                console.log("already existing swap");
                return;
            }
            console.log(`User ${sender} locked ${ethers.formatEther(amount)} ETH on the scroll. Lockin on the ethereum...`);
            hashlockHandled.add(hashlock);
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
                const ethSwapId = proof.logs.find(log => log.fragment?.name === "SwapCreated")?.args?.swapId;

                console.log(`[ETH] relayer locked ${ethers.formatEther(amount)} SCROLL for ${sender}`);
                console.log(`Txn: ${proof.hash}`);
                //to map to track
                pendingSwaps.set(hashlock.toString(), {
                        path: "scroll->eth",
                        userAddress: sender,
                        receiver: receiver,
                        amount: amount.toString(),
                        scrollSwapId: swapId,
                        ethSwapId: ethSwapId
                })
            } catch(err){
                console.error("Failed to lock on ethereum",err.message );
            }
        });


        scrollHTLC.on("SwapWithdrawn", async (swapId, secret) => {
            console.log("[SCROLL]SwapWithdrawn:", swapId);
            //relaier is receiver
            const hashlock = ethers.keccak256(secret);
            const pending = pendingSwaps.get(hashlock.toString());

            if (!pending){
                console.log("No pending swaps");
                return;
            }
            try{
                if (pending.receiver.toLowerCase() === RELAYER_ADDRESS.toLowerCase()){
                    const txn = await ethHTLC.withdraw(pending.ethSwapId, secret);
                    await txn.wait();
                    console.log ("[ETH] side withdrawn with the secret:", secret);
                    pendingSwaps.delete(swapId.toString());
                }
                else ("not relayers job, skipping");
            } catch(err){
                console.error("[ETH] Withdraw faild",err.message );
            }
        });


        ethHTLC.on("SwapWithdrawn", async (swapId, secret) => {
            console.log("[ETH]SwapWithdrawn:", swapId);
            //relaier is receiver
            const hashlock = ethers.keccak256(secret);
            const pending = pendingSwaps.get(hashlock.toString());
            if (!pending){
                console.log("No pending swaps");
                return;
            }
            try{
                if (pending.receiver.toLowerCase() === RELAYER_ADDRESS.toLowerCase()){
                    const txn = await scrollHTLC.withdraw(pending.scrollSwapId, secret);
                    await txn.wait();
                    console.log(`[SCROLL] Withdrawing and the secret  was ${secret}`);
                    pendingSwaps.delete(swapId.toString());
                } else {
                    console.log("not relayers case. Skipping");
                }
            } catch(err){
                console.error("[SCROLL] Withdraw faild",err.message );
            }
        });
}
module.exports = { startEventListeners, pendingSwaps};