import React from 'react';
import { X, UserCog, ClipboardList, Sparkles, Settings2, Calculator } from 'lucide-react';

const SettingsSidebar = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="salon-board__sidebar-overlay" onClick={onClose}></div>
      <div className="salon-board__settings-sidebar">
        <div className="salon-board__sidebar-header">
          <h3>設定</h3>
          <button onClick={onClose} className="salon-board__sidebar-close">
            <X />
          </button>
        </div>
        
        <div className="salon-board__sidebar-content">
          <button className="salon-board__sidebar-item">
            <UserCog className="salon-board__sidebar-icon" />
            <span>スタッフ管理</span>
          </button>
          
          <button className="salon-board__sidebar-item">
            <ClipboardList className="salon-board__sidebar-icon" />
            <span>シフト管理</span>
          </button>
          
          <button className="salon-board__sidebar-item">
            <Sparkles className="salon-board__sidebar-icon" />
            <span>施術コース管理</span>
          </button>
          
          <button className="salon-board__sidebar-item">
            <Settings2 className="salon-board__sidebar-icon" />
            <span>オプション管理</span>
          </button>
          
          <button className="salon-board__sidebar-item">
            <Calculator className="salon-board__sidebar-icon" />
            <span>レジ締め管理</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SettingsSidebar;