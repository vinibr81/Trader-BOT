Bot para trader de criptomoedas.

Funcionamento:

- Funciona apenas na binance
- Ele cria ordens de stop loss e stop buy, baseado no método dealer:
	- É necessário começar com uma moeda stable (recomendo USDT pelo volume)
	- Ele cria uma ordem de compra (stop buy) e caso o preço vá caindo ele acompanha o preço pra tentar a melhor compra
	- Feito a compra, ele cria uma ordem de stop loss acompanhando o preço na subida
	- Caso o stop loss seja ativo uma ordem de stop buy é ativa e o processo se repete


Instruções de uso do config.json

API_KEY e SECRET_KEY:  São as chaves da binance de autenticação. Não vou explicar aqui como é gerada

ORDER_VALUE: É o tamanho a ordem de compra e venda

BOT_TOKEN e BOT_CHAT: São informações do telegram, busque no google como criar um bot e descobrir seu chatid.

CURRENCY: É o mercado, recomendo TRX para conhecer o bot

MARKET: É o par que vai ser trabalhado, recomendo USDT pelo volume

STOP_LIMIT: É a distancia em porcentagem do stop (caso o preço caia ou suba) ao atingir esse valor a ordem é acionada

TRAILING_STOP: Na medida que o preço cai ou sobe, dependendo a ordem ativa no momento, o bot vai acompanhando o preço

LOOP_TIME: É o período em que o bot é acionado para verificar as ordens


Importante:

Sempre que acionar o bot, tenha sempre um saldo em Market.
O bot está em uma vesão beta, então agradeço ideias e melhorias


