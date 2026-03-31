/* 이용자 등록/수정 폼
   - 필드: 이용자 성명, 담당자 성명 (MVP 기준 최소 필드)
   - 저장 후 홈으로 이동 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUsers, saveUsers } from '../../utils/storage';
import styles from './UserForm.module.css';

const UserForm = () => {
  /* useTranslation: react-i18next가 제공하는 훅
     - t('키'): 현재 언어에 맞는 번역 문자열 반환
     - i18n.language: 현재 선택된 언어 코드 ('ko' 또는 'ja') */
  const { t, i18n } = useTranslation();

  /* 언어에 따라 기본 담당자 이름 결정
     담당자를 비웠을 때 자동으로 채워주는 기본값 */
  const defaultManager = i18n.language === 'ja' ? '栗須康子' : '최혁준';

  /* useNavigate: 페이지 이동을 코드로 제어하는 훅
     navigate('/') → 홈 화면으로 이동 */
  const navigate = useNavigate();

  /* 폼 상태: name(이용자 이름)과 manager(담당자 이름) 두 필드 */
  const [form, setForm] = useState({ name: '', manager: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* 입력 필드가 바뀔 때마다 호출
     [e.target.name]: 속성명을 동적 키로 사용 → name/manager 둘 다 이 함수 하나로 처리 */
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      /* 기존 이용자 목록 조회 */
      const users = getUsers();

      /* 새 이용자 객체 생성
         - id: Date.now() → 밀리초 타임스탬프를 고유 ID로 활용
         - manager: 입력이 없으면 defaultManager(언어별 기본값) 사용
         - createdAt: ISO 8601 형식 날짜 문자열 (예: "2025-03-31T12:00:00.000Z") */
      const newUser = {
        id: Date.now().toString(),
        name: form.name.trim(),
        manager: form.manager.trim() || defaultManager,
        createdAt: new Date().toISOString(),
      };

      /* [newUser, ...users]: 스프레드(전개) 연산자
         새 이용자를 배열 맨 앞에 두고 기존 목록을 뒤에 붙임
         → 목록에서 최신 등록자가 맨 위에 보임 */
      await saveUsers([newUser, ...users]);
      navigate('/');
    } catch (e) {
      console.error('저장 실패:', e);
      setError('저장에 실패했습니다. 네트워크 연결을 확인해주세요.');
    } finally {
      /* finally: 성공/실패 상관없이 항상 실행 → 로딩 해제 */
      setLoading(false);
    }
  };

  return (
    <div className={styles.container} data-qa="userform-page">
      <h1 className={styles.title}>{t('userForm.titleNew')}</h1>

      <div className={styles.field}>
        <label className={styles.label}>{t('userForm.name')}</label>
        <input
          className={styles.input}
          type="text"
          name="name"
          placeholder={t('userForm.namePlaceholder')}
          value={form.name}
          onChange={handleChange}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>{t('userForm.manager')}</label>
        <input
          className={styles.input}
          type="text"
          name="manager"
          placeholder={t('userForm.managerPlaceholder')}
          value={form.manager}
          onChange={handleChange}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={() => navigate('/')} disabled={loading}>
          {t('userForm.cancel')}
        </button>
        <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
          {loading ? '저장 중...' : t('userForm.save')}
        </button>
      </div>
    </div>
  );
};

export default UserForm;
