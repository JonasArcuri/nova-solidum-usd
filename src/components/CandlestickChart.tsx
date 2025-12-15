import { useMemo } from 'react'
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { useUsdBrlCandles } from '../hooks/useUsdBrlCandles'
import './CandlestickChart.css'

interface CandlestickChartProps {
  interval?: 60 | 300 | 900 | 3600
  height?: number
}

/**
 * Componente de gráfico Candlestick USD-BRL
 * Atualização contínua usando apenas dados reais da API
 */
const CandlestickChart = ({ interval = 60, height = 400 }: CandlestickChartProps) => {
  const { candles, currentCandle, currentPrice, loading, error } = useUsdBrlCandles(interval)

  // Combinar candles completos com candle atual (se existir)
  const chartData = useMemo(() => {
    const data = [...candles]
    
    if (currentCandle) {
      data.push(currentCandle)
    }
    
    return data
  }, [candles, currentCandle])

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'decimal',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(value)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null

    const data = payload[0].payload
    return (
      <div className="candlestick-tooltip">
        <p className="tooltip-label">{data.date}</p>
        <p className="tooltip-item">
          <span className="tooltip-label">Abertura:</span> {formatCurrency(data.open)}
        </p>
        <p className="tooltip-item">
          <span className="tooltip-label">Máxima:</span> {formatCurrency(data.high)}
        </p>
        <p className="tooltip-item">
          <span className="tooltip-label">Mínima:</span> {formatCurrency(data.low)}
        </p>
        <p className="tooltip-item">
          <span className="tooltip-label">Fechamento:</span> {formatCurrency(data.close)}
        </p>
      </div>
    )
  }

  // Renderizar candlesticks customizados
  const renderCandlestick = (props: any) => {
    const { x, y, width, payload } = props
    const candle = payload
    const isBullish = candle.close >= candle.open
    
    // Calcular posições
    const highY = y(candle.high)
    const lowY = y(candle.low)
    const openY = y(candle.open)
    const closeY = y(candle.close)
    
    const bodyTop = Math.min(openY, closeY)
    const bodyBottom = Math.max(openY, closeY)
    const bodyHeight = bodyBottom - bodyTop
    const bodyWidth = width * 0.6
    const bodyX = x + (width - bodyWidth) / 2
    
    const wickX = x + width / 2
    
    return (
      <g>
        {/* Pavio (wick) - linha vertical do high ao low */}
        <line
          x1={wickX}
          y1={highY}
          x2={wickX}
          y2={lowY}
          stroke={isBullish ? '#10b981' : '#ef4444'}
          strokeWidth={1.5}
        />
        {/* Corpo do candle */}
        <rect
          x={bodyX}
          y={bodyTop}
          width={bodyWidth}
          height={Math.max(bodyHeight, 2)}
          fill={isBullish ? '#10b981' : '#ef4444'}
          stroke={isBullish ? '#059669' : '#dc2626'}
          strokeWidth={1}
        />
      </g>
    )
  }

  if (loading && chartData.length === 0) {
    return (
      <div className="candlestick-chart-container">
        <div className="loading">Carregando gráfico...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="candlestick-chart-container">
        <div className="error">Erro ao carregar dados: {error}</div>
      </div>
    )
  }

  return (
    <div className="candlestick-chart-container">
      <div className="candlestick-chart-header">
        <h3>Gráfico Candlestick USD/BRL</h3>
        {currentPrice > 0 && (
          <div className="current-price">
            Preço atual: <strong>{formatCurrency(currentPrice)} BRL</strong>
          </div>
        )}
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={60}
            tickFormatter={(value) => {
              // Formatar para mostrar apenas HH:MM quando disponível
              if (value && typeof value === 'string') {
                const parts = value.split(', ')
                if (parts.length > 1) {
                  return parts[1].substring(0, 5) // Retorna apenas HH:MM
                }
                return value.substring(0, 5)
              }
              return value
            }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Usar Bar para posicionar, mas renderizar customizado */}
          <Bar dataKey="high" fill="transparent" shape={renderCandlestick} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CandlestickChart
