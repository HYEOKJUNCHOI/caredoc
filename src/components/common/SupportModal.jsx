import { useState } from 'react';
import styles from './SupportModal.module.css';

const AMOUNTS = [300, 500];

const SupportModal = ({ onClose }) => {
  const [selected, setSelected] = useState(300);
  const [custom, setCustom]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const finalAmount = selected === 'custom'
    ? parseInt(custom, 10)
    : selected;

  const handlePay = async () => {
    if (!finalAmount || finalAmount < 300) {
      setError('300円以上でご入力ください。');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/create-checkout-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: finalAmount }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; /* Stripe Checkout 페이지로 이동 */
      } else {
        setError(data.error || 'エラーが発生しました。');
      }
    } catch {
      setError('通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <p className={styles.title}>🐾 サイト維持費のご支援</p>
        <p className={styles.desc}>
          いつもご利用いただきありがとうございます。<br />
          サーバー維持のため、ご支援いただけると嬉しいです。
        </p>

        <div className={styles.amounts}>
          {AMOUNTS.map((a) => (
            <button
              key={a}
              className={`${styles.amountBtn} ${selected === a ? styles.active : ''}`}
              onClick={() => { setSelected(a); setCustom(''); }}
            >
              ¥{a}
            </button>
          ))}
          <button
            className={`${styles.amountBtn} ${selected === 'custom' ? styles.active : ''}`}
            onClick={() => setSelected('custom')}
          >
            自由入力
          </button>
        </div>

        {selected === 'custom' && (
          <div className={styles.customWrap}>
            <span className={styles.yen}>¥</span>
            <input
              className={styles.customInput}
              type="number"
              min={100}
              placeholder="例: 1000"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.payBtn}
          onClick={handlePay}
          disabled={!finalAmount || loading}
        >
          {loading ? '処理中...' : `${finalAmount ? `¥${finalAmount} で支援する ☕` : '金額を選択してください'}`}
        </button>

        <button className={styles.cancelBtn} onClick={onClose}>キャンセル</button>
      </div>
    </div>
  );
};

export default SupportModal;
