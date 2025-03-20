import axios from 'axios';

export async function fetchTopCryptos(limit: number = 100) {
  const url = `https://api.coingecko.com/api/v3/coins/markets`;
  const params = {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: limit,
    page: 1,
    sparkline: false
  };

  const response = await axios.get(url, { params });
  return response.data;
}

export function formatCryptoData(cryptos: any[]): string {
  let message = '📊 *Top 100 Cryptocurrencies by Market Cap* 📊\n\n';

  cryptos.forEach((coin, index) => {
    message += `*${index + 1}. ${coin.name}* (${coin.symbol.toUpperCase()})\n`;
    message += `💰 *Price:* $${coin.current_price.toLocaleString()}\n`;
    message += `🏦 *Market Cap:* $${coin.market_cap.toLocaleString()}\n`;
    message += `📈 *24h Change:* ${coin.price_change_percentage_24h?.toFixed(2)}%\n`;
    message += `🔗 [View More](https://www.coingecko.com/en/coins/${coin.id})\n`;
    message += `--------------------------------\n`;
  });

  return message;
}
