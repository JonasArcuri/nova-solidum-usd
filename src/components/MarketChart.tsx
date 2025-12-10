import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './MarketChart.css'

interface CryptoPrice {
  name: string
  symbol: string
  price: number
  change24h: number
}

interface ChartData {
  time: string
  [key: string]: string | number
}

const MarketChart = () => {
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cryptos = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', color: '#f7931a', icon: null }, // Bitcoin não tem ícone disponível
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627eea', icon: '/imgs/Etherum-logo.png' },
    { id: 'tether', name: 'Tether', symbol: 'USDT', color: '#26a17b', icon: '/imgs/Thether-coin.png' },
    { id: 'binancecoin', name: 'BNB', symbol: 'BNB', color: '#f3ba2f', icon: '/imgs/Bnb-coin.png' },
    { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#9945ff', icon: '/imgs/Solana-coin.png' }
  ]

  const fetchPrices = async () => {
    try {
      setError(null)
      
      // Buscar preços das principais criptomoedas em BRL
      const ids = cryptos.map(c => c.id).join(',')
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl&include_24hr_change=true`
      )
      
      if (!response.ok) {
        throw new Error('Erro ao buscar cotações')
      }
      
      const data = await response.json()
      
      const prices: CryptoPrice[] = cryptos.map(crypto => {
        const cryptoData = data[crypto.id]
        return {
          name: crypto.name,
          symbol: crypto.symbol,
          price: cryptoData?.brl || 0,
          change24h: cryptoData?.brl_24h_change || 0
        }
      })

      setCryptoPrices(prices)

      // Criar dados do gráfico (últimas 24 horas simuladas)
      const now = new Date()
      const newChartData: ChartData[] = []
      
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000)
        const timeStr = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        
        const dataPoint: ChartData = { time: timeStr }
        
        cryptos.forEach(crypto => {
          const price = prices.find(p => p.symbol === crypto.symbol)?.price || 0
          // Simular variação histórica (em produção, usar dados reais da API)
          const variation = (Math.random() - 0.5) * 0.02 // ±1% de variação
          dataPoint[crypto.symbol] = price * (1 + variation)
        })
        
        newChartData.push(dataPoint)
      }
      
      setChartData(newChartData)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrices()
    
    const interval = setInterval(fetchPrices, 60000) // Atualizar a cada 1 minuto
    
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatTooltip = (value: number) => {
    return formatCurrency(value)
  }

  if (loading && cryptoPrices.length === 0) {
    return (
      <div className="chart-container">
        <div className="loading">Carregando cotações...</div>
      </div>
    )
  }

  if (error && cryptoPrices.length === 0) {
    return (
      <div className="chart-container">
        <div className="error">
          <p>Erro ao carregar dados</p>
          <button onClick={fetchPrices} className="retry-button">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <div className="chart-card">
        <div className="chart-header">
          <h2 className="chart-title">Principais Cotações do Mercado</h2>
          <div className="crypto-list">
            {cryptoPrices.map((crypto, index) => {
              const cryptoInfo = cryptos[index]
              const isPositive = crypto.change24h >= 0
              
              return (
                <div key={crypto.symbol} className="crypto-item">
                  <div className="crypto-info">
                    {cryptoInfo.icon ? (
                      <img 
                        src={cryptoInfo.icon} 
                        alt={crypto.name}
                        className="crypto-icon"
                      />
                    ) : (
                      <span 
                        className="crypto-dot" 
                        style={{ backgroundColor: cryptoInfo.color }}
                      ></span>
                    )}
                    <span className="crypto-name">{crypto.symbol}</span>
                  </div>
                  <div className="crypto-price">
                    <span className="price-value">
                      {formatCurrency(crypto.price)}
                    </span>
                    <span className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? '+' : ''}{crypto.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`
                  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`
                  return `R$ ${value.toFixed(0)}`
                }}
              />
              <Tooltip 
                formatter={formatTooltip}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              {cryptos.map((crypto) => (
                <Line
                  key={crypto.symbol}
                  type="monotone"
                  dataKey={crypto.symbol}
                  stroke={crypto.color}
                  strokeWidth={2}
                  dot={false}
                  name={crypto.name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default MarketChart

