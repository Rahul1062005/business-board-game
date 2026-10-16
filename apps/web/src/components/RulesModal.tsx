import React from 'react';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📖 How to Play Business (Indian Edition)
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          <div>
            <h4 style={{ color: '#f8fafc', fontWeight: 800 }}>1. Turn Flow & Movement</h4>
            <p>Roll two dice to move clockwise around the 36-space Indian board. If you roll doubles, you get another turn! Passing or landing on <strong>Prarambh (Start)</strong> pays ₹200.</p>
          </div>

          <div>
            <h4 style={{ color: '#f8fafc', fontWeight: 800 }}>2. Buying & Color Sets</h4>
            <p>Land on an unowned property to buy it at listed price. Owning all properties in a color set <strong>doubles base rent</strong> immediately!</p>
          </div>

          <div>
            <h4 style={{ color: '#f8fafc', fontWeight: 800 }}>3. Upgrades & Flagship Businesses</h4>
            <p>Once you own a full set (with none mortgaged), build upgrades evenly. You must upgrade all sister properties to Tier 1 before building Tier 2. The 5th and final tier is the <strong>Flagship Business</strong> 👑.</p>
          </div>

          <div>
            <h4 style={{ color: '#f8fafc', fontWeight: 800 }}>4. Mortgaging & Unmortgaging</h4>
            <p>Mortgage any owned property with zero upgrades to receive 50% cash from the bank. Mortgaged properties earn zero rent. Unmortgaging requires paying the mortgage amount + <strong>10% interest</strong>.</p>
          </div>

          <div>
            <h4 style={{ color: '#f8fafc', fontWeight: 800 }}>5. Trading</h4>
            <p>On your turn, you can propose deals exchanging cash and properties (only properties with 0 upgrades). Trades execute atomically when accepted.</p>
          </div>

          <div>
            <h4 style={{ color: '#f8fafc', fontWeight: 800 }}>6. Debt & Bankruptcy</h4>
            <p>If you owe rent or taxes and run out of cash, the debt panel opens. You must sell upgrades (at 50% refund) or mortgage properties. If unable to pay, bankruptcy eliminates you and transfers assets to your creditor (or bank).</p>
          </div>
        </div>

        <button className="btn-primary" onClick={onClose} style={{ alignSelf: 'center', marginTop: '10px' }}>
          Got It! Let's Play
        </button>
      </div>
    </div>
  );
};
