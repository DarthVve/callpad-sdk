import './Header.css'

export function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">CallPad SDK Demo</h1>
        <div className="header-info">
          <span className="status">Ready to connect</span>
        </div>
      </div>
    </header>
  )
}