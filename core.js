function App(web3, contract, decimals, symbol, ui, callback) {
	function toNumber(value) {
		return value.div("1" + Array(decimals).fill("0").join("")).toNumber();
	}
	function Account(address) {
		return {
			address: address,
			getBalance: function(callback) {
				contract.balanceOf(address, function(err, data) {
					if (err) callback(err);
					else callback(null, toNumber(data));
				});
			}
		}
	}
	function Contract() {
		
	}
	var account;
	return {
		init: function() {
			ui.changeState(2, function() {
				account = new Account(web3.eth.defaultAccount);
				ui.setAddress(account.address);
				account.getBalance(function(err, balance) {
					ui.setBalance(balance, symbol);
					contract.availableBalance(function(err, _balance) {
						contract.totalSupply(function(err, supply) {
							ui.setBalanceETH(balance * web3.fromWei(_balance, "ether") / (toNumber(supply) || 1));
						});
					});
				});
			});
		},
		controller: {
			availableBalance: function(callback) {
				contract.availableBalance(function(err, data) {
					callback(parseFloat(web3.fromWei(data, "ether")));
				});
			},
			totalSupply: function(callback) {
				contract.totalSupply(function(err, data) {
					callback(toNumber(data));
				});
			},
			getICO: function(callback) {
				contract.icoEnd(function(err, data) {
					callback(data.toNumber()-60*60*24*30, data.toNumber());
				});
			},
			getEvent: function(id, callback) {
				contract.betEvents(id, function(err, data) {
					callback(err, err || {
						from: data[0].toNumber(),
						until: data[1].toNumber(),
						category: data[2],
						tournament: data[3],
						player1: data[4],
						player2: data[5],
						drawAllowed: data[6],
						winner: data[7].toNumber()
					});
				});
			},
			getEvents: function(category, mode, callback) {
				contract.getEvents(0, category, mode, function(err, data) {
					callback(err, err || data[1].slice(0, data[0].toNumber()).map(function(id) {
						return id.toNumber();
					}));
				});
			},
			getEventBanks: function(id, callback) {
				contract.getEventBanks(id, function(err, data) {
					callback(err, err || data.map(function(bank) {
						return parseFloat(web3.fromWei(bank, "ether"));
					}));
				});
			},
			betMake: function(id, winner, value, callback) {
				contract.betMake(id, winner, {from: account.address, to: contract.address, value: web3.toWei(value, "ether")}, callback);
			},
			icoDeposit: function(value, callback) {
				web3.eth.sendTransaction({from: account.address, to: contract.address, value: web3.toWei(value, "ether")}, callback);
			},
			withdraw: function(value, callback) {
				contract.withdraw(value, callback);
			}
		}
	};
}
