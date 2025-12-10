import './App.css'
import USDTConverter from './components/USDTConverter'
import USDChart from './components/USDChart'

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <img 
              src="/imgs/Nova-Solidum.png" 
              alt="Nova Solidum Finances" 
              className="logo-image"
            />
            <div className="header-text">
              <h1 className="logo">Nova Solidum</h1>
              <p className="tagline">Somos a ponte entre o real e o digital. Transformando ativos digitais em soluções reais para o seu dia a dia.</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="main">
        <div className="container">
          <USDChart />
          <USDTConverter />
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>© 2025 Nova Solidum Finances LTDA. Todos os direitos reservados</p>
          <p className="update-info">Atualização automática a cada 15s • Powered by CoinGecko</p>
        </div>
      </footer>
    </div>
  )
}

export default App

