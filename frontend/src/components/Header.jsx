import React from 'react';

const Header = ({ account, connectWallet, userType, setUserType, isConnected, switchNetwork, network, appName }) => {
  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="header">
      <div className="logo-section">
        <h1>⚡ {appName}</h1>
        <p>Confidential Credit Scoring on Blockchain</p>
      </div>
      
      <div className="wallet-section">
        {isConnected ? (
          <>
            <div className="user-type-toggle">
              <button 
                className={`toggle-btn ${userType === 'user' ? 'active' : ''}`}
                onClick={() => setUserType('user')}
              >
                👤 Borrower
              </button>
              <button 
                className={`toggle-btn ${userType === 'lender' ? 'active' : ''}`}
                onClick={() => setUserType('lender')}
              >
                🏦 Lender
              </button>
            </div>
            
            <button 
              onClick={switchNetwork}
              className="network-btn"
              title="Switch to Sepolia Network"
            >
              🌐 {network || 'Network'}
            </button>
            
            <div className="account-info" title="Connected Wallet Address">
              {shortenAddress(account)}
            </div>
          </>
        ) : (
          <button onClick={connectWallet} className="connect-btn">
            🦊 Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
