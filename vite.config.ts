import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Plugin para excluir a pasta api do processamento
const excludeApiPlugin = () => {
  return {
    name: 'exclude-api',
    resolveId(id: string) {
      if (id.includes('/api/') || id.includes('\\api\\')) {
        return { id, external: true }
      }
    },
    load(id: string) {
      if (id.includes('/api/') || id.includes('\\api\\')) {
        return null
      }
    }
  }
}

// Plugin para criar proxy da API em desenvolvimento
const apiProxyPlugin = () => {
  return {
    name: 'api-proxy',
    configureServer(server: any) {
      // Registrar o middleware antes de outros middlewares do Vite
      server.middlewares.use('/api/rates', async (req: any, res: any, next: any) => {
        if (req.method === 'GET' || req.method === 'OPTIONS') {
          if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            res.statusCode = 204
            res.end()
            return
          }
          
          try {
            const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL')
            
            if (!response.ok) {
              throw new Error(`API retornou status ${response.status}`)
            }
            
            const data = await response.json()
            
            if (!data || !data.USDBRL || !data.USDBRL.bid) {
              throw new Error('Formato de resposta inválido da API')
            }
            
            const usdToBrl = parseFloat(data.USDBRL.bid)
            
            if (isNaN(usdToBrl)) {
              throw new Error('Valor de cotação inválido')
            }
            
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
            res.statusCode = 200
            res.end(JSON.stringify({
              usdToBrl,
              usdtPrice: 1.0,
              source: 'awesomeapi+coingecko'
            }))
          } catch (error) {
            console.error('Erro no proxy da API:', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(JSON.stringify({ 
              error: 'Falha ao buscar cotacoes',
              message: error instanceof Error ? error.message : 'Erro desconhecido'
            }))
          }
        } else {
          next()
        }
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [excludeApiPlugin(), apiProxyPlugin(), react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    watch: {
      ignored: ['**/api/**']
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})

