/* 홈 — 이용자 목록 */

/* ============================================================
   [면접 설명 포인트] Home.jsx 역할
   - 등록된 이용자 목록을 카드 형태로 보여준다.
   - Long Press(꾹 누르기) 제스처로 삭제 모드를 활성화한다.
   - localStorage에서 데이터를 읽고 삭제 시 동기화한다.
   ============================================================ */

import { useState, useEffect, useRef } from 'react';
/* useState(유즈스테이트): 컴포넌트 내부 상태(값)를 관리하는 훅.
   상태가 바뀌면 컴포넌트가 자동으로 리렌더링(화면 다시 그리기)된다. */
/* useEffect(유즈이펙트): 컴포넌트가 렌더링된 후 실행할 사이드 이펙트를 등록하는 훅.
   두 번째 인자 []는 의존성 배열로, 빈 배열이면 최초 마운트(mount) 시에만 실행된다. */
/* useRef(유즈레프): 렌더링과 무관하게 값을 저장하는 훅.
   값이 바뀌어도 화면이 다시 그려지지 않는다. 타이머 ID 저장에 적합하다. */

import { useNavigate } from 'react-router-dom';
/* useNavigate(유즈내비게이트): 코드 내에서 페이지를 이동시키는 훅 */

import { useTranslation } from 'react-i18next';
/* useTranslation(유즈트랜슬레이션): 다국어 번역 텍스트를 가져오는 훅 */

import { getUsers, saveUsers, setCurrentUserId } from '../../utils/storage';
/* storage 유틸(utils 유틸즈): localStorage 읽기/쓰기를 추상화한 함수 모음.
   직접 localStorage를 쓰지 않고 util 함수로 분리하면 나중에 저장소를 바꿔도 한 곳만 수정하면 된다. */

import styles from './Home.module.css';
import ShibaWag from '../../components/common/ShibaWag';
/* CSS Modules(씨에스에스 모듈): 클래스명 충돌을 막기 위해 파일 단위로 스코프를 격리하는 방식.
   styles.container처럼 객체로 접근하며, 빌드 시 고유한 클래스명으로 변환된다. */

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  /* useState로 이용자 목록 상태 관리 */
  /* 초기값 []: 처음에는 빈 배열로 시작하고, useEffect에서 실제 데이터를 불러온다 */
  const [users, setUsers] = useState([]);

  /* 삭제 모드가 활성화된 이용자 ID (Long Press 시 설정) */
  /* null이면 어떤 카드도 삭제 모드가 아님, userId가 있으면 해당 카드만 삭제 모드 */
  const [deleteModeId, setDeleteModeId] = useState(null);

  /* 삭제 확인 모달용 상태 */
  /* 모달(Modal 모달): 화면 위에 떠서 사용자의 확인/취소를 받는 팝업 UI */
  const [userToDelete, setUserToDelete] = useState(null);

  /* 4개 고정 스크롤 컨테이너 — 5개 이상이면 스크롤로 확인 */

  /* 꾹 누르기 타이머 참조 */
  /* useRef로 타이머 ID를 저장한다.
     setState 대신 useRef를 쓰는 이유: 타이머 ID는 화면에 표시할 필요가 없으므로
     값이 바뀌어도 불필요한 리렌더링이 발생하지 않도록 ref를 사용한다 */
  const longPressTimer = useRef(null);

  /* useEffect: 컴포넌트가 처음 화면에 나타날 때(마운트 시) 이용자 목록을 불러온다 */
  /* 의존성 배열 []이 비어있으므로 최초 1회만 실행된다 */
  useEffect(() => {
    setUsers(getUsers());
  }, []);


  /* 카드 클릭 시 해당 이용자를 "현재 선택된 이용자"로 저장하고 서류 선택 화면으로 이동 */
  const handleSelect = (userId) => {
    setCurrentUserId(userId);  // 어떤 이용자의 서류를 편집할지 저장
    navigate('/select');       // navigate(내비게이트): 서류 선택 페이지로 이동
  };

  /* 삭제 버튼 클릭 이벤트 핸들러 */
  const handleDeleteClick = (e, user) => {
    /* e.stopPropagation(스탑프로파게이션): 이벤트 버블링 차단.
       버블링(bubbling 버블링): 자식 요소의 클릭이 부모 요소까지 전파되는 현상.
       여기서 막지 않으면 카드 클릭 핸들러도 같이 실행된다. */
    e.stopPropagation();
    setUserToDelete(user);  // 삭제 대상 이용자를 상태에 저장해 모달을 띄운다
  };

  /* 삭제 확인 모달에서 "삭제" 버튼 클릭 시 실행 */
  const confirmDelete = async () => {
    /* async/await(어씽크/어웨이트): 비동기 처리를 동기 코드처럼 읽기 좋게 작성하는 문법 */
    if (!userToDelete) return;
    const userId = userToDelete.id;

    /* filter(필터): 조건에 맞는 항목만 남긴 새 배열을 반환 (원본 배열은 변경되지 않음) */
    const updated = users.filter((u) => u.id !== userId);
    await saveUsers(updated);

    /* 해당 이용자의 서류 데이터도 함께 삭제 */
    /* JSON.parse(제이슨파스): JSON 문자열을 JavaScript 객체로 변환 */
    const docs = JSON.parse(localStorage.getItem('caredoc-documents') || '{}');
    delete docs[userId];  // delete 연산자: 객체의 특정 키를 제거
    /* JSON.stringify(제이슨스트링이파이): JavaScript 객체를 JSON 문자열로 변환 */
    localStorage.setItem('caredoc-documents', JSON.stringify(docs));

    /* 상태를 갱신해 화면을 다시 그린다 */
    setUsers(updated);
    setDeleteModeId(null);
    setUserToDelete(null);
  };

  /* 삭제 취소: 모달을 닫기만 하면 된다 */
  const cancelDelete = () => {
    setUserToDelete(null);
  };

  /* ── 꾹 누르기 (Long Press) 제어 ── */
  /* Long Press 패턴: 모바일에서 추가 액션을 드러내는 UX 패턴.
     setTimeout으로 일정 시간 이상 눌렀을 때만 삭제 버튼을 노출한다. */
  const startPress = (userId) => {
    // 이미 열려 있으면 다른 카드 열 때 닫기 선택 가능하지만, 여기선 꾹 누른 항목만 켬
    /* setTimeout(셋타임아웃): N밀리초 후에 콜백 함수를 실행하는 타이머.
       반환값(타이머 ID)을 ref에 저장해야 나중에 clearTimeout으로 취소할 수 있다. */
    longPressTimer.current = setTimeout(() => {
      setDeleteModeId(userId);
    }, 600); // 0.6초간 누르고 있으면 발동
  };

  /* 손가락을 떼거나 움직이면 타이머를 취소해 Long Press가 발동되지 않도록 한다 */
  const cancelPress = () => {
    if (longPressTimer.current) {
      /* clearTimeout(클리어타임아웃): setTimeout으로 등록한 타이머를 취소 */
      clearTimeout(longPressTimer.current);
    }
  };

  /* 페이지 빈 곳 터치 시 삭제 모드 해제 */
  /* 이벤트 버블링을 활용: 카드가 아닌 컨테이너를 클릭하면 삭제 모드가 해제된다 */
  const handleContainerClick = () => {
    if (deleteModeId) setDeleteModeId(null);
  };

  /* 카드 클릭 시: 삭제 모드이면 무시 (또는 해제), 아니면 상세 진입 */
  const handleCardClick = (e, userId) => {
    e.stopPropagation();  // 컨테이너 onClick이 같이 실행되지 않도록 버블링 차단
    if (deleteModeId === userId) {
      /* 이미 삭제 모드인 카드를 클릭하면 모드 해제 */
      setDeleteModeId(null);
      return;
    }
    // 다른 항목의 삭제 버튼이 열려 있으면 닫기만 하고 이동 방지
    /* 다른 카드가 삭제 모드일 때 클릭하면 이동 대신 삭제 모드만 닫는다 (UX 안전장치) */
    if (deleteModeId) {
      setDeleteModeId(null);
      return;
    }
    handleSelect(userId);
  };

  /* ── 렌더링(Rendering 렌더링) ──
     return문 안의 JSX(제이에스엑스)가 실제 화면에 그려지는 HTML 구조이다.
     JSX: JavaScript 안에서 HTML처럼 UI를 작성할 수 있게 해주는 문법 확장 */
  return (
    /* data-qa: DevTools에서 이 요소의 코드 위치를 바로 찾기 위한 식별자 속성 */
    <div className={styles.container} data-qa="home-page" onClick={handleContainerClick}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{t('home.title')}</h1>
      </div>

      <div className={styles.userListWrap}>
      <div className={styles.userList} data-qa="home-user-list">
        {users.length === 0 ? (
          <p className={styles.empty}>{t('home.noUsers')}</p>
        ) : (
          users.map((user) => (
            /* key(키): React가 리스트 아이템을 효율적으로 업데이트하기 위해 필요한 고유 식별자.
               key가 없으면 경고가 발생하고 렌더링 성능이 저하된다. */
            <div
              key={user.id}
              /* 템플릿 리터럴(template literal)과 조건부 클래스:
                 deleteModeId가 이 카드의 id와 같을 때만 showDelete 클래스를 추가해 삭제 버튼을 표시 */
              className={`${styles.userCardWrap} ${deleteModeId === user.id ? styles.showDelete : ''}`}
            >
              <button
                className={styles.userCard}
                /* 터치 이벤트(Touch Events 터치 이벤트): 모바일 기기의 터치 동작을 감지 */
                /* onTouchStart: 손가락이 닿는 순간 → 타이머 시작 */
                onTouchStart={() => startPress(user.id)}
                /* onTouchEnd: 손가락이 떨어지는 순간 → 타이머 취소 */
                onTouchEnd={cancelPress}
                /* onTouchMove: 손가락이 움직일 때 → 스크롤 중이면 Long Press 취소 */
                onTouchMove={cancelPress}
                /* PC 마우스 이벤트도 동일하게 지원 (크로스 플랫폼 대응) */
                onMouseDown={() => startPress(user.id)}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
                onClick={(e) => handleCardClick(e, user.id)}
              >
                <div className={styles.userCardLeft}>
                  {/* 이름 첫 글자로 아바타 */}
                  {/* user.name?.[0]: 옵셔널 체이닝(Optional Chaining 옵셔널 체이닝).
                      user.name이 null/undefined일 때 에러 대신 undefined를 반환.
                      || '?' : null/undefined이면 '?'를 대신 표시 */}
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
              {/* 삭제 버튼: CSS로 평소엔 숨겨져 있다가 showDelete 클래스가 붙으면 나타난다 */}
              <button
                className={styles.deleteUserBtn}
                onClick={(e) => handleDeleteClick(e, user)}
                title={t('ui.deleteTooltip')}
              >✕</button>
            </div>
          ))
        )}
      </div>

      {users.length > 4 && (
        <div className={styles.scrollHint}>▼ もっと見る</div>
      )}
      </div>

      {/* 이용자가 한 명이라도 있을 때만 구분선을 표시하는 조건부 렌더링 */}
      {users.length > 0 && <div className={styles.divider} />}

      {/* 이용자 추가 버튼: 클릭 시 UserForm 페이지로 이동 */}
      <button
        className={styles.addBtn}
        onClick={() => navigate('/user/new')}
        data-qa="home-add-button"
      >
        <span className={styles.addIcon}>+</span>
        {t('home.addUser')}
      </button>

      {/* 삭제 확인 모달 */}
      {/* userToDelete가 있을 때만(null이 아닐 때만) 모달을 렌더링 */}
      {userToDelete && (
        /* 오버레이(Overlay 오버레이): 배경을 어둡게 가리는 반투명 레이어.
           클릭하면 cancelDelete로 모달을 닫는다 (UX 관례) */
        <div className={styles.modalOverlay} onClick={cancelDelete}>
          {/* e.stopPropagation(): 모달 내부 클릭이 오버레이까지 전파되어
              실수로 닫히지 않도록 버블링을 차단한다 */}
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{t('ui.deleteConfirmTitle')}</h3>
            <p className={styles.modalText}>
              {/* split('\n'): 줄바꿈 문자를 기준으로 번역 텍스트를 배열로 나눈다 */}
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
      <ShibaWag />
    </div>
  );
};

export default Home;
