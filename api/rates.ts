import type { VercelRequest, VercelResponse } from '@vercel/node'

// Proxy para buscar cotacoes evitando erros de CORS no frontend
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS basico para todos os navegadores
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Cotacao USD/BRL (AwesomeAPI - mesma fonte usada no grafico)
    const usdBrlResponse = await fetch(
      'https://economia.awesomeapi.com.br/json/last/USD-BRL',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!usdBrlResponse.ok) {
      throw new Error(`API retornou status ${usdBrlResponse.status}`)
    }

    const usdBrlData = await usdBrlResponse.json()

    // Verificar se a resposta é um array (a API pode retornar array)
    const data = Array.isArray(usdBrlData) ? usdBrlData[0] : usdBrlData

    if (!data || !data.USDBRL || !data.USDBRL.bid) {
      throw new Error('Formato de resposta invalido da API')
    }

    const usdToBrl = parseFloat(String(data.USDBRL.bid))

    if (isNaN(usdToBrl) || usdToBrl <= 0) {
      throw new Error('Valor de cotacao invalido')
    }

    // Cotacao USDT em USD (CoinGecko) apenas como referencia
    let usdtPrice = 1.0
    try {
      const usdtResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd',
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      )

      if (usdtResponse.ok) {
        const usdtData = await usdtResponse.json()
        if (usdtData && usdtData.tether && usdtData.tether.usd) {
          usdtPrice = parseFloat(String(usdtData.tether.usd)) || 1.0
        }
      }
    } catch (err) {
      // Se falhar, mantemos usdtPrice como 1.0
      console.warn('Erro ao buscar USDT price:', err)
    }

    return res.status(200).json({
      usdToBrl,
      usdtPrice,
      source: 'awesomeapi+coingecko',
    })
  } catch (error) {
    console.error('Erro no proxy /api/rates:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Log detalhado para debug no Vercel
    console.error('Detalhes do erro:', {
      message: errorMessage,
      stack: errorStack,
      type: typeof error
    })
    
    return res.status(500).json({ 
      error: 'Falha ao buscar cotacoes',
      message: errorMessage
    })
  }
}

