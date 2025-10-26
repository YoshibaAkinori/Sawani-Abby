// app/settings/set_component/RegisterClosing.js
"use client";
import React, { useState, useEffect } from 'react';
import { Save, Plus, X, DollarSign, TrendingUp, Receipt } from 'lucide-react';
import './RegisterClosing.css';

const RegisterClosing = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // レジ金額（締め後の枚数も管理）
  const [cashCount, setCashCount] = useState({
    ten_thousand: '',
    five_thousand: '',
    two_thousand: '',
    one_thousand: '',
    five_hundred: '',
    one_hundred: '',
    fifty: '',
    ten: '',
    five: '',
    one: ''
  });
  // レジ金額（締め後の枚数も管理）
  const [cashCountAfter, setCashCountAfter] = useState({
    ten_thousand: '',
    five_thousand: '',
    two_thousand: '',
    one_thousand: '',
    five_hundred: '',
    one_hundred: '',
    fifty: '',
    ten: '',
    five: '',
    one: ''
  });

  // 売上状況（実際の金額の流れ）
  const [salesData, setSalesData] = useState({
    cash_amount: 0,      // 実際の現金入金額
    card_amount: 0,      // 実際のカード入金額
    transaction_count: 0,
    fixed_amount: 30000  // レジ規定額（固定）
  });

  // 支払い登録
  const [payments, setPayments] = useState([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '家賃',
    amount: '',
    memo: ''
  });

  // 札・硬貨の定義（規定額50,000円の標準枚数付き）
  const denominations = [
    { key: 'ten_thousand', label: '1万円札', value: 10000, defaultCount: 0 },
    { key: 'five_thousand', label: '5千円札', value: 5000, defaultCount: 3 },
    { key: 'two_thousand', label: '2千円札', value: 2000, defaultCount: 0 },
    { key: 'one_thousand', label: '千円札', value: 1000, defaultCount: 12 },
    { key: 'five_hundred', label: '500円玉', value: 500, defaultCount: 3 },
    { key: 'one_hundred', label: '100円玉', value: 100, defaultCount: 12 },
    { key: 'fifty', label: '50円玉', value: 50, defaultCount: 5 },
    { key: 'ten', label: '10円玉', value: 10, defaultCount: 5 },
    { key: 'five', label: '5円玉', value: 5, defaultCount: 0 },
    { key: 'one', label: '1円玉', value: 1, defaultCount: 0 }
  ];

  // 支払いカテゴリ
  const paymentCategories = ['家賃', '光熱費', '仕入れ', '備品購入', 'その他'];

  // 実際在高を計算
  const calculateActualCash = () => {
    return denominations.reduce((sum, denom) => {
      const count = parseInt(cashCount[denom.key]) || 0;
      return sum + (count * denom.value);
    }, 0);
  };
  const calculateActualCashAfter = () => {
    return denominations.reduce((sum, denom) => {
      const count = parseInt(cashCountAfter[denom.key]) || 0;
      return sum + (count * denom.value);
    }, 0);
  };

  // 本日の支払い合計
  const calculateTodayPayments = () => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  // 理論在高を計算（規定額 + 現金入金）
  const calculateExpectedCash = () => {
    return salesData.fixed_amount + salesData.cash_amount;
  };

  // 登録額を計算（実際在高 - 規定額 - 支払い）
  const calculateRecordAmount = () => {
    return calculateActualCash() - salesData.fixed_amount - calculateTodayPayments();
  };

  // 過不足を計算
  const calculateDiscrepancy = () => {
    return calculateActualCash() - calculateExpectedCash();
  };

  // 枚数入力変更（締め前）
  const handleCountChange = (key, value) => {
    if (value === '') {
      setCashCount(prev => ({ ...prev, [key]: '' }));
      return;
    }
    const numValue = parseInt(value) || 0;
    const newCount = numValue >= 0 ? numValue : '';
    setCashCount(prev => ({
      ...prev,
      [key]: newCount
    }));

    // 締め後枚数を自動計算（差し引きを引いた値）
    const defaultCount = denominations.find(d => d.key === key).defaultCount;
    const difference = numValue - defaultCount;
    const afterCount = numValue - difference; // = defaultCount
    setCashCountAfter(prev => ({
      ...prev,
      [key]: afterCount >= 0 ? afterCount : 0
    }));
  };

  // 枚数入力変更（締め後）
  const handleCountAfterChange = (key, value) => {
    if (value === '') {
      setCashCountAfter(prev => ({ ...prev, [key]: '' }));
      return;
    }
    const numValue = parseInt(value) || 0;
    setCashCountAfter(prev => ({
      ...prev,
      [key]: numValue >= 0 ? numValue : ''
    }));
  };

  // 支払いフォーム入力
  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? (parseInt(value) || '') : value
    }));
  };

  // 支払い追加
  const handleAddPayment = () => {
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      alert('金額を入力してください');
      return;
    }

    const newPayment = {
      id: Date.now(),
      date: paymentForm.date,
      category: paymentForm.category,
      amount: parseInt(paymentForm.amount),
      memo: paymentForm.memo
    };

    setPayments(prev => [...prev, newPayment]);
    setPaymentForm({
      date: new Date().toISOString().split('T')[0],
      category: '家賃',
      amount: '',
      memo: ''
    });
    setShowPaymentForm(false);
  };

  // 支払い削除
  const handleDeletePayment = (id) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  // データ取得（日付変更時）
  // app/settings/set_component/RegisterClosing.js
  // fetchClosingData関数を以下に変更

  const fetchClosingData = async (targetDate) => {
    setIsLoading(true);
    try {
      // 売上データ取得(paymentsテーブルから集計)
      const salesResponse = await fetch(`/api/register-closing/sales?date=${targetDate}`);
      if (salesResponse.ok) {
        const salesResult = await salesResponse.json();
        setSalesData({
          ...salesResult.data,
          fixed_amount: 30000 // 規定額は固定
        });
      }

      // 既存のレジ締めデータ取得
      const closingResponse = await fetch(`/api/register-closing?date=${targetDate}`);
      if (closingResponse.ok) {
        const closingResult = await closingResponse.json();

        // ★★★ デバッグ用ログ ★★★
        //console.log('=== レジ締めデータ取得結果 ===');
        //console.log('closingResult:', closingResult);
        //console.log('closingResult.data:', closingResult.data);
        //console.log('closingResult.data.payments:', closingResult.data?.payments);
        //console.log('payments型:', typeof closingResult.data?.payments);

        if (closingResult.data) {
          // 締め前のデータを設定
          setCashCount(closingResult.data.cash_count || {
            ten_thousand: '', five_thousand: '', two_thousand: '', one_thousand: '',
            five_hundred: '', one_hundred: '', fifty: '', ten: '', five: '', one: ''
          });

          // 締め後のデータを設定
          setCashCountAfter(closingResult.data.cash_count_after || {
            ten_thousand: '', five_thousand: '', two_thousand: '', one_thousand: '',
            five_hundred: '', one_hundred: '', fifty: '', ten: '', five: '', one: ''
          });

          // ★★★ 支払いデータを設定（型チェック追加） ★★★
          let paymentsData = [];

          if (closingResult.data.payments) {
            // すでに配列の場合
            if (Array.isArray(closingResult.data.payments)) {
              paymentsData = closingResult.data.payments;
            }
            // 文字列の場合（JSONパース失敗時）
            else if (typeof closingResult.data.payments === 'string') {
              try {
                paymentsData = JSON.parse(closingResult.data.payments);
              } catch (e) {
                //console.error('JSON parse error:', e);
                paymentsData = [];
              }
            }
          }

          //console.log('最終的なpaymentsData:', paymentsData);
          setPayments(paymentsData);
          setIsSaved(true);
        } else {
          // データがない場合は空にする
          setCashCount({
            ten_thousand: '', five_thousand: '', two_thousand: '', one_thousand: '',
            five_hundred: '', one_hundred: '', fifty: '', ten: '', five: '', one: ''
          });
          setCashCountAfter({
            ten_thousand: '', five_thousand: '', two_thousand: '', one_thousand: '',
            five_hundred: '', one_hundred: '', fifty: '', ten: '', five: '', one: ''
          });
          setPayments([]);
          setIsSaved(false);
        }
      }
    } catch (error) {
      //console.error('データ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 日付変更時にデータ取得
  useEffect(() => {
    fetchClosingData(date);
  }, [date]);

  // データ保存
  const handleSave = async () => {
    setIsLoading(true);

    const closingData = {
      date,
      // 札・硬貨の枚数（締め前・個別に保存）
      cash_count: cashCount,
      cash_count_after: cashCountAfter,
      ten_thousand_count: parseInt(cashCount.ten_thousand) || 0,
      five_thousand_count: parseInt(cashCount.five_thousand) || 0,
      two_thousand_count: parseInt(cashCount.two_thousand) || 0,
      one_thousand_count: parseInt(cashCount.one_thousand) || 0,
      five_hundred_count: parseInt(cashCount.five_hundred) || 0,
      one_hundred_count: parseInt(cashCount.one_hundred) || 0,
      fifty_count: parseInt(cashCount.fifty) || 0,
      ten_count: parseInt(cashCount.ten) || 0,
      five_count: parseInt(cashCount.five) || 0,
      one_count: parseInt(cashCount.one) || 0,
      // 札・硬貨の枚数（締め後・個別に保存）
      ten_thousand_count_after: parseInt(cashCountAfter.ten_thousand) || 0,
      five_thousand_count_after: parseInt(cashCountAfter.five_thousand) || 0,
      two_thousand_count_after: parseInt(cashCountAfter.two_thousand) || 0,
      one_thousand_count_after: parseInt(cashCountAfter.one_thousand) || 0,
      five_hundred_count_after: parseInt(cashCountAfter.five_hundred) || 0,
      one_hundred_count_after: parseInt(cashCountAfter.one_hundred) || 0,
      fifty_count_after: parseInt(cashCountAfter.fifty) || 0,
      ten_count_after: parseInt(cashCountAfter.ten) || 0,
      five_count_after: parseInt(cashCountAfter.five) || 0,
      one_count_after: parseInt(cashCountAfter.one) || 0,
      // 計算結果
      actual_cash: calculateActualCash(),
      expected_cash: calculateExpectedCash(),
      discrepancy: calculateDiscrepancy(),
      record_amount: calculateRecordAmount(),
      // 売上データ
      cash_amount: salesData.cash_amount,
      card_amount: salesData.card_amount,
      total_sales: salesData.cash_amount + salesData.card_amount,
      transaction_count: salesData.transaction_count,
      fixed_amount: salesData.fixed_amount,
      // 支払いデータ
      payments,
      total_payments: calculateTodayPayments(),
      staff_id: 'cc69b300-9b97-11f0-b7ae-5a93b150659e'
    };

    try {
      const response = await fetch('/api/register-closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(closingData)
      });

      if (response.ok) {
        alert('レジ締めデータを保存しました');
        setIsSaved(true);
      } else {
        alert('保存に失敗しました');
      }
    } catch (error) {
      //console.error('保存エラー:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const actualCash = calculateActualCash();
  const expectedCash = calculateExpectedCash();
  const discrepancy = calculateDiscrepancy();
  const todayPayments = calculateTodayPayments();
  const recordAmount = calculateRecordAmount();

  return (
    <div className="register-closing">
      {/* ヘッダー */}
      <div className="register-closing__header">
        <div>
          <h2 className="register-closing__title">レジ締め</h2>
          <div className="register-closing__date-wrapper">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="register-closing__date-input"
            />
            {isSaved && (
              <span className="register-closing__saved-badge">保存済み</span>
            )}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="register-closing__save-btn"
        >
          <Save size={16} />
          {isLoading ? '保存中...' : 'データ保存'}
        </button>
      </div>

      {/* 売上状況 */}
      <div className="register-closing__section">
        <div className="register-closing__section-header register-closing__section-header--sales">
          <TrendingUp size={20} />
          <h3>今日の売上状況</h3>
        </div>

        <div className="register-closing__sales-grid">
          <div className="register-closing__sales-card">
            <div className="register-closing__sales-label">現金入金</div>
            <div className="register-closing__sales-value">¥{salesData.cash_amount.toLocaleString()}</div>
          </div>
          <div className="register-closing__sales-card">
            <div className="register-closing__sales-label">カード入金</div>
            <div className="register-closing__sales-value">¥{salesData.card_amount.toLocaleString()}</div>
          </div>
          <div className="register-closing__sales-card">
            <div className="register-closing__sales-label">入金合計</div>
            <div className="register-closing__sales-value register-closing__sales-value--total">
              ¥{(salesData.cash_amount + salesData.card_amount).toLocaleString()}
            </div>
          </div>
          <div className="register-closing__sales-card">
            <div className="register-closing__sales-label">取引件数</div>
            <div className="register-closing__sales-value">{salesData.transaction_count}件</div>
          </div>
          <div className="register-closing__sales-card register-closing__sales-card--fixed">
            <div className="register-closing__sales-label">
              レジ規定額
            </div>
            <div className="register-closing__sales-value">¥{salesData.fixed_amount.toLocaleString()}</div>
          </div>
          <div className="register-closing__sales-card">
            <div className="register-closing__sales-label">本日支払</div>
            <div className="register-closing__sales-value register-closing__sales-value--payment">
              ¥{todayPayments.toLocaleString()}
            </div>
          </div>
          <div className="register-closing__sales-card register-closing__sales-card--record">
            <div className="register-closing__sales-label">登録額（金庫へ）</div>
            <div className="register-closing__sales-formula">
              実際{actualCash.toLocaleString()} - 規定{salesData.fixed_amount.toLocaleString()} - 支払{todayPayments.toLocaleString()}
            </div>
            <div className="register-closing__sales-value register-closing__sales-value--record">
              ¥{recordAmount.toLocaleString()}
            </div>
          </div>
        </div>

        <div className={`register-closing__discrepancy ${discrepancy === 0 ? 'register-closing__discrepancy--zero' :
          discrepancy > 0 ? 'register-closing__discrepancy--plus' :
            'register-closing__discrepancy--minus'
          }`}>
          <div>
            <div style={{ fontSize: '14px', marginBottom: '4px', opacity: 0.8 }}>
              過不足（実際在高 - 理論在高）
            </div>
            <div style={{ fontSize: '13px', marginBottom: '6px', color: '#64748b' }}>
              理論在高 = 規定{salesData.fixed_amount.toLocaleString()} + 現金{salesData.cash_amount.toLocaleString()} = ¥{expectedCash.toLocaleString()}
            </div>
            <span style={{ fontSize: '16px' }}>実際 ¥{actualCash.toLocaleString()} - 理論 ¥{expectedCash.toLocaleString()}</span>
          </div>
          <span className="register-closing__discrepancy-amount">
            {discrepancy > 0 ? '+' : ''}¥{discrepancy.toLocaleString()}
          </span>
        </div>
      </div>

      {/* レジ金額登録 */}
      <div className="register-closing__section">
        <div className="register-closing__section-header">
          <DollarSign size={20} />
          <h3>レジ金額登録</h3>
        </div>

        <table className="register-closing__table">
          <thead>
            <tr>
              <th>種別</th>
              <th>締め前枚数</th>
              <th>規定枚数</th>
              <th>差し引き</th>
              <th>締め後枚数</th>
              <th>金額</th>
            </tr>
          </thead>
          <tbody>
            {denominations.map((denom) => {
              const beforeCount = parseInt(cashCount[denom.key]) || 0;
              const defaultCount = denom.defaultCount;
              const difference = defaultCount - beforeCount;
              const amount = difference * denom.value;

              return (
                <tr key={denom.key}>
                  <td>{denom.label}</td>
                  <td className="register-closing__count-cell">
                    <input
                      type="number"
                      min="0"
                      value={cashCount[denom.key]}
                      onChange={(e) => handleCountChange(denom.key, e.target.value)}
                      placeholder={defaultCount.toString()}
                      className="register-closing__count-input"
                    />
                  </td>
                  <td className="register-closing__default-count">
                    {defaultCount}枚
                  </td>
                  <td className="register-closing__difference-count">
                    {difference > 0 ? '+' : ''}{difference}枚
                  </td>
                  <td className="register-closing__count-cell">
                    <input
                      type="number"
                      min="0"
                      value={cashCountAfter[denom.key]}
                      onChange={(e) => handleCountAfterChange(denom.key, e.target.value)}
                      placeholder={defaultCount.toString()}
                      className="register-closing__count-input register-closing__count-input--after"
                    />
                  </td>
                  <td className="register-closing__amount">
                    ¥{amount.toLocaleString()}
                  </td>
                </tr>
              );
            })}
            <tr className="register-closing__total-row">
              <td>締め前合計</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td className="register-closing__actual-total">
                ¥{actualCash.toLocaleString()}
              </td>
            </tr>
            <tr className="register-closing__total-row">
              <td>規定額（残す）</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td className="register-closing__expected-total">
                ¥{salesData.fixed_amount.toLocaleString()}
              </td>
            </tr>
            <tr className="register-closing__total-row">
              <td>締め後合計</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td className="register-closing__actual-total">
                ¥{calculateActualCashAfter().toLocaleString()}
              </td>
            </tr>
            <tr className="register-closing__total-row">
              <td>支払い</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td className="register-closing__payment-total">
                ¥{todayPayments.toLocaleString()}
              </td>
            </tr>
            <tr className="register-closing__total-row register-closing__total-row--highlight">
              <td>登録額（金庫へ）</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td className="register-closing__record-total">
                ¥{recordAmount.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 支払い登録 */}
      <div className="register-closing__section">
        <div className="register-closing__section-header register-closing__section-header--payment">
          <div className="register-closing__section-title">
            <Receipt size={20} />
            <h3>本日の支払い</h3>
          </div>
          <button
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            className={`register-closing__add-payment-btn ${showPaymentForm ? 'register-closing__add-payment-btn--close' : ''}`}
          >
            {showPaymentForm ? <X size={16} /> : <Plus size={16} />}
            {showPaymentForm ? '閉じる' : '支払い追加'}
          </button>
        </div>

        {showPaymentForm && (
          <div className="register-closing__payment-form">
            <div className="register-closing__form-group">
              <label>日付</label>
              <input
                type="date"
                name="date"
                value={paymentForm.date}
                onChange={handlePaymentInputChange}
              />
            </div>
            <div className="register-closing__form-group">
              <label>項目</label>
              <select
                name="category"
                value={paymentForm.category}
                onChange={handlePaymentInputChange}
              >
                {paymentCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="register-closing__form-group">
              <label>金額</label>
              <input
                type="number"
                name="amount"
                value={paymentForm.amount}
                onChange={handlePaymentInputChange}
                placeholder="金額を入力"
              />
            </div>
            <div className="register-closing__form-group">
              <label>メモ</label>
              <input
                type="text"
                name="memo"
                value={paymentForm.memo}
                onChange={handlePaymentInputChange}
                placeholder="メモ（任意）"
              />
            </div>
            <button onClick={handleAddPayment} className="register-closing__form-submit">
              追加
            </button>
          </div>
        )}

        {payments.length > 0 ? (
          <table className="register-closing__table register-closing__table--payments">
            <thead>
              <tr>
                <th>日付</th>
                <th>項目</th>
                <th>金額</th>
                <th>メモ</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.date}</td>
                  <td>{payment.category}</td>
                  <td>¥{payment.amount.toLocaleString()}</td>
                  <td>{payment.memo || '-'}</td>
                  <td>
                    <button
                      onClick={() => handleDeletePayment(payment.id)}
                      className="register-closing__delete-btn"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="register-closing__empty">
            本日の支払いはまだありません
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterClosing;