import { useState, useEffect, useCallback, useRef } from 'react'

export interface CandlestickData {
  time: number // timestamp
  open: number
  high: number
  low: number
  close: number
  date: string // formato legível
}

// Intervalo para formar candles (em segundos)
export type CandleInterval = 60 | 300 | 900 | 3600 // 1min, 5min, 15min, 1h

const DEFAULT_INTERVAL: CandleInterval = 60 // 1 minuto por padrão
const MAX_CANDLES = 100 // Limitar quantidade de candles para performance

/**
 * Hook para gerenciar dados de candles USD-BRL
 * Reutiliza a API já consumida no projeto (AwesomeAPI)
 */
export const useUsdBrlCandles = (interval: CandleInterval = DEFAULT_INTERVAL) => {
  const [candles, setCandles] = useState<CandlestickData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  
  const currentCandleRef = useRef<{
    time: number
    open: number
    high: number
    low: number
    close: number
  } | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Converte um tick em candle ou atualiza candle atual
   */
  const processTick = useCallback((bid: number, ask: number, timestamp: number) => {
    const price = (bid + ask) / 2 // Preço médio entre bid e ask
    const candleStartTime = Math.floor(timestamp / (interval * 1000)) * (interval * 1000)

    // Se é um novo período de candle
    if (!currentCandleRef.current || currentCandleRef.current.time !== candleStartTime) {
      // Finalizar candle anterior se existir
      if (currentCandleRef.current) {
        setCandles(prev => {
          const newCandles = [...prev, {
            time: currentCandleRef.current!.time,
            open: currentCandleRef.current!.open,
            high: currentCandleRef.current!.high,
            low: currentCandleRef.current!.low,
            close: currentCandleRef.current!.close,
            date: new Date(currentCandleRef.current!.time).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          }]
          
          // Limitar quantidade de candles
          if (newCandles.length > MAX_CANDLES) {
            return newCandles.slice(-MAX_CANDLES)
          }
          return newCandles
        })
      }

      // Iniciar novo candle
      currentCandleRef.current = {
        time: candleStartTime,
        open: price,
        high: price,
        low: price,
        close: price
      }
    } else {
      // Atualizar candle atual
      if (currentCandleRef.current) {
        currentCandleRef.current.high = Math.max(currentCandleRef.current.high, price)
        currentCandleRef.current.low = Math.min(currentCandleRef.current.low, price)
        currentCandleRef.current.close = price
      }
    }

    setCurrentPrice(price)
  }, [interval])

  /**
   * Busca cotação da API (reutiliza endpoint já usado no projeto)
   */
  const fetchTick = useCallback(async () => {
    try {
      setError(null)

      const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL')

      if (!response.ok) {
        throw new Error('Erro ao buscar cotação USD/BRL')
      }

      const data = await response.json()
      const bid = parseFloat(data.USDBRL.bid)
      const ask = parseFloat(data.USDBRL.ask)
      const timestamp = Date.now()

      // Processar tick e formar/atualizar candle
      processTick(bid, ask, timestamp)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados')
      setLoading(false)
    }
  }, [processTick])

  /**
   * Inicia polling para buscar ticks
   */
  useEffect(() => {
    // Buscar imediatamente
    fetchTick()

    // Polling a cada 1000ms (1 segundo)
    intervalRef.current = setInterval(fetchTick, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchTick])

  /**
   * Retorna candle atual (ainda em formação)
   */
  const getCurrentCandle = useCallback((): CandlestickData | null => {
    if (!currentCandleRef.current) return null

    return {
      ...currentCandleRef.current,
      date: new Date(currentCandleRef.current.time).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }, [])

  return {
    candles,
    currentCandle: getCurrentCandle(),
    currentPrice,
    loading,
    error,
    refetch: fetchTick
  }
}

