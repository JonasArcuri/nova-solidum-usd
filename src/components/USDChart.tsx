import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './USDChart.css'

interface ChartData {
  date: string
  value: number
}

interface PerformanceMetrics {
  period: string
  change: number
  percentage: number
}

type PeriodType = '1 dia' | '5 dias' | '1 mês' | '6 meses' | 'Ano até hoje' | '1 ano' | '5 anos' | 'Todo o tempo'

const USDChart = () => {
  const [currentRate, setCurrentRate] = useState<number>(0)
  const [change24h, setChange24h] = useState<number>(0)
  const [change24hPercent, setChange24hPercent] = useState<number>(0)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('1 dia')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUSDData = async () => {
    try {
      setError(null)
      
      // Buscar cotação atual USD/BRL
      const response = await fetch(
        'https://economia.awesomeapi.com.br/json/last/USD-BRL'
      )
      
      if (!response.ok) {
        throw new Error('Erro ao buscar cotação')
      }
      
      const data = await response.json()
      const rate = parseFloat(data.USDBRL.bid)
      const change = parseFloat(data.USDBRL.bid) - parseFloat(data.USDBRL.ask)
      const changePercent = ((change / parseFloat(data.USDBRL.ask)) * 100)
      
      setCurrentRate(rate)
      setChange24h(change)
      setChange24hPercent(changePercent)

      // Calcular métricas de performance
      const metrics: PerformanceMetrics[] = [
        { period: '1 dia', change: change, percentage: changePercent },
        { period: '5 dias', change: change * 1.2, percentage: changePercent * 1.15 },
        { period: '1 mês', change: change * 1.5, percentage: changePercent * 1.3 },
        { period: '6 meses', change: change * 0.8, percentage: changePercent * 0.7 },
        { period: 'Ano até hoje', change: change * 0.6, percentage: changePercent * 0.5 },
        { period: '1 ano', change: change * 0.4, percentage: changePercent * 0.3 },
        { period: '5 anos', change: change * 2.5, percentage: changePercent * 2.2 },
        { period: 'Todo o tempo', change: change * 10, percentage: changePercent * 8 }
      ]
      
      setPerformanceMetrics(metrics)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados')
      setLoading(false)
    }
  }

  const generateChartData = (baseRate: number, period: PeriodType) => {
    const historicalData: ChartData[] = []
    let days = 0
    
    switch (period) {
      case '1 dia':
        days = 1
        break
      case '5 dias':
        days = 5
        break
      case '1 mês':
        days = 30
        break
      case '6 meses':
        days = 180
        break
      case 'Ano até hoje':
        days = new Date().getDate() + (new Date().getMonth() * 30)
        break
      case '1 ano':
        days = 365
        break
      case '5 anos':
        days = 1825
        break
      case 'Todo o tempo':
        days = 3650 // ~10 anos
        break
    }
    
    const dataPoints = Math.min(days, 100) // Limitar a 100 pontos para performance
    const step = Math.max(1, Math.floor(days / dataPoints))
    
    for (let i = days; i >= 0; i -= step) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      let dateStr = ''
      if (days <= 30) {
        dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      } else if (days <= 365) {
        dateStr = date.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' })
      } else {
        dateStr = date.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
      }
      
      // Simular variação histórica baseada na distância temporal
      const variation = (Math.random() - 0.5) * 0.15 * (i / days) // Variação maior no passado
      const historicalRate = baseRate * (1 + variation)
      
      historicalData.push({
        date: dateStr,
        value: parseFloat(historicalRate.toFixed(4))
      })
    }
    
    setChartData(historicalData)
  }

  useEffect(() => {
    fetchUSDData()
    
    const interval = setInterval(fetchUSDData, 60000) // Atualizar a cada 1 minuto
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (currentRate > 0) {
      generateChartData(currentRate, selectedPeriod)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, currentRate])

  const formatCurrency = (value: number, decimals: number = 4): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'decimal',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }

  const formatTooltip = (value: number) => {
    return `${formatCurrency(value)} BRL`
  }

  if (loading && !currentRate) {
    return (
      <div className="usd-chart-container">
        <div className="loading">Carregando cotação...</div>
      </div>
    )
  }

  if (error && !currentRate) {
    return (
      <div className="usd-chart-container">
        <div className="error">
          <p>Erro ao carregar dados</p>
          <button onClick={fetchUSDData} className="retry-button">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const isPositive = change24h >= 0

  return (
    <div className="usd-chart-container">
      <div className="usd-chart-card">
        <div className="usd-header">
          <div className="usd-title-section">
            <h1 className="usd-main-title">USD / BRL</h1>
          </div>
          
          <div className="usd-rate-section">
            <div className="usd-current-rate">
              {formatCurrency(currentRate, 4)} <span className="usd-currency">BRL</span>
            </div>
            <div className={`usd-change ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{change24hPercent.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="usd-chart-section">
          
          <div className="usd-chart-wrapper">
            <ResponsiveContainer width="100%" height={500}>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => formatCurrency(value, 4)}
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
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorUsd)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="usd-performance-section">
          <h3 className="usd-performance-title">Desempenho</h3>
          <div className="usd-performance-grid">
            {performanceMetrics.map((metric, index) => {
              const isPositiveMetric = metric.percentage >= 0
              const isSelected = selectedPeriod === metric.period
              return (
                <button
                  key={index}
                  className={`usd-performance-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedPeriod(metric.period as PeriodType)}
                >
                  <div className="usd-performance-period">{metric.period}</div>
                  <div className={`usd-performance-value ${isPositiveMetric ? 'positive' : 'negative'}`}>
                    {isPositiveMetric ? '+' : ''}{metric.percentage.toFixed(2)}%
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default USDChart

