/* プライバシーポリシー — 個人情報保護方針 */

const Privacy = () => {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px', lineHeight: 1.8, color: '#222', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>プライバシーポリシー</h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 40 }}>最終更新日：2026年4月3日</p>

      <p>CareDoc（以下「本サービス」）は、利用者の個人情報の保護を重要な責務と考え、以下の方針に基づき適切に取り扱います。</p>

      <h2 style={h2}>1. 取得する情報</h2>
      <p>本サービスでは、以下の情報を取得します。</p>
      <ul style={ul}>
        <li>Googleアカウントのメールアドレス・表示名（ログイン時）</li>
        <li>LINEアカウントの表示名・プロフィール画像（LINEログイン利用時）</li>
        <li>サービス利用者（支援対象者）の氏名・生年月日・住所・障害情報等（ユーザーが入力した書類データ）</li>
      </ul>

      <h2 style={h2}>2. 利用目的</h2>
      <p>取得した情報は以下の目的にのみ使用します。</p>
      <ul style={ul}>
        <li>本サービスへのログイン・認証</li>
        <li>作成した書類データのクラウド保存・複数端末間での同期</li>
        <li>サービスの改善・障害対応</li>
      </ul>

      <h2 style={h2}>3. 第三者提供</h2>
      <p>法令に基づく場合を除き、取得した個人情報を第三者に提供・販売・開示することはありません。</p>

      <h2 style={h2}>4. 外部サービスの利用</h2>
      <p>本サービスは以下の外部サービスを使用しています。</p>
      <ul style={ul}>
        <li><strong>Firebase（Google LLC）</strong>：認証・データベース（Firestore）。<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#4a9a4a' }}>Googleプライバシーポリシー</a></li>
        <li><strong>LINE Login（LINE Corporation）</strong>：LINEアカウントによる認証。<a href="https://line.me/ja/terms/policy/" target="_blank" rel="noopener noreferrer" style={{ color: '#4a9a4a' }}>LINEプライバシーポリシー</a></li>
        <li><strong>Vercel Inc.</strong>：Webサービスのホスティング。</li>
      </ul>

      <h2 style={h2}>5. データの保管・削除</h2>
      <p>書類データはFirestore（Googleのクラウドサーバー）に暗号化して保管されます。アカウント削除をご希望の場合は、下記お問い合わせ先までご連絡ください。</p>

      <h2 style={h2}>6. Cookieおよびローカルストレージ</h2>
      <p>本サービスはログイン状態の維持・データの一時保存のためにブラウザのLocalStorageを使用します。広告目的のCookieは使用しません。</p>

      <h2 style={h2}>7. 未成年者の利用</h2>
      <p>本サービスは福祉事業所の職員を対象としており、未成年者単独での利用は想定しておりません。</p>

      <h2 style={h2}>8. プライバシーポリシーの変更</h2>
      <p>本方針は必要に応じて変更することがあります。変更後はこのページに最新版を掲載します。</p>

      <h2 style={h2}>9. お問い合わせ</h2>
      <p>個人情報の取り扱いに関するお問い合わせは、サービス管理者（最혁준）までご連絡ください。</p>

      <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid #eee', fontSize: 13, color: '#aaa', textAlign: 'center' }}>
        © 2026 CareDoc. All rights reserved.
      </div>
    </div>
  );
};

const h2 = {
  fontSize: 17,
  fontWeight: 700,
  marginTop: 36,
  marginBottom: 8,
  paddingBottom: 6,
  borderBottom: '1px solid #eee',
};

const ul = {
  paddingLeft: 20,
  marginTop: 8,
};

export default Privacy;
