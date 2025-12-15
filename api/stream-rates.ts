import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Endpoint Server-Sent Events (SSE) para streaming de cotações USD/BRL em tempo real
 * Compatível com Vercel Serverless Functions
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar headers para SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  // Função para buscar cotação
  const fetchRate = async (): Promise<number | null> => {
    try {
      // Tentar ExchangeRate-API primeiro
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          const rate = parseFloat(data.rates.BRL)
          if (!isNaN(rate) && rate > 0) {
            return rate
          }
        }
      } catch {
        // Continuar para fallback
      }

      // Fallback para AwesomeAPI
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', {
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        const rate = parseFloat(data.USDBRL.bid)
        if (!isNaN(rate) && rate > 0) {
          return rate
        }
      }
    } catch (error) {
      console.error('Erro ao buscar cotação:', error)
    }
    return null
  }

  // Enviar dados iniciais
  const sendData = (rate: number) => {
    res.write(`data: ${JSON.stringify({ rate, timestamp: Date.now() })}\n\n`)
  }

  // Enviar heartbeat para manter conexão viva
  const sendHeartbeat = () => {
    res.write(': heartbeat\n\n')
  }

  // Buscar e enviar cotação inicial
  const initialRate = await fetchRate()
  if (initialRate) {
    sendData(initialRate)
  }

  // Configurar intervalo para atualizações (500ms)
  const interval = setInterval(async () => {
    try {
      const rate = await fetchRate()
      if (rate !== null) {
        sendData(rate)
      }
    } catch (error) {
      console.error('Erro no intervalo:', error)
    }
  }, 500)

  // Enviar heartbeat a cada 30 segundos
  const heartbeatInterval = setInterval(() => {
    sendHeartbeat()
  }, 30000)

  // Limpar quando cliente desconectar
  req.on('close', () => {
    clearInterval(interval)
    clearInterval(heartbeatInterval)
    res.end()
  })
}

