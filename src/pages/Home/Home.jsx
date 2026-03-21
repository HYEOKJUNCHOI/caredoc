/* 홈 — 이용자 목록 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUsers, saveUsers, setCurrentUserId } from '../../utils/storage';
import styles from './Home.module.css';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const handleSelect = (userId) => {
    setCurrentUserId(userId);
    navigate('/select');
  };

  const handleDelete = (e, userId, userName) => {
    e.stopPropagation();
    if (!window.confirm(`「${userName}」を削除しますか？\n関連する書類データもすべて削除されます。`)) return;
    const updated = users.filter((u) => u.id !== userId);
    saveUsers(updated);
    /* 해당 이용자의 서류 데이터도 함께 삭제 */
    const docs = JSON.parse(localStorage.getItem('caredoc-documents') || '{}');
    delete docs[userId];
    localStorage.setItem('caredoc-documents', JSON.stringify(docs));
    setUsers(updated);
  };

  return (
    <div className={styles.container} data-qa="home-page">
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{t('home.title')}</h1>
      </div>

      <div className={styles.userList} data-qa="home-user-list">
        {users.length === 0 ? (
          <p className={styles.empty}>{t('home.noUsers')}</p>
        ) : (
          users.map((user) => (
            <div key={user.id} className={styles.userCardWrap}>
              <button
                className={styles.userCard}
                onClick={() => handleSelect(user.id)}
              >
                <div className={styles.userCardLeft}>
                  {/* 이름 첫 글자로 아바타 */}
                  <div className={styles.avatar}>
                    {user.name?.[0] || '?'}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.name}</span>
                    <span className={styles.userManager}>{user.manager}</span>
                  </div>
                </div>
                <span className={styles.chevron}>›</span>
              </button>
              <button
                className={styles.deleteUserBtn}
                onClick={(e) => handleDelete(e, user.id, user.name)}
                title="削除"
              >✕</button>
            </div>
          ))
        )}
      </div>

      {users.length > 0 && <div className={styles.divider} />}

      <button
        className={styles.addBtn}
        onClick={() => navigate('/user/new')}
        data-qa="home-add-button"
      >
        <span className={styles.addIcon}>+</span>
        {t('home.addUser')}
      </button>
    </div>
  );
};

export default Home;
