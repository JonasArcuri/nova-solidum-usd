# Nova Solidum - Cotação USDT

Site de cotação de USDT para BRL com spread de 0.70%, desenvolvido com React + Vite + TypeScript.

## 🚀 Tecnologias

- **React 18** - Biblioteca JavaScript para construção de interfaces
- **Vite** - Build tool e dev server
- **TypeScript** - Tipagem estática
- **CoinGecko API** - Para buscar cotações de criptomoedas

## 📋 Funcionalidades

- ✅ Cotação em tempo real de USDT → BRL
- ✅ Cálculo automático de spread de 0.70%
- ✅ Atualização automática a cada 15 segundos
- ✅ Design responsivo (desktop e mobile)
- ✅ Interface limpa e funcional
- ✅ Identidade visual Nova Solidum

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 📝 Configurações

- **Spread**: 0.70% (configurável em `src/components/USDTConverter.tsx`)
- **Intervalo de atualização**: 15 segundos
- **Casas decimais**: 2 (formatação BRL)

## 🎨 Design

O design segue a identidade visual da Nova Solidum Finances, com:
- Paleta de cores escura e moderna
- Gradientes sutis
- Tipografia limpa e legível
- Layout responsivo e otimizado

## 📱 Responsividade

O site é totalmente responsivo e funciona perfeitamente em:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (até 767px)

## 🔗 APIs Utilizadas

- **CoinGecko API**: Para buscar preços de USDT e conversão USD/BRL
  - Endpoint USDT: `https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd`
  - Endpoint BRL: `https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=brl`

## 📄 Licença

© 2025 Nova Solidum Finances LTDA. Todos os direitos reservados.

