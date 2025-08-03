
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
}

module.exports = ContractListener;
