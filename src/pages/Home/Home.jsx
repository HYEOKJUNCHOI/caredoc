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
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const handleSelect = (userId) => {
    setCurrentUserId(userId);
    navigate('/select');
  };

  const handleDeleteClick = (e, user) => {
    e.stopPropagation();
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    const userId = userToDelete.id;
    const updated = users.filter((u) => u.id !== userId);
    await saveUsers(updated);

    const docs = JSON.parse(localStorage.getItem('caredoc-documents') || '{}');
    delete docs[userId];
    localStorage.setItem('caredoc-documents', JSON.stringify(docs));

    setUsers(updated);
    setUserToDelete(null);
  };

  const cancelDelete = () => {
    setUserToDelete(null);
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
                onClick={(e) => handleDeleteClick(e, user)}
                title={t('ui.deleteTooltip')}
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

      {userToDelete && (
        <div className={styles.modalOverlay} onClick={cancelDelete}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{t('ui.deleteConfirmTitle')}</h3>
            <p className={styles.modalText}>
              「{userToDelete.name}」{t('ui.deleteConfirmText').split('\n')[0]}<br/>
              {t('ui.deleteConfirmText').split('\n')[1]}
            </p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={cancelDelete}>
                {t('common.cancel')}
              </button>
              <button className={styles.confirmBtn} onClick={confirmDelete}>
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
