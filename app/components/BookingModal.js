import React from 'react';
import { X, Calendar, Clock } from 'lucide-react';

const BookingModal = ({ activeModal, selectedSlot, onClose, onModalChange }) => {
  if (!activeModal) return null;

  // 予約タイプ選択モーダル
  if (activeModal === 'booking' && selectedSlot) {
    return (
      <div className="salon-board__modal-content">
        <div className="salon-board__modal-header">
          <h3>新規登録 - {selectedSlot.staffName} ({selectedSlot.timeSlot})</h3>
          <button onClick={onClose} className="salon-board__modal-close">
            <X />
          </button>
        </div>
        
        <div className="salon-board__booking-type-selection">
          <button 
            className="salon-board__booking-type-btn salon-board__booking-type-btn--reservation"
            onClick={() => onModalChange('new-reservation')}
          >
            <Calendar className="salon-board__booking-type-icon" />
            <div>
              <h4>新規予約</h4>
              <p>お客様の予約を登録</p>
            </div>
          </button>
          
          <button 
            className="salon-board__booking-type-btn salon-board__booking-type-btn--schedule"
            onClick={() => onModalChange('new-schedule')}
          >
            <Clock className="salon-board__booking-type-icon" />
            <div>
              <h4>新規予定</h4>
              <p>スタッフの予定を登録</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // 新規予約モーダル
  if (activeModal === 'new-reservation') {
    return (
      <div className="salon-board__modal-content">
        <div className="salon-board__modal-header">
          <h3>新規予約登録</h3>
          <button onClick={onClose} className="salon-board__modal-close">
            <X />
          </button>
        </div>
        <div className="salon-board__modal-body">
          <div className="salon-board__booking-form">
            <div className="salon-board__form-row">
              <label>お客様名</label>
              <input type="text" placeholder="お客様のお名前を入力" />
            </div>
            <div className="salon-board__form-row">
              <label>電話番号</label>
              <input type="tel" placeholder="090-0000-0000" />
            </div>
            <div className="salon-board__form-row">
              <label>施術メニュー</label>
              <select>
                <option>フェイシャル</option>
                <option>ボディトリート</option>
                <option>その他</option>
              </select>
            </div>
            <div className="salon-board__form-row">
              <label>開始時間</label>
              <input type="time" defaultValue={selectedSlot?.timeSlot || '10:00'} />
            </div>
            <div className="salon-board__form-row">
              <label>終了時間</label>
              <input type="time" />
            </div>
            <div className="salon-board__form-row">
              <label>備考</label>
              <textarea placeholder="特記事項があれば入力してください" rows="3"></textarea>
            </div>
            <div className="salon-board__form-actions">
              <button onClick={onClose} className="salon-board__btn-cancel">
                キャンセル
              </button>
              <button onClick={onClose} className="salon-board__btn-save">
                予約を登録
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 新規予定モーダル
  if (activeModal === 'new-schedule') {
    return (
      <div className="salon-board__modal-content">
        <div className="salon-board__modal-header">
          <h3>新規予定登録</h3>
          <button onClick={onClose} className="salon-board__modal-close">
            <X />
          </button>
        </div>
        <div className="salon-board__modal-body">
          <div className="salon-board__booking-form">
            <div className="salon-board__form-row">
              <label>予定名</label>
              <input type="text" placeholder="予定の名前を入力" />
            </div>
            <div className="salon-board__form-row">
              <label>開始時間</label>
              <input type="time" defaultValue={selectedSlot?.timeSlot || '10:00'} />
            </div>
            <div className="salon-board__form-row">
              <label>終了時間</label>
              <input type="time" />
            </div>
            <div className="salon-board__form-row">
              <label>メモ</label>
              <textarea placeholder="予定の詳細があれば入力してください" rows="3"></textarea>
            </div>
            <div className="salon-board__form-actions">
              <button onClick={onClose} className="salon-board__btn-cancel">
                キャンセル
              </button>
              <button onClick={onClose} className="salon-board__btn-save">
                予定を登録
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default BookingModal;