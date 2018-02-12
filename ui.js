var symbol = "EST";

function EtherSweepUI() {
	function Tabs(id, headers, width=0.5, margin=5, padding="1em 1.4em") {
		var styleString = "width: " + (width * 100).toFixed(0) + "%; margin-left: auto; margin-right: auto; margin-top: " + margin + "px";
		return {
			html: function() {
				var headersHtml = "<ul>" + headers.map(function(header, index) {
					return "<li><a href='#tabs_" + id + "-" + index + "'>" + header + "</a></li>";
				}).join("") + "</ul>";
				var contentsHtml = headers.map(function(header, index) {
					return "<div id='tabs_" + id + "-" + index + "' style='padding: " + padding + "'></div>";
				}).join("");
				return "<div id='tabs_" + id + "' style='" + styleString + "'>" + headersHtml + contentsHtml + "</div>";
			},
			render: function() {
				$("#tabs_" + id).tabs();
			},
			content: function(header) {
				return $("#tabs_" + id + "-" + headers.indexOf(header));
			}
		};
	}
	var players = {"navi": "Na`Vi", "c9": "Cloud9", "fnatic": "Fnatic", "alliance": "Alliance", "virtuspro": "Virtus.pro", "boka": "Random player #1", "joka": "Random player #2"};
	var pics = {"navi": "navi.png", "c9": "c9.png", "fnatic": "fnatic.png", "alliance": "alliance.png", "virtuspro": "virtuspro.png", "boka": "boka.png", "joka": "joka.png"};
	var tournaments = {"dreamhack": "DreamHack", "dreamleague": "DreamLeague", "starladder": "StarLadder", "test": "Random tournament"};
	var eventCache = {};
	function BetEvent(id, onReady) {
		if (eventCache[id]) return eventCache[id];
		var ready = false;
		var data;
		var banks;
		controller.getEvent(id, function(err, eventData) {
			data = eventData;
			controller.getEventBanks(id, function(err, eventBanks) {
				banks = eventBanks;
				ready = true;
				eventCache[id] = this;
				onReady();
			});
		});
		return {
			html: function() {
				if (ready) {
					return "<table class='eventTable' cellspacing='0' border='0'>" + "<tr><td class='playerName' style='text-align: left'>" + players[data.player1] + "</td>" + "<td class='playerIconCell'>" + "<img class='playerIcon' src='./img/players/" + pics[data.player1] + "'/>" + "</td>" + "<td class='playerIconCell'><img class='playerIcon' src='./img/reserved/draw.png'/></td>" + "<td class='playerIconCell'>" + "<img class='playerIcon' src='./img/players/" + pics[data.player2] + "'/>" + "</td>" + "<td class='playerName' style='text-align: right'>" + players[data.player2] + "</td>" + "</tr>" + "<tr><td style='height: 3px; padding: 0px; background-color: rgba(0,0,0,0.1)' colspan='5'><div id='progress_" + id + "' style='height: 100%; background-color: #00CCDD'></div></td></tr>" + "<tr style='text-align: center; vertical-align: top; height: 100px'><td class='eventId' style='vertical-align: top'>#" + id + "</td><td id='betEvent_" + id + "_0'><div id='betEvent_" + id + "_0_div'><span style='padding: 3px'>" + banks[0] + "</span></div></td><td id='betEvent_" + id + "_1'><div id='betEvent_" + id + "_1_div'><span style='padding: 3px'>" + banks[1] + "</span></div></td><td id='betEvent_" + id + "_2'><div id='betEvent_" + id + "_2_div'><span style='padding: 3px'>" + banks[2] + "</span></div></td><td style='text-align: right; vertical-align: bottom'>" + tournaments[data.tournament] + "</td></tr>" + "</table>";
				} else return id;
			},
			init: function() {
				(function progressLoop() {
					var now = Date.now() / 1000;
					$("#progress_" + id).width(Math.max(Math.min((now - data.from) / (data.until - data.from), 1), 0) * 100 + "%");
					setTimeout(progressLoop, 500);
				})();
				Array(3).fill(0).forEach(function(_, index) {
					function tdColor(value, alpha=0.3, red=(data.winner==3)) {
						return "rgba(" + (red ? value : 0) + ", " + (red ? 100 : value) + ", " + (red ? 100 : (data.winner == index ? 100 : value)) + ", " + alpha + ")";
					}
					var td = $("#betEvent_" + id + "_" + index);
					td.css("background-color", tdColor(0, 0));
					td.css("padding", "0");
					td.hover(function() {
						td.css("background-color", tdColor(255));
						if (data.until >= Date.now() / 1000) td.css("cursor", "pointer");
					}, function() {
						td.css("background-color", tdColor(0, 0));
					});
					$("#betEvent_" + id + "_" + index + "_div").css("background-color", tdColor(255, 0.3));
					$("#betEvent_" + id + "_" + index + "_div").height((100 * Math.min(1.5 * banks[index] / (banks.reduce(function(res, value) { return res + value }, 0) || 1), 1)) + "%");
					if (data.until >= Date.now() / 1000) {
						$("#betEvent_" + id + "_" + index).click(function() {
							var html = $("<div title='Make bet'/>").html("<p>Bet <span id='bet_amount'></span> ETH on <span id='bet_player'></span></p><p><input id='spinner' name='value' value='0'></p><p style='text-align: right'><button id='bet_submit' disabled>Make bet</button></p>");
							html.find("#bet_player").html(index == 0 ? players[data.player1] : (index == 1 ? players[data.player1] : "Draw"));
							var spinner = html.find("#spinner");
							spinner.spinner({step: 0.001, min: 0});
							function onSpin() {
								var value = spinner.spinner("value");
								if (value <= 0) html.find("#bet_submit").prop("disabled", true);
								else html.find("#bet_submit").prop("disabled", false);
								html.find("#bet_amount").html(value);
							}
							spinner.on("spinstop", function() {
								onSpin();
							});
							onSpin();
							html.find("#bet_submit").on("click", function() {
								controller.betMake(id, index, spinner.spinner("value"), function() {
								});
							});
							html.dialog({modal: true});
							html.parent().width("auto");
						});
					}
				});
			}
		}
	}
	function Categories(id, categories, mode) {
		var screen = new Tabs(id, categories.map(function(category) {
			return category[1];
		}), 1);
		return {
			html: screen.html,
			render: function() {
				categories.forEach(function(category) {
					controller.getEvents(category[0], mode, function(err, eventIds) {
						var tableHtml = "<table cellspacing='10' style='width: 100%'>" + eventIds.map(function(id, index) {
							return "<tr><td id='betEvent_" + id + "'></td></tr>";
						}).join("") + "</table>";
						screen.content(category[1]).html(tableHtml);
						eventIds.forEach(function(id) {
							var betEvent = new BetEvent(id, function() {
								$("#betEvent_" + id).html(betEvent.html());
								betEvent.init();
							});
							$("#betEvent_" + id).html(betEvent.html());
						});
						screen.render();
					});
				});
			}
		};
	}

	var icoStart;
	var icoEnd;
	var balanceETH;
	var valanceEST;
	var labels = {};
	function ICOScreen(id) {
		function Whitepaper() {
			var header = "<p>EtherSweep is a dApp based on Ethereum blockchain that will allow you to bet ETH on sport events.</p>";
			var ico = "<p class='ico_header'>ICO</p><p>The main goal of ICO is to raise funding for the promotion of the project, which will give you profit in the future. By buying " + symbol + " tokens you are buying access to the contract balance, which consists of funds collected from ICO and 5% commission from each event reward. More bettors - more profit.</p><p>Tokens can be generated only while ICO is going on. Its price linearly increasing from $0.30 to $1.00 within 30 days. Contract owner getting 1.5x tokens that you bought. After ICO owner's tokens should not be more than 30% of the total supply, so half of them will be withdrawn and spent on the promotion and development of the project.</p>";
			var token = "<p class='ico_header'>Token</p><p>Token is a ticket that allows you to withdraw your stake of ETH from the available contract balance. Your stake calculates by dividing your " + symbol + " balance on total supply of tokens.</p><p>Available contract balance is a balance that contains commission only from finished events. You can get it's value any time by calling availableBalance() function on the contract.</p><p>Withdraw destroys tokens.</p>";
			var roadmap = "<p class='ico_header'>Roadmap</p><table class='roadmap'><tr><td>10 days after ICO starts</td><td>Run simulation on Ropsten testnet</td></tr><tr><td>15 days after ICO starts</td><td>First bet event</td></tr><tr><td>End of ICO</td><td>New website</td></tr><tr><td>Month after ICO</td><td>Contract improvements</td></tr><tr><td>3 months after ICO</td><td>Estimated profit - 120 ETH</td></tr><tr><td>6 months after ICO</td><td>Estimated profit - 600 ETH</td></tr><tr><td>Year after ICO</td><td>Estimated profit - 2000 ETH</td></tr></table>";
			return {
				html: function() {
					return header + "<hr/>" + ico + token + roadmap;
				}
			};
		}
		var screen = new Tabs(id, ["ICO", "About"]);
		var whitepaper = new Whitepaper();
		return {
			html: screen.html,
			render: function() {
				screen.content("About").html(whitepaper.html());
				screen.content("ICO").html("<table style='margin-left: auto; margin-right: auto; font-size: 1.25em'><tr><td style='text-align: right'>Address:</td><td id='_address' colspan='2'>Loading...</td></tr><tr><td style='text-align: right'>Balance:</td><td id='_balance' style='width: 0px'>Loading...</td><td style='border: 1px solid rgba(0, 255, 0, 0.3); padding: 0'><button id='_deposit_btn' style='width: 100%; padding: 0'>Deposit</button></td></tr><tr><td></td><td id='_balance_eth'></td><td style='border: 1px solid rgba(255, 0, 0, 0.3); padding: 0'><button id='_withdraw_btn' style='width: 100%; padding: 0'>Withdraw</button></td></tr><tr><td>ICO token price:</td><td id='_token_price'></td></tr><tr><td style='text-align: right'>ICO progress:</td><td style='background-color: #555555; height: 0px'><div id='ico_progress' style='height: 100%; background-color: #00CCCC; z-index: -1'></div></td></tr></table>");
				$("#_deposit_btn").button().click(function() {
					var html = $("<div title='Deposit ETH'/>").html("<p>Buy <span id='buy_amount'></span> " + symbol + " for <span id='buy_cost'></span> ETH</p><p><input id='spinner' name='value' value='0'></p><p style='text-align: right'><button id='buy_submit' disabled>Buy</button></p>");
					var spinner = html.find("#spinner");
					var value;
					spinner.spinner({step: 0.001, min: 0, incremental: false});
					spinner.width("85%")
					function onSpin() {
						value = spinner.spinner("value");
						if (value <= 0) html.find("#buy_submit").prop("disabled", true);
						else html.find("#buy_submit").prop("disabled", false);
						html.find("#buy_cost").html(value);
					}
					spinner.on("spinstop", function() {
						onSpin();
					});
					onSpin();
					html.find("#buy_submit").on("click", function() {
						controller.icoDeposit(value, function(err, data) {
							html.dialog().dialog("close");
						});
					});
					html.dialog({modal: true});
					html.parent().width("auto");
					(function loop() {
						html.find("#buy_amount").html((value / (0.0003 + 0.0007 * (Date.now() / 1000 - icoStart) / (icoEnd - icoStart))).toFixed(9));
						if (html.dialog("isOpen")) setTimeout(loop, 100);
					})();
				});
				$("#_withdraw_btn").button().click(function() {
					var html = $("<div title='Withdraw " + symbol + "'/>").html("<p>Withdraw <span id='withdraw_cost'></span> " + symbol + " for <span id='withdraw_amount'></span> ETH</p><p><input id='spinner' name='value' value='0'></p><p style='text-align: right'><button id='withdraw_submit' disabled>Withdraw</button></p>");
					var spinner = html.find("#spinner");
					var value;
					spinner.spinner({step: 1, min: 0, max: balanceEST, incremental: false});
					spinner.width("85%")
					function onSpin() {
						value = spinner.spinner("value");
						if (value <= 0 || value > balanceEST) html.find("#withdraw_submit").prop("disabled", true);
						else html.find("#withdraw_submit").prop("disabled", false);
						html.find("#withdraw_cost").html(value);
						html.find("#withdraw_amount").html((value * balanceETH / (balanceEST || 1)).toFixed(18));
					}
					spinner.on("spinstop", function() {
						onSpin();
					});
					onSpin();
					html.find("#withdraw_submit").on("click", function() {
						controller.withdraw(value * 1000000000, function(err, data) {
							html.dialog().dialog("close");
						});
					});
					html.dialog({modal: true});
					html.parent().width("auto");
				});
				labels.address = $("#_address");
				labels.balance = $("#_balance");
				labels.balanceETH = $("#_balance_eth");
				labels.tokenPrice = $("#_token_price");
				screen.render();
				(function loop() {
					var progress = (Date.now() / 1000 - icoStart) / (icoEnd - icoStart);
					$("#ico_progress").width((Math.min(progress, 1) * 100) + "%");
					labels.tokenPrice.html((0.0003 + 0.0007 * progress).toFixed(18) + " ETH");
					setTimeout(loop, 100);
				})();
			}
		};
	}

	var controller;
	var state = 0;
	var categories = [["random", "Random events"]];
	var loadingScreen = new Tabs(1, ["Loading"]);
	var metamaskScreen = new Tabs(2, ["Getting Started"]);
	var metamaskUnlockScreen = new Tabs(6, ["Metamask"]);
	var icoScreen = new ICOScreen(3);
	var workScreen = new Tabs(4, ["Upcoming events", "Live events", "Past events"], 0.5, 5, "0.25em 0.35em");
	var betsTabs = new Tabs(5, []);

	function render(callback) {
		var footerHtml = "<footer style='color: #a9a9a9; text-align: center; vertical-align: bottom'><br/>Powered by Ethereum<br/><span style='color: #494949; font-size: 0.7em'>EtherSweep 2018</span></footer>";
		$("body").fadeOut(500, function() {
			for (var label in labels) delete labels[label];
			switch(state) {
				case 0: {
					$("body").html(loadingScreen.html() + footerHtml);
					loadingScreen.content("Loading").html("<img src='./img/loading.png'/>")
					loadingScreen.render();
					break;
				}
				case 1: {
					$("body").html(metamaskScreen.html() + footerHtml);
					metamaskScreen.content("Getting Started").html("<p>1. Install <a href='https://metamask.io/' target='_blank'>MetaMask</a></p><p>2. Refresh page</p>");
					metamaskScreen.render();
					break;
				}
				case 2: {
					var upcomingEventsScreen = new Categories(6, categories, 0);
					var liveEventsScreen = new Categories(7, categories, 1);
					var pastEventsScreen = new Categories(8, categories, 2);
					$("body").html(icoScreen.html() + workScreen.html() + footerHtml);
					workScreen.content("Upcoming events").html(upcomingEventsScreen.html());
					workScreen.content("Live events").html(liveEventsScreen.html());
					workScreen.content("Past events").html(pastEventsScreen.html());
					upcomingEventsScreen.render();
					liveEventsScreen.render();
					pastEventsScreen.render();
					icoScreen.render();
					workScreen.render();
					break;
				}
				case 3: {
					$("body").html(metamaskUnlockScreen.html() + footerHtml);
					metamaskUnlockScreen.content("Metamask").html("<p>Unlock your Metamask account and refresh page</p>");
					metamaskUnlockScreen.render();
					break;
				}
			}
			$("body").fadeIn(500, callback);
		});
	}

	return {
		render: render,
		external: {
			changeState: function(value, callback) {
				state = value;
				render(callback);
			},
			setAddress: function(value) {
				labels.address.html(value);
			},
			setBalance: function(balance) {
				balanceEST = balance;
				labels.balance.html(balance + " " + symbol);
			},
			setBalanceETH: function(balance) {
				balanceETH = balance;
				labels.balanceETH.html(balance + " ETH");
			}
		},
		setController: function(_controller) {
			controller = _controller;
			controller.getICO(function(_icoStart, _icoEnd) {
				icoStart = _icoStart;
				icoEnd = _icoEnd;
			});
		}
	};
}
