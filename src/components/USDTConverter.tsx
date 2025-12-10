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
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
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
      
      setLastUpdate(new Date())
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

  const formatCurrency = (value: number, decimals: number = 2): string => {
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
      <div className="converter-card">
        <h2 className="converter-title">Conversor USDT → BRL com spread</h2>
        
        <div className="rates-grid">
          <div className="rate-item">
            <label>Cotação atual (USDT → BRL)</label>
            <div className="rate-value">
              {rates ? formatCurrency(rates.usdToBrl, 2) : '--'}
            </div>
          </div>

          <div className="rate-item">
            <label>Spread (%)</label>
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
          </div>
        </div>

        <div className="result-section">
          <label>USDT com spread</label>
          <div className="result-value">
            {rates ? formatCurrency(rates.usdtWithSpread, 2) : 'R$ 0,00'}
          </div>
        </div>

        {lastUpdate && (
          <div className="last-update">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </div>
        )}
      </div>
    </div>
  )
}

export default USDTConverter

