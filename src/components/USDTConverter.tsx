import { useState, useEffect } from 'react'
import './USDTConverter.css'

interface ExchangeRates {
  usdToBrl: number
  usdtWithSpread: number
  spread: number
}

const DEFAULT_SPREAD = 0.70 // 0.70% de spread padrão

const USDTConverter = () => {
  const [rates, setRates] = useState<ExchangeRates | null>(null)
  const [previousRate, setPreviousRate] = useState<number>(0)
  const [isRising, setIsRising] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [spread, setSpread] = useState<number>(DEFAULT_SPREAD)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchRates = async () => {
    try {
      setError(null)

      // Buscar cotação USD/BRL diretamente na AwesomeAPI (já com CORS liberado)
      const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL')

      if (!response.ok) {
        throw new Error('Erro ao buscar cotação USD/BRL')
      }

      const usdBrlData = await response.json()
      const usdToBrl = parseFloat(usdBrlData.USDBRL.bid)

      // Detectar se está subindo ou descendo
      if (previousRate > 0) {
        const isRisingNow = usdToBrl >= previousRate
        setIsRising(isRisingNow)
      }
      setPreviousRate(usdToBrl)

      // Calcular spread com valor do estado (sobre o USD/BRL)
      const spreadMultiplier = 1 + (spread / 100)
      const usdtWithSpread = usdToBrl * spreadMultiplier

      setRates({
        usdToBrl,
        usdtWithSpread,
        spread,
      })

      setLastUpdate(new Date())
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados')
      setLoading(false)
    }
  }

  // Buscar cotação da API periodicamente com intervalo dinâmico
  useEffect(() => {
    fetchRates()
    
    // Intervalo dinâmico: 3s para subida, 10s para descida
    const intervalTime = isRising ? 3000 : 10000
    const interval = setInterval(fetchRates, intervalTime)
    
    return () => clearInterval(interval)
  }, [isRising])

  const formatCurrency = (value: number, decimals: number = 4): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }

  // Recalcular USDT com spread quando o spread mudar
  useEffect(() => {
    if (rates && rates.usdToBrl) {
      const spreadMultiplier = 1 + (spread / 100)
      const usdtWithSpread = rates.usdToBrl * spreadMultiplier
      
      setRates(prevRates => {
        if (!prevRates) return null
        return {
          ...prevRates,
          usdtWithSpread,
          spread
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spread])

  if (loading && !rates) {
    return (
      <div className="converter-container">
        <div className="loading">Carregando cotação...</div>
      </div>
    )
  }

  if (error && !rates) {
    return (
      <div className="converter-container">
        <div className="error">
          <p>Erro ao carregar dados</p>
          <button onClick={fetchRates} className="retry-button">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="converter-container">
      <div className="converter-intro">
        <h2 className="converter-title">Cotação USDT em Tempo Real</h2>
        <p className="converter-subtitle">A ponte entre o real e o digital</p>
      </div>
      
      <div className="converter-card">
        <div className="rates-grid">
          <div className="rate-item">
            <div className="rate-header">
              <span className="rate-icon">%</span>
              <label>Spread</label>
            </div>
            <div className="spread-input-container">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={spread}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  setSpread(value)
                }}
                className="spread-input"
              />
              <span className="spread-suffix">%</span>
            </div>
            <div className="rate-info">Taxa de conversão</div>
          </div>
        </div>

        <div className="result-section">
          <div className="result-header">
            <label>Cotação</label>
            <span className="result-badge">Com spread aplicado</span>
          </div>
          <div className="result-value-container">
            <img 
              src="/imgs/Thether-coin.png" 
              alt="USDT" 
              className="result-icon-image"
            />
            <div className="result-value">
              {rates ? formatCurrency(rates.usdtWithSpread, 4) : 'R$ 0,0000'}
            </div>
          </div>
        </div>

        {lastUpdate && (
          <div className="last-update">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  )
}

export default USDTConverter

