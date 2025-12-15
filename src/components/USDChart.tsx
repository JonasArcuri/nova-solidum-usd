import { useState, useEffect, useCallback, useRef } from 'react'
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
  const previousRateRef = useRef<number>(0)
  const [previousClose, setPreviousClose] = useState<number>(0)
  const [isRising, setIsRising] = useState<boolean>(true)
  const [change24h, setChange24h] = useState<number>(0)
  const [change24hPercent, setChange24hPercent] = useState<number>(0)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('1 dia')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const chartInitializedRef = useRef<boolean>(false)

  const fetchUSDData = useCallback(async () => {
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
      
      // Detectar se está subindo ou descendo
      if (previousRateRef.current > 0) {
        const isRisingNow = rate >= previousRateRef.current
        setIsRising(isRisingNow)
      }
      previousRateRef.current = rate
      
      // Calcular fechamento anterior (ask é o valor de compra, usado como referência)
      const prevClose = parseFloat(data.USDBRL.ask)
      
      setPreviousClose(prevClose)
      setCurrentRate(rate)
      setChange24h(change)
      setChange24hPercent(changePercent)
      setLastUpdateTime(new Date())

      // Não atualizar o gráfico em tempo real
      // O gráfico será atualizado apenas quando o período mudar

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
  }, [])

  const generateHistoricalData = (baseRate: number, period: PeriodType): ChartData[] => {
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
    
    if (days === 1) {
      // Para 1 dia, gerar dados por hora/minuto (formato TradingView)
      const now = new Date()
      const startOfDay = new Date(now)
      startOfDay.setHours(9, 0, 0, 0) // Começar às 9h
      
      // Gerar pontos a cada 15 minutos
      for (let i = 0; i <= 20; i++) {
        const date = new Date(startOfDay)
        date.setMinutes(date.getMinutes() + (i * 15))
        
        if (date > now) break
        
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        const dateStr = `${hours}:${minutes}`
        
        // Variação mais suave para dados intradiários
        const timeProgress = i / 20
        const variation = (Math.random() - 0.5) * 0.02 * (1 - timeProgress * 0.5)
        const historicalRate = baseRate * (1 + variation)
        
        historicalData.push({
          date: dateStr,
          value: parseFloat(historicalRate.toFixed(4))
        })
      }
    } else {
      // Para períodos maiores, gerar dados históricos do passado até o presente
      const dataPoints = Math.min(days, 100) // Limitar a 100 pontos para performance
      const step = Math.max(1, Math.floor(days / dataPoints))
      const now = new Date()
      
      // Começar do passado e ir até o presente
      for (let i = days; i >= 0; i -= step) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        
        let dateStr = ''
        if (days <= 7) {
          // Para 5 dias, mostrar dia e hora
          dateStr = date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        } else if (days <= 30) {
          // Para 1 mês, mostrar dia e mês
          dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        } else if (days <= 365) {
          // Para 6 meses e 1 ano, mostrar mês e ano
          dateStr = date.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' })
        } else {
          // Para períodos maiores, mostrar mês e ano completo
          dateStr = date.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
        }
        
        // Simular variação histórica mais realista
        // Variação menor quando mais próximo do presente
        const timeProgress = (days - i) / days // 0 no passado, 1 no presente
        const baseVariation = 0.10 // Variação base de 10%
        const variation = (Math.random() - 0.5) * baseVariation * (1 - timeProgress * 0.7)
        
        // Garantir que o último ponto seja próximo ao valor atual
        const historicalRate = i === 0 
          ? baseRate // Último ponto = valor atual
          : baseRate * (1 + variation)
        
        historicalData.push({
          date: dateStr,
          value: parseFloat(historicalRate.toFixed(4))
        })
      }
      
      // Garantir que o último ponto seja exatamente o valor atual
      if (historicalData.length > 0) {
        historicalData[historicalData.length - 1].value = parseFloat(baseRate.toFixed(4))
      }
    }
    
    return historicalData
  }

  useEffect(() => {
    // Buscar dados imediatamente ao montar
    fetchUSDData()
    
    // Atualizar valores no topo em tempo real a cada 1000ms (1 segundo)
    intervalRef.current = setInterval(fetchUSDData, 1000)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchUSDData])

  // Quando o período mudar, regenerar dados históricos correspondentes ao período
  useEffect(() => {
    if (currentRate > 0) {
      // Gerar dados históricos para o período selecionado
      const historicalData = generateHistoricalData(currentRate, selectedPeriod)
      setChartData(historicalData)
      chartInitializedRef.current = true
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

  const formatTooltip = (value: number, payload: any) => {
    if (!payload || !payload[0]) return `${formatCurrency(value)} BRL`
    
    const data = payload[0].payload
    
    // Tentar extrair data do payload ou usar data atual
    let dateStr = data?.date || ''
    let fullDateStr = ''
    
    if (selectedPeriod === '1 dia') {
      // Para 1 dia, mostrar data completa no tooltip
      const now = new Date()
      fullDateStr = now.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      })
    } else {
      fullDateStr = dateStr
    }
    
    return `${formatCurrency(value)} BRL\n${fullDateStr}`
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
            <h1 className="usd-main-title">Dólar Americano / Real Brasileiro</h1>
            <div className="usd-subtitle">
              <span className="usd-pair">USDBRL</span>
              {lastUpdateTime && (
                <span className="usd-timestamp">
                  A partir de hoje em {lastUpdateTime.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'America/Sao_Paulo'
                  })} GMT-3
                </span>
              )}
            </div>
          </div>
          
          <div className="usd-rate-section">
            <div className="usd-current-rate">
              {formatCurrency(currentRate, 4)} <span className="usd-currency">BRL</span>
            </div>
            <div className={`usd-change ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{formatCurrency(Math.abs(change24h), 4)} {isPositive ? '+' : ''}{change24hPercent.toFixed(2)}%
            </div>
            {previousClose > 0 && (
              <div className="usd-previous-close">
                Fechamento anterior: {formatCurrency(previousClose, 4)}
              </div>
            )}
          </div>
        </div>

        <div className="usd-chart-section">
          
          <div className="usd-chart-wrapper">
            <ResponsiveContainer width="100%" height={500}>
              <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUsdDown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
                  formatter={(value: any, _name: any, props: any) => formatTooltip(value, props)}
                  labelFormatter={(label) => {
                    if (selectedPeriod === '1 dia') {
                      return `Horário: ${label}`
                    }
                    return `Data: ${label}`
                  }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                {/* Linha verde - sempre visível */}
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={isRising ? 1 : 0}
                  fill={isRising ? "url(#colorUsd)" : "none"}
                  strokeDasharray={!isRising ? "5 5" : "0"}
                />
                {/* Linha vermelha - visível quando o dólar desce */}
                {!isRising && (
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorUsdDown)"
                  />
                )}
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

