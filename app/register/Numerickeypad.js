import React from 'react';
import { X } from 'lucide-react';

const NumericKeypad = ({ value, onChange, onClose, position }) => {
  const handleKeyPress = (key) => {
    if (key === 'C') {
      onChange('');
    } else if (key === '←') {
      onChange(value.slice(0, -1));
    } else if (key === '00') {
      onChange(value + '00');
    } else {
      onChange(value + key);
    }
  };

  return (
    <>
      <div className="keypad-overlay" onClick={onClose} />
      <div 
        className="numeric-keypad" 
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="keypad-header">
          <div className="keypad-display">{value || '0'}</div>
          <button className="keypad-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="keypad-buttons">
          {['7', '8', '9'].map(key => (
            <button key={key} className="keypad-btn" onClick={() => handleKeyPress(key)}>
              {key}
            </button>
          ))}
          {['4', '5', '6'].map(key => (
            <button key={key} className="keypad-btn" onClick={() => handleKeyPress(key)}>
              {key}
            </button>
          ))}
          {['1', '2', '3'].map(key => (
            <button key={key} className="keypad-btn" onClick={() => handleKeyPress(key)}>
              {key}
            </button>
          ))}
          <button className="keypad-btn" onClick={() => handleKeyPress('0')}>0</button>
          <button className="keypad-btn" onClick={() => handleKeyPress('00')}>00</button>
          <button className="keypad-btn keypad-btn--backspace" onClick={() => handleKeyPress('←')}>←</button>
          <button className="keypad-btn keypad-btn--clear" onClick={() => handleKeyPress('C')}>C</button>
          <button className="keypad-btn keypad-btn--confirm" onClick={onClose}>確定</button>
        </div>
      </div>
    </>
  );
};

export default NumericKeypad;