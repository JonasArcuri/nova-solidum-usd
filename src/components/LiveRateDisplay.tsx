import { useState, useEffect, useCallback, useRef } from 'react'
import './LiveRateDisplay.css'

interface LiveRateDisplayProps {
  className?: string
}

/**
 * Componente que exibe cotação USD-BRL em tempo quase real
 * com animação suave e interpolação visual entre valores reais
 * (estratégia similar ao TradingView para FX)
 */
const LiveRateDisplay = ({ className = '' }: LiveRateDisplayProps) => {
  const [displayValue, setDisplayValue] = useState<number>(0)
  const [realValue, setRealValue] = useState<number>(0)
  const [isRising, setIsRising] = useState<boolean>(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const previousValueRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const animationStartTimeRef = useRef<number>(0)
  const animationStartValueRef = useRef<number>(0)
  const animationTargetValueRef = useRef<number>(0)

  const ANIMATION_DURATION = 600 // Duração da animação em ms (suave)
  const eventSourceRef = useRef<EventSource | null>(null)

  /**
   * Conecta ao stream SSE para receber atualizações em tempo real
   */
  const connectToStream = useCallback(() => {
    // Fechar conexão anterior se existir
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      // Conectar ao endpoint SSE
      const eventSource = new EventSource('/api/stream-rates')
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          // Ignorar heartbeats
          if (event.data.trim() === ': heartbeat') {
            return
          }

          const data = JSON.parse(event.data)
          const rate = parseFloat(data.rate)

          if (!isNaN(rate) && rate > 0) {
            // Detectar se está subindo ou descendo
            if (previousValueRef.current > 0) {
              const change = rate - previousValueRef.current
              setIsRising(change >= 0)
            }

            // Atualizar valor real (força re-render e animação)
            setRealValue(rate)
            previousValueRef.current = rate
            setLoading(false)
            setError(null)
          }
        } catch (err) {
          console.error('Erro ao processar mensagem SSE:', err)
        }
      }

      eventSource.onerror = (error) => {
        console.error('Erro na conexão SSE:', error)
        setError('Erro na conexão em tempo real')
        
        // Tentar reconectar após 3 segundos
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            connectToStream()
          }
        }, 3000)
      }

      eventSource.onopen = () => {
        setError(null)
        setLoading(false)
      }
    } catch (err) {
      setError('Não foi possível conectar ao stream em tempo real')
      setLoading(false)
    }
  }, [])

  /**
   * Anima o valor de displayValue até realValue
   * Usa requestAnimationFrame para animação suave
   */
  const animateToValue = useCallback((targetValue: number) => {
    // Cancelar animação anterior se existir
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animationStartValueRef.current = displayValue
    animationTargetValueRef.current = targetValue
    animationStartTimeRef.current = Date.now()
    setIsAnimating(true)

    const animate = () => {
      const now = Date.now()
      const elapsed = now - animationStartTimeRef.current
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1)

      // Easing function (ease-out) para animação suave
      const easeOut = 1 - Math.pow(1 - progress, 3)

      // Interpolar entre valor inicial e target
      const currentValue =
        animationStartValueRef.current +
        (animationTargetValueRef.current - animationStartValueRef.current) * easeOut

      setDisplayValue(currentValue)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Garantir que o valor final seja exatamente o valor real
        setDisplayValue(targetValue)
        setIsAnimating(false)
        animationFrameRef.current = null
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [displayValue])

  /**
   * Quando realValue muda, inicia animação
   */
  useEffect(() => {
    if (realValue > 0) {
      const difference = Math.abs(realValue - displayValue)
      // Animar se houver diferença significativa ou se displayValue ainda é 0
      if (difference > 0.0001 || displayValue === 0) {
        animateToValue(realValue)
      }
    }
  }, [realValue, animateToValue, displayValue])

  /**
   * Conecta ao stream SSE para receber atualizações em tempo real
   */
  useEffect(() => {
    // Conectar ao stream SSE
    connectToStream()

    return () => {
      // Fechar conexão SSE ao desmontar
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [connectToStream])

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'decimal',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(value)
  }

  if (loading && displayValue === 0) {
    return (
      <div className={`live-rate-display ${className}`}>
        <div className="loading">Carregando cotação...</div>
      </div>
    )
  }

  if (error && displayValue === 0) {
    return (
      <div className={`live-rate-display ${className}`}>
        <div className="error">{error}</div>
      </div>
    )
  }

  return (
    <div className={`live-rate-display ${className}`}>
      <div
        className={`rate-value ${isRising ? 'rising' : 'falling'} ${isAnimating ? 'animating' : ''}`}
      >
        {formatCurrency(displayValue)}
        <span className="currency-label"> BRL</span>
      </div>
      {isAnimating && (
        <div className={`pulse-indicator ${isRising ? 'pulse-up' : 'pulse-down'}`} />
      )}
    </div>
  )
}

export default LiveRateDisplay

