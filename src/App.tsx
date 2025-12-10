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
            </div>
          </div>
        </div>
      </header>
      
      <main className="main">
        <div className="container">
          <USDTConverter />
          <USDChart />
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-links">
            <p>© 2025 Nova Solidum Finances LTDA. Todos os direitos reservados | <a href="#">Termos de Uso</a> | <a href="#">Políticas de Compliance</a> | <a href="#">Suporte</a></p>
          </div>
          
          <div className="footer-disclaimer">
            <p>
              <strong>Disclaimer</strong> - A Nova Solidum Finances é uma Prestadora de Serviços de Ativos Virtuais (PSAV), constituída no território brasileiro, inscrita no CNPJ sob o nº 63.010.454/0001-63, com a finalidade de prestar serviços de intermediação em operações com ativos virtuais — compreendendo compra e/ou venda de criptoativos. A empresa é classificada como intermediária, nos termos da Consulta Pública nº 109/2024 do Banco Central do Brasil. O licenciamento junto ao Banco Central será requerido tão logo o regulador inicie a fase de adequação legal, etapa que, até o presente momento, ainda não foi formalmente implementada. Não há necessidade de registro da CVM, uma vez que não se trata de operações/serviços com valores mobiliários.
            </p>
          </div>

          <div className="footer-logo">
            <img 
              src="/imgs/Nova.jpeg" 
              alt="Nova Solidum Finances" 
              className="footer-logo-image"
            />
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

