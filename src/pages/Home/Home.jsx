/* 홈 — 이용자 목록 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUsers, saveUsers, setCurrentUserId } from '../../utils/storage';
import styles from './Home.module.css';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  
  /* 삭제 모드가 활성화된 이용자 ID (Long Press 시 설정) */
  const [deleteModeId, setDeleteModeId] = useState(null);
  
  /* 꾹 누르기 타이머 참조 */
  const longPressTimer = useRef(null);

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const handleSelect = (userId) => {
    setCurrentUserId(userId);
    navigate('/select');
  };

  const handleDelete = async (e, userId, userName) => {
    e.stopPropagation();
    if (!window.confirm(`「${userName}」を削除しますか？\n関連する書類データもすべて削除されます。`)) return;
    const updated = users.filter((u) => u.id !== userId);
    await saveUsers(updated);
    /* 해당 이용자의 서류 데이터도 함께 삭제 */
    const docs = JSON.parse(localStorage.getItem('caredoc-documents') || '{}');
    delete docs[userId];
    localStorage.setItem('caredoc-documents', JSON.stringify(docs));
    setUsers(updated);
    setDeleteModeId(null);
  };

  /* ── 꾹 누르기 (Long Press) 제어 ── */
  const startPress = (userId) => {
    // 이미 열려 있으면 다른 카드 열 때 닫기 선택 가능하지만, 여기선 꾹 누른 항목만 켬
    longPressTimer.current = setTimeout(() => {
      setDeleteModeId(userId);
    }, 600); // 0.6초간 누르고 있으면 발동
  };

  const cancelPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  /* 페이지 빈 곳 터치 시 삭제 모드 해제 */
  const handleContainerClick = () => {
    if (deleteModeId) setDeleteModeId(null);
  };

  /* 카드 클릭 시: 삭제 모드이면 무시 (또는 해제), 아니면 상세 진입 */
  const handleCardClick = (e, userId) => {
    e.stopPropagation();
    if (deleteModeId === userId) {
      setDeleteModeId(null);
      return;
    }
    // 다른 항목의 삭제 버튼이 열려 있으면 닫기만 하고 이동 방지
    if (deleteModeId) {
      setDeleteModeId(null);
      return;
    }
    handleSelect(userId);
  };

  return (
    <div className={styles.container} data-qa="home-page" onClick={handleContainerClick}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{t('home.title')}</h1>
      </div>

      <div className={styles.userList} data-qa="home-user-list">
        {users.length === 0 ? (
          <p className={styles.empty}>{t('home.noUsers')}</p>
        ) : (
          users.map((user) => (
            <div 
              key={user.id} 
              className={`${styles.userCardWrap} ${deleteModeId === user.id ? styles.showDelete : ''}`}
            >
              <button
                className={styles.userCard}
                onTouchStart={() => startPress(user.id)}
                onTouchEnd={cancelPress}
                onTouchMove={cancelPress}
                onMouseDown={() => startPress(user.id)}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
                onClick={(e) => handleCardClick(e, user.id)}
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
