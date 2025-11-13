import React, { useState } from 'react';

const Marketplace = ({ marketplaceContract, account }) => {
  const [loanOffers, setLoanOffers] = useState([]);

  const loadLoanOffers = async () => {
    // Mock data for now - will be replaced with blockchain calls
    const mockOffers = [
      {
        id: 1,
        lender: '0x742...d35a',
        amount: '1.5',
        minCreditScore: 650,
        interestRate: 500
      },
      {
        id: 2,
        lender: '0x8a3...f92b',
        amount: '2.0',
        minCreditScore: 700,
        interestRate: 300
      }
    ];
    setLoanOffers(mockOffers);
  };

  const applyForLoan = async (offerId) => {
    alert(`Loan application for offer #${offerId} will be implemented with blockchain integration`);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 Loan Marketplace</h2>
        <p>Browse available loan offers and apply confidentially.</p>
      </div>

      <div className="section-actions">
        <button onClick={loadLoanOffers} className="refresh-btn">
          🔄 Load Loan Offers
        </button>
      </div>

      {loanOffers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h4>No Loan Offers Available</h4>
          <p>Click the button above to load sample loan offers, or create your own as a lender.</p>
        </div>
      ) : (
        <div className="loan-offers">
          {loanOffers.map((offer) => (
            <div key={offer.id} className="loan-offer-card">
              <h4>Loan Offer #{offer.id}</h4>
              
              <div className="offer-details">
                <div className="detail-item">
                  <span className="detail-label">Loan Amount</span>
                  <span className="detail-value">
                    {offer.amount} ETH
                  </span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Min Credit Score</span>
                  <span className="detail-value">{offer.minCreditScore}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Interest Rate</span>
                  <span className="detail-value">
                    {(offer.interestRate / 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              <button 
                onClick={() => applyForLoan(offer.id)}
                className="apply-btn"
              >
                📝 Apply for Loan
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
