const { ethereumHtlcContract, scrollHtlcContract, ethereumWallet } = require('./relayer');
const { ethers } = require('ethers');

const relayerAddress = ethereumWallet.address;
const pendingSwapsByHashlock = new Map();
const processedHashlocks = new Set();
//relayers locking

const startRelayerEventListeners = () => {
        console.log("Relayer is listening...");

//user locks on eth -> relayer locks on scroll
    ethereumHtlcContract.on("SwapCreated", async (swapId, sender, receiver, amount, hashlock, timelock) => {
        console.log("SwapCreated on ETH:", swapId);
            //relaier is receiver
            if (processedHashlocks.has(hashlock)) {
                console.log("already existing swap");
                return;
            }
            console.log(`User ${sender} locked ${ethers.formatEther(amount)} ETH. Lockin on tje scroll...`);
            processedHashlocks.add(hashlock);
            try {
                const scrollTime = timelock > 360n ? timelock - 300n : 60n;
                const transactionResponse = await scrollHtlcContract.createSwap(
                        sender,
                        hashlock,
                        scrollTime,
                        { value: amount }
                );
                const receipt = await transactionResponse.wait();
                const scrollSwapId = receipt.logs.find(log => log.fragment?.name === "SwapCreated")?.args?.swapId;
                console.log(`[SCROLL] relayer locked ${ethers.formatEther(amount)} ETH for ${sender}`);
                console.log(`Txn: ${receipt.hash}`);
                //to map to track
                pendingSwapsByHashlock.set(hashlock.toString(), {
                        path: "eth->scroll",
                        userAddress: sender,
                        receiver: receiver,
                        amount: amount.toString(),
                        ethSwapId: swapId,
                        scrollSwapId: scrollSwapId,
                        
                })
            } catch (error) {
                console.error("Failed to lock on scroll", error.message);
            }
        });
//scroll-> eth
        scrollHtlcContract.on("SwapCreated", async (swapId, sender, receiver, amount, hashlock, timelock) => {
            console.log("SwapCreated on SCROLL:", swapId);
             if (processedHashlocks.has(hashlock)) {
                console.log("already existing swap");
                return;
            }
            console.log(`User ${sender} locked ${ethers.formatEther(amount)} ETH on the scroll. Lockin on the ethereum...`);
            processedHashlocks.add(hashlock);
            try {
                //MIXING avoid
                const ethTime = timelock > 360n ? timelock - 300n : 60n;
                const transactionResponse = await ethereumHtlcContract.createSwap(
                        sender,
                        hashlock,
                        ethTime,
                        { value: amount }
                );
                const receipt = await transactionResponse.wait();
                const ethSwapId = receipt.logs.find(log => log.fragment?.name === "SwapCreated")?.args?.swapId;

                console.log(`[ETH] relayer locked ${ethers.formatEther(amount)} SCROLL for ${sender}`);
                console.log(`Txn: ${receipt.hash}`);
                //to map to track
                pendingSwapsByHashlock.set(hashlock.toString(), {
                        path: "scroll->eth",
                        userAddress: sender,
                        receiver: receiver,
                        amount: amount.toString(),
                        scrollSwapId: swapId,
                        ethSwapId: ethSwapId
                })
            } catch (error) {
                console.error("Failed to lock on ethereum", error.message);
            }
        });


        scrollHtlcContract.on("SwapWithdrawn", async (swapId, secret) => {
            console.log("[SCROLL]SwapWithdrawn:", swapId);
            //relaier is receiver
            const hashlock = ethers.keccak256(secret);
            const pendingSwap = pendingSwapsByHashlock.get(hashlock.toString());

            if (!pendingSwap) {
                console.log("No pending swaps");
                return;
            }
            try {
                if (pendingSwap.receiver.toLowerCase() === relayerAddress.toLowerCase()) {
                    const transactionResponse = await ethereumHtlcContract.withdraw(pendingSwap.ethSwapId, secret);
                    await transactionResponse.wait();
                    console.log ("[ETH] side withdrawn with the secret:", secret);
                    pendingSwapsByHashlock.delete(swapId.toString());
                }
                else ("not relayers job, skipping");
            } catch (error) {
                console.error("[ETH] Withdraw faild", error.message);
            }
        });


        ethereumHtlcContract.on("SwapWithdrawn", async (swapId, secret) => {
            console.log("[ETH]SwapWithdrawn:", swapId);
            //relaier is receiver
            const hashlock = ethers.keccak256(secret);
            const pendingSwap = pendingSwapsByHashlock.get(hashlock.toString());
            if (!pendingSwap) {
                console.log("No pending swaps");
                return;
            }
            try {
                if (pendingSwap.receiver.toLowerCase() === relayerAddress.toLowerCase()) {
                    const transactionResponse = await scrollHtlcContract.withdraw(pendingSwap.scrollSwapId, secret);
                    await transactionResponse.wait();
                    console.log(`[SCROLL] Withdrawing and the secret  was ${secret}`);
                    pendingSwapsByHashlock.delete(swapId.toString());
                } else {
                    console.log("not relayers case. Skipping");
                }
            } catch (error) {
                console.error("[SCROLL] Withdraw faild", error.message);
            }
        });
}
module.exports = { startRelayerEventListeners, pendingSwapsByHashlock };