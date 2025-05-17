// script.js
(async () => {
    const ctx = document.getElementById('chart').getContext('2d');
    const signalEl = document.getElementById('signal');
  
    // 1) Busca últimas 16 velas de 15m = 4h
    const resp = await fetch(
      'https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=15m&limit=16'
    );
    const raw = await resp.json();
  
    // 2) Formata cada vela como { x: Date, o, h, l, c }
    const ohlc = raw.map(c => ({
      x: new Date(c[0]),
      o: +c[1],
      h: +c[2],
      l: +c[3],
      c: +c[4]
    }));
    const closes = ohlc.map(c => c.c);
  
    // 3) Função para SMA
    function sma(values, period) {
      return values.map((_, i, arr) => {
        if (i < period - 1) return null;
        const slice = arr.slice(i - period + 1, i + 1);
        return slice.reduce((sum, v) => sum + v, 0) / period;
      });
    }
  
    const sma5 = sma(closes, 5);
    const sma10 = sma(closes, 10);
  
    // 4) Define sinal
    const prev5 = sma5[sma5.length - 2];
    const prev10 = sma10[sma10.length - 2];
    const last5 = sma5[sma5.length - 1];
    const last10 = sma10[sma10.length - 1];
  
    let signal = 'Sem sinal definido';
    if (prev5 !== null && prev10 !== null) {
      if (prev5 <= prev10 && last5 > last10) {
        signal = 'COMPRA';
        signalEl.classList.add('buy');
      } else if (prev5 >= prev10 && last5 < last10) {
        signal = 'VENDA';
        signalEl.classList.add('sell');
      }
    }
    signalEl.textContent = `Sinal: ${signal}`;
  
    // 5) Cria o gráfico
    new Chart(ctx, {
      type: 'candlestick',
      data: {
        datasets: [
          {
            label: 'Preço (OHLC)',
            data: ohlc
          },
          {
            type: 'line',
            label: 'SMA 5',
            data: ohlc.map((c, i) => ({ x: c.x, y: sma5[i] })),
            borderWidth: 1
          },
          {
            type: 'line',
            label: 'SMA 10',
            data: ohlc.map((c, i) => ({ x: c.x, y: sma10[i] })),
            borderWidth: 1
          }
        ]
      },
      options: {
        scales: {
          x: {
            type: 'time',
            time: { unit: 'minute', tooltipFormat: 'HH:mm' }
          },
          y: { position: 'right' }
        },
        plugins: {
          legend: { position: 'top' }
        }
      }
    });
  })();
  