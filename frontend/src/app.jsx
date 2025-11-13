import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ethers } from 'ethers';
import './App.css';

// Import contract addresses and ABIs
import { CREDIT_SCORING_ABI, MARKETPLACE_ABI } from './contracts/abi';
import { CREDIT_SCORING_ADDRESS, MARKETPLACE_ADDRESS } from './contract-addresses';

// Environment variables
const APP_NAME = import.meta.env.VITE_APP_NAME || 'FHE CreditGuard';
const APP_DESCRIPTION = import.meta.env.VITE_APP_DESCRIPTION || 'Confidential Credit Scoring Protocol';

function App() {
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [network, setNetwork] = useState('');

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsLoading(true);
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setAccount(accounts[0]);
        setIsConnected(true);
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        setNetwork(network.name);
        
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Error connecting wallet. Please make sure MetaMask is installed and unlocked.');
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('Please install MetaMask to use this dApp!');
    }
  };

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        });
        setNetwork('sepolia');
      } catch (error) {
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Test Network',
                  rpcUrls: ['https://sepolia.infura.io/v3/'],
                  nativeCurrency: {
                    name: 'Sepolia ETH',
                    symbol: 'sepETH',
                    decimals: 18,
                  },
                  blockExplorerUrls: ['https://sepolia.etherscan.io'],
                },
              ],
            });
            setNetwork('sepolia');
          } catch (addError) {
            console.error('Error adding network:', addError);
            alert('Error adding Sepolia network. Please add it manually in MetaMask.');
          }
        }
        console.error('Error switching network:', error);
      }
    }
  };

  return (
    <Router>
      <div className="App">
        <header className="header">
          <div className="logo-section">
            <h1>⚡ {APP_NAME}</h1>
            <p>Confidential Credit Scoring on Blockchain</p>
          </div>
          
          <div className="wallet-section">
            {isConnected ? (
              <>
                <div className="user-type-toggle">
                  <button className="toggle-btn active">
                    👤 Borrower
                  </button>
                  <button className="toggle-btn">
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
                  {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connected'}
                </div>
              </>
            ) : (
              <button 
                onClick={connectWallet} 
                className="connect-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Connecting...' : '🦊 Connect Wallet'}
              </button>
            )}
          </div>
        </header>
        
        <main className="main-content">
          {!isConnected ? (
            <div className="dashboard welcome-dashboard">
              <div className="welcome-content">
                <h1>Welcome to {APP_NAME}</h1>
                <p className="welcome-subtitle">
                  {APP_DESCRIPTION}
                </p>
                
                <div className="feature-grid">
                  <div className="feature-card">
                    <div className="feature-icon">🔒</div>
                    <h3>Complete Privacy</h3>
                    <p>Your financial data is encrypted and never exposed to anyone</p>
                  </div>
                  
                  <div className="feature-card">
                    <div className="feature-icon">⚡</div>
                    <h3>Instant Verification</h3>
                    <p>Lenders can check qualifications without seeing your data</p>
                  </div>
                  
                  <div className="feature-card">
                    <div className="feature-icon">🌐</div>
                    <h3>Decentralized</h3>
                    <p>Built on blockchain for transparency and security</p>
                  </div>
                  
                  <div className="feature-card">
                    <div className="feature-icon">💸</div>
                    <h3>Loan Marketplace</h3>
                    <p>Access multiple loan offers with your confidential score</p>
                  </div>
                </div>

                <div className="connection-section">
                  <button onClick={connectWallet} className="connect-btn large">
                    🦊 Connect MetaMask
                  </button>
                  <button onClick={switchNetwork} className="network-btn">
                    🌐 Switch to Sepolia
                  </button>
                  <p className="network-info">
                    {network ? `Currently on: ${network}` : 'Please connect to Sepolia Test Network'}
                  </p>
                </div>

                <div className="demo-info">
                  <h3>🚀 How It Works</h3>
                  <ol>
                    <li><strong>Connect Wallet:</strong> Link your MetaMask wallet to the dApp</li>
                    <li><strong>Switch Network:</strong> Ensure you're on Sepolia test network</li>
                    <li><strong>Submit Data:</strong> Encrypt and submit your financial information</li>
                    <li><strong>Get Offers:</strong> Receive confidential loan offers from lenders</li>
                    <li><strong>Stay Private:</strong> Your data remains encrypted throughout the process</li>
                  </ol>
                </div>

                <div className="tech-stack">
                  <h4>🛠️ Powered By</h4>
                  <div className="tech-items">
                    <div className="tech-item">
                      <span className="tech-icon">⚡</span>
                      <span>FHE Encryption</span>
                    </div>
                    <div className="tech-item">
                      <span className="tech-icon">🔗</span>
                      <span>Ethereum Blockchain</span>
                    </div>
                    <div className="tech-item">
                      <span className="tech-icon">🛡️</span>
                      <span>Zero-Knowledge Proofs</span>
                    </div>
                    <div className="tech-item">
                      <span className="tech-icon">🌐</span>
                      <span>Sepolia Testnet</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="dashboard">
              <h2>🎉 Successfully Connected!</h2>
              <p>Your wallet is connected to FHE CreditGuard.</p>
              <div style={{ 
                background: '#2a2a2a', 
                padding: '2rem', 
                borderRadius: '12px', 
                margin: '2rem 0',
                border: '1px solid #444'
              }}>
                <h3 style={{ color: '#FFD700' }}>Next Steps:</h3>
                <ul style={{ textAlign: 'left', margin: '1rem 0' }}>
                  <li>Make sure you're on Sepolia testnet</li>
                  <li>Get test ETH from a Sepolia faucet</li>
                  <li>Start using the confidential credit scoring features</li>
                </ul>
                <p style={{ marginTop: '1rem', color: '#888' }}>
                  Connected: {account}
                </p>
              </div>
            </div>
          )}
        </main>

        <footer className="app-footer">
          <div className="footer-content">
            <p>
              <strong>⚡ {APP_NAME}</strong> - {APP_DESCRIPTION}
            </p>
            <p>
              🔐 Built with FHE Technology • 🌐 Deployed on Sepolia
            </p>
            <div className="footer-links">
              <a href="https://github.com/Ubuntu1235/fhe-creditguard" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="https://docs.zama.org" target="_blank" rel="noopener noreferrer">Documentation</a>
              <a href="https://sepolia.etherscan.io" target="_blank" rel="noopener noreferrer">Etherscan</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
