import React from 'react';
import { Users, BarChart3, CreditCard } from 'lucide-react';

const ActionCards = () => {
  return (
    <div className="salon-board__action-cards">
      <div className="salon-board__card-grid">
        <button className="salon-board__action-card salon-board__action-card--customers">
          <Users className="salon-board__card-icon" />
          <div className="salon-board__card-content">
            <h4>顧客情報</h4>
            <p>顧客一覧・詳細情報</p>
          </div>
        </button>

        <button className="salon-board__action-card salon-board__action-card--analytics">
          <BarChart3 className="salon-board__card-icon" />
          <div className="salon-board__card-content">
            <h4>売上分析</h4>
            <p>売上レポート・統計</p>
          </div>
        </button>

        <button className="salon-board__action-card salon-board__action-card--register">
          <CreditCard className="salon-board__card-icon" />
          <div className="salon-board__card-content">
            <h4>レジ/お会計</h4>
            <p>お会計処理・決済</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ActionCards;