const { waitForOrders } = require('../phases/1_waitForOrders');
const { dutchAuction } = require('../phases/3_dutchAuction');
const { deposit } = require('../phases/4_deposit');
const { withdraw } = require('../phases/5_withdraw');

class Resolver {
	constructor(id, minPrice = 0, refill = 1) {
		this.id = id;
		this.minPrice = minPrice;
		this.refillPercentRate = refill;
		this.resolverActions = [
			waitForOrders,
			dutchAuction,
			deposit,
			withdraw,
		];
		this.resetActions();

	}
	resetActions(){
		this.resolverStep = -1;
		this.order = null;
	}

	async simulateAsyncWork() { //for testing
		return new Promise((resolve) => setTimeout(resolve, 500));
	}

	async nextAction() {
		this.resolverStep++;
		console.log(`[resolver ${this.id}] next action`, this.resolverStep);
		if (this.resolverStep >= this.resolverActions.length) {
		console.log(`[resolver ${this.id}] order`, this.order, 'finalized\n\n');
		this.resetActions();
		await this.nextAction();
		return;
		}
		await this.resolverActions[this.resolverStep](this);
	}

	async waitForEvent(
		contract, 
		eventName, 
		launchEventAction = ()=>{}, 
		eventConditions = (args)=>{
			if (Number(args[2]) == this.order) return true;
			return false;
		},
	) 
	{
		const ContractListener = require('../contracts/ContractListener');
		const listener = new ContractListener(
			contract,
			eventName,
		);
		await listener.wait(
			launchEventAction,
			eventConditions
		);
	}
	
}

module.exports = Resolver;
