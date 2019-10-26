var config = require('./config.json');
var cron = require('node-cron');

const Binance = require('binance-api-node').default;
const client = Binance({
    apiKey: config.API_KEY,
    apiSecret: config.SECRET_KEY,
});

const TelegramBot = require('node-telegram-bot-api');
const TOKEN = config.BOT_TOKEN;
var bot = new TelegramBot(TOKEN, {polling: false});
bot.sendMessage(config.BOT_CHAT, '\u{1F916} Bot Trader iniciando em '+config.CURRENCY + config.MARKET);

CancelOpenOrders();
var task = cron.schedule('*/' + config.LOOP_TIME + ' * * * * *', () => {
	// Limpa o console
	console.clear();
	CheckDecimals();
	CheckPrice();
	CheckBalance();
	CheckValueTrade();
	CheckTypeOrder();
	CheckShortLongMode();
	ConsoleLog();
}, { scheduled: false });


function CancelOpenOrders() {
	// Cancelando ordens existentes para negociação
	client.openOrders({
	  symbol: config.CURRENCY + config.MARKET,
	}).then((result) => {
		if(result.length > 0) {
			for (let index = 0; index < result.length; index++) {
				client.cancelOrder({
				  symbol: config.CURRENCY + config.MARKET,
				  orderId: result[index].orderId,
				});				
			}
			bot.sendMessage(config.BOT_CHAT, '\u{1f6a8} Cancelando ordens existentes para operação');
		}
	});
}

function CheckShortLongMode() {
	if(short_mode == 1) {
		if(OrderBuyID == 0 && price != 0.00) {
			OpenShortOrder();
		}
		CheckShortOrder();
	}	
	if(short_mode == 0) {
		if(OrderSellID == 0 && price != 0.00) {
			OpenLongOrder();
		}
		CheckLongOrder();
	}
}


function sleep(millis) {
    for(let x=0; x < millis; x++) {
		console.log("Aguardando"+ x +" para execução da ordem de compra");
	}
}

function OpenShortOrder() {
	// Verifica o preço atual
	CheckPrice();
	
	let temp_price_stop = parseFloat((config.STOP_LIMIT * price) / 100).toFixed(decimal_price);
	price_stop = (parseFloat(price) + parseFloat(temp_price_stop)).toFixed(decimal_price);	
	let percentage_limit = parseFloat(0.01 * price_stop / 100).toFixed(decimal_price);
	price_stop_limit = (parseFloat(price_stop) - parseFloat(percentage_limit)).toFixed(decimal_price);
	
	// Ajusta spread para moedas de baixo valor
	if(price_stop == price_stop_limit) {
		let percentage_limit = parseFloat(0.05 * price_stop / 100).toFixed(decimal_price);
		price_stop_limit = (parseFloat(price_stop) - parseFloat(percentage_limit)).toFixed(decimal_price);
	}
	if(price_stop == price_stop_limit) {
		let percentage_limit = parseFloat(0.1 * price_stop / 100).toFixed(decimal_price);
		price_stop_limit = (parseFloat(price_stop) - parseFloat(percentage_limit)).toFixed(decimal_price);
	}
	
	// Abre ordem de compra com stop
	client.order({
		symbol: config.CURRENCY + config.MARKET,
		side: 'BUY',
		type: 'STOP_LOSS_LIMIT',
		price: price_stop,
		stopPrice: price_stop_limit,
		timeInForce: 'GTC',
		quantity: value_trade
	}).then((result) => {
		console.log("ORDEM DE COMPRA EXECUTADA");
		OrderBuyID = result.orderId;
	}).catch((err) => {
		console.log(err);
		console.log("ERRO ORDEM NA ORDEM DE COMPRA")
	});
}

function OpenLongOrder() {
	// Verifica o preço atual
	CheckPrice();

	let temp_price_stop = parseFloat((config.STOP_LIMIT * price) / 100).toFixed(decimal_price);
	price_stop = (parseFloat(price) - parseFloat(temp_price_stop)).toFixed(decimal_price);				
	let percentage_limit = parseFloat(0.01 * price_stop / 100).toFixed(decimal_price);
	price_stop_limit = (parseFloat(price_stop) + parseFloat(percentage_limit)).toFixed(decimal_price);
		
	// Ajusta spread para moedas de baixo valor
	if(price_stop == price_stop_limit) {
		let percentage_limit = parseFloat(0.05 * price_stop / 100).toFixed(decimal_price);
		price_stop_limit = (parseFloat(price_stop) + parseFloat(percentage_limit)).toFixed(decimal_price);
	}
	if(price_stop == price_stop_limit) {
		let percentage_limit = parseFloat(0.1 * price_stop / 100).toFixed(decimal_price);
		price_stop_limit = (parseFloat(price_stop) + parseFloat(percentage_limit)).toFixed(decimal_price);
	}
	
	// Abre ordem de compra com stop
	client.order({
		symbol: config.CURRENCY + config.MARKET,
		side: 'SELL',
		type: 'STOP_LOSS_LIMIT',
		price: price_stop,
		stopPrice: price_stop_limit,
		timeInForce: 'GTC',
		quantity: value_trade
	}).then((result) => {
		OrderSellID = result.orderId;
	}).catch((err) => {
		console.log(err);
		console.log(value_trade);
		console.log("ERRO ORDEM NA ORDEM DE VENDA")
	});
}

function CheckDecimals() {
	client.exchangeInfo({ }).then((result) => {
		for (let index = 0; index < result.symbols.length; index++) {
			if(result.symbols[index].symbol == config.CURRENCY + config.MARKET) {
				let temp_price_decimal = parseFloat(result.symbols[index].filters[0].tickSize);
				temp_price_decimal = (temp_price_decimal + "").split(".")[1];
				if(temp_price_decimal) {
					temp_price_decimal = temp_price_decimal.toString().length;
				} else {
					temp_price_decimal = 0;	
				}
				decimal_price = temp_price_decimal;

				let temp_quantity_decimal = parseFloat(result.symbols[index].filters[2].minQty);
				temp_quantity_decimal = (temp_quantity_decimal + "").split(".")[1];
				if(temp_quantity_decimal) {
					temp_quantity_decimal = temp_quantity_decimal.toString().length;
				} else {
					temp_quantity_decimal = 0
				}
				decimal_quantity = temp_quantity_decimal;
			}
		}
	});
}

function ConsoleLog() {
	// Console de estatísticas
	console.log("======= TRADING BOT ======");
	console.log("UPTIME....................:", ((Math.floor(+new Date() / 1000) - startTime) / 3600).toFixed(2) , "horas");
	console.log("VALOR PARA TRADE EM "+config.CURRENCY+"...:", value_trade);
	console.log("MODO DE OPERAÇÃO..........:", trade_label);
	console.log("VALOR DO PAR "+config.CURRENCY + config.MARKET+"......:", price);
	console.log("ALVO EM %.................:", config.STOP_LIMIT * 2+" %");
	console.log("ALVO ATINGIDO.............:", spread+" %");
	console.log("STOP EM...................:", price_stop);
	console.log("==== STATUS DE TRADE =====");
	console.log("ORDEM DE STOP BUY ATIVA...:", OrderBuyID);
	console.log("ORDEM DE STOP SELL ATIVA..:", OrderSellID);
	console.log("LUCRO % DA OPERAÇÃO.......:", profit_trade);
	console.log("SHORT: STOP / GAIN........:", sum_short_stop+ " / "+ sum_short);
	console.log("LONG:  STOP / GAIN........:", sum_long_stop+ " / "+ sum_long);
}

function CheckShortOrder() {
	if(OrderBuyID != 0) {
		// Verifica o status da ordem já aplicada
		client.getOrder({
		symbol: config.CURRENCY + config.MARKET,
			orderId: OrderBuyID,
		}).then((result) => {
			if(result.status == 'FILLED') {
				bot.sendMessage(config.BOT_CHAT, '\u{1F4E3} Alvo stopado em '+config.CURRENCY + config.MARKET+', entrado em modo long - Lucro da operação '+profit_trade +'%. Preço da última venda: '+last_sell_value+' Preço de compra: '+ result.stopPrice);
				OrderBuyID = 0
				short_mode = 0;
				sum_short_stop++;
				profit_trade = parseFloat(config.STOP_LIMIT * -1);
				last_buy_value = result.price;
			} else {
				if(result.status == 'CANCELED') {
					OrderBuyID = 0;
					short_mode = 1;
					last_buy_value = result.stopPrice;
				} else {
					// Verifica se precisa reduzir o stop
					let temp_price_stop = parseFloat((config.STOP_LIMIT * price) / 100).toFixed(decimal_price);
					price_stop = parseFloat(result.price).toFixed(decimal_price);
					spread = (((price - price_stop) / price_stop) * 100).toFixed(decimal_price);
					let increate_stop = (parseFloat(config.STOP_LIMIT) + parseFloat(config.TRAILING_STOP));
					if(Math.abs(spread) >= increate_stop) {
						// Cancela stop antigo
						CancelOrder(OrderBuyID)
						// Abre novo stop
						//OpenShortOrder();
						sum_short++;
						profit_trade = (parseFloat(profit_trade) + parseFloat(config.TRAILING_STOP)).toFixed(2);
					}
				}
			}
		});
	}
}

function CheckLongOrder() {
	if(OrderSellID != 0) {
		// Verifica o status da ordem já aplicada
		client.getOrder({
		symbol: config.CURRENCY + config.MARKET,
			orderId: OrderSellID,
		}).then((result) => {
			if(result.status == 'FILLED') {
				bot.sendMessage(config.BOT_CHAT, '\u{1F4E3} Alvo stopado em '+config.CURRENCY + config.MARKET+', entrado em modo short - Lucro da operação '+profit_trade+'%. Preço de última compra: '+last_buy_value+' Preço de venda: '+result.stopPrice);
				OrderSellID = 0
				short_mode = 1;
				sum_long_stop++;
				profit_trade = parseFloat(config.STOP_LIMIT * -1);
				last_sell_value = result.stopPrice;
			} else {
				if(result.status == 'CANCELED') {
					OrderSellID = 0;
					short_mode = 0;
				} else {
					// Verifica se precisa reduzir o stop
					let temp_price_stop = parseFloat((config.STOP_LIMIT * price) / 100).toFixed(decimal_price);
					price_stop = parseFloat(result.price).toFixed(decimal_price);
					spread = (((price - price_stop) / price_stop) * 100).toFixed(decimal_price);
					let increate_stop = (parseFloat(config.STOP_LIMIT) + parseFloat(config.TRAILING_STOP));
					if(Math.abs(spread) >= increate_stop) {
						CancelOrder(OrderSellID);
						//sleep(30);
						// Abre novo stop
						//OpenLongOrder();
						sum_long++;
						profit_trade = (parseFloat(profit_trade) + parseFloat(config.TRAILING_STOP)).toFixed(2);
					}
				}
			}
		});
	}
}


function CancelOrder(id) {
	// Cancela stop antigo
	client.cancelOrder({
	  symbol: config.CURRENCY + config.MARKET,
	  orderId: id,
	});
}

function CheckBalance() {
	// Verifica o saldo para compras e iniciar a negociação
	client.accountInfo({ useServerTime: true }).then((result) => {
		for (let index = 0; index < result.balances.length; index++) {
			if (result.balances[index].asset == config.MARKET) {
				balance_market = (parseFloat(result.balances[index].free));
			}
			if (result.balances[index].asset == config.CURRENCY) {
				balance_currency = (parseFloat(result.balances[index].free));
			}
		}
	});
}

function CheckPrice() {
	// Busca preco atual do ativo 
	client.avgPrice({ symbol: config.CURRENCY + config.MARKET }).then((result) => {
		price = parseFloat(result.price);
	});
}

function CheckValueTrade() {
	// Determina a quantidade em currency 
	if(short_mode == 1) {
		let fees = parseFloat(0.1 * value_trade / 100).toFixed(decimal_quantity);
		value_trade = (config.ORDER_VALUE / price).toFixed(decimal_quantity);
	} else {
		let fees = parseFloat(0.1 * value_trade / 100).toFixed(decimal_quantity);
		value_trade = parseFloat(balance_currency - fees).toFixed(decimal_quantity);
	}
}

function CheckTypeOrder() {
	if(OrderBuyID != 0) {
		short_mode = 1;
		trade_label = "SHORT";
	} else {
		if(OrderSellID != 0) {
			short_mode = 0;
			trade_label = "LONG";
		}
	}
}

// limpa o console
console.clear();
console.log("Iniciando...");
task.start();
OrderBuyID = 0;
buyAmount = 0;
buyPriceTemp = 0;
OrderSellID = 0;
sellAmount = 0;
sellPriceTemp = 0;
short_mode = 1;
trade_label = "SHORT";
price = 0;
decimal_price = 0;
decimal_quantity = 0;
sum_decimal = 0;
balance_market = 0;
balance_currency = 0;
price_stop = 0;
price_stop_limit = 0;
value_trade = 0;
spread = 0;
sum_short = 0;
sum_short_stop = 0;
sum_long = 0;
sum_long_stop = 0;
last_buy_value = 0;
last_sell_value = 0;
profit_trade = parseFloat(config.STOP_LIMIT * -1);
startTime = Math.floor(+new Date() / 1000);
