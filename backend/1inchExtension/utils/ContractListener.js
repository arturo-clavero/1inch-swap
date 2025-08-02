
class ContractListener {
	constructor(
		contract,
		eventName, 
		eventHandler = ()=>{},
	) {
		this.contract = contract;
		this.eventName = eventName;
		this.eventHandler = eventHandler;
	}

	start() {
		this.contract.on(this.eventName, (...args) => {
			this.eventHandler(...args);
		});
		// this.contract.on("*", (...args) => {
		// 	console.log("Caught some event:", args);
		// });
		console.log(`Listening for event "${this.eventName}"`);
	}

	stop() {
		this.contract.removeAllListeners(this.eventName);
		console.log(`Stopped listening for event "${this.eventName}"`);
	}

	async wait(launchEvent = ()=>{}, conditions = ()=>{return true;}) {
		return new Promise((resolve) => {
			const listener = (...args) => {
				if (conditions(args))
				{
					this.contract.off(this.eventName, listener); // remove listener after first call
					resolve(args);

				}
				
			};
			this.contract.on(this.eventName, listener);
			launchEvent();
		});
	}
	
// 	async wait(condition = ()=> {}) {
// 		console.log("hello?", this.eventName);
// 		return new Promise((resolve) => {
// 			this.contract.on(this.eventName, (...args)=> {
// 				//console.log("args ", args);
// 				//this.contract.off(this.eventName);
// 				resolve();
// 			});
// 			// const listener = (...args) => {
// 			// 	if (condition(args)){
// 			// 		this.contract.off(this.eventName, listener);
// 			// 		resolve({ args });
// 			// 	}
// 			// };
// 			// this.contract.on(this.eventName, listener);
// 		});
// 	}
}

module.exports = ContractListener;
