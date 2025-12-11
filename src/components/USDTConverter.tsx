import { useState, useEffect } from 'react'
import './USDTConverter.css'

interface ExchangeRates {
  usdtPrice: number
  usdToBrl: number
  usdtWithSpread: number
  spread: number
}

const DEFAULT_SPREAD = 0.70 // 0.70% de spread padrão
const UPDATE_INTERVAL = 15000 // 15 segundos

const USDTConverter = () => {
  const [rates, setRates] = useState<ExchangeRates | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [spread, setSpread] = useState<number>(DEFAULT_SPREAD)

  const fetchRates = async () => {
    try {
      setError(null)
      
      // Buscar preço do USDT em USD e BRL em uma única chamada (CoinGecko)
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd,brl'
      )
      
      if (!response.ok) {
        throw new Error('Erro ao buscar cotação')
      }
      
      const data = await response.json()
      const usdtPrice = data.tether.usd
      const usdToBrl = data.tether.brl

      // Calcular spread com valor do estado
      const spreadMultiplier = 1 + (spread / 100)
      const usdtWithSpread = usdToBrl * spreadMultiplier

      setRates({
        usdtPrice,
        usdToBrl,
        usdtWithSpread,
        spread
      })
      
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados')
      setLoading(false)
    }
  }

  // Buscar cotação da API periodicamente
  useEffect(() => {
    fetchRates()
    
    const interval = setInterval(fetchRates, UPDATE_INTERVAL)
    
    return () => clearInterval(interval)
  }, [])

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
              <img 
                src="/imgs/Thether-coin.png" 
                alt="USDT" 
                className="rate-icon-image"
              />
              <label>USDT → BRL</label>
            </div>
            <div className="rate-value">
              {rates ? formatCurrency(rates.usdToBrl, 4) : '--'}
            </div>
            <div className="rate-info">Cotação atual do mercado</div>
          </div>

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
            <label>Valor Final</label>
            <span className="result-badge">Com spread aplicado</span>
          </div>
          <div className="result-value">
            {rates ? formatCurrency(rates.usdtWithSpread, 4) : 'R$ 0,0000'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default USDTConverter

