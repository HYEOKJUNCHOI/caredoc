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
  const { t } = useTranslation();

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
      setError(t('userForm.nameRequired'));
      return;
    }
    if (!form.manager.trim()) {
      setError(t('userForm.managerRequired'));
      return;
    }
    setLoading(true);
    try {
      const users = getUsers();
      const isDuplicate = users.some(
        (u) => u.name.trim() === form.name.trim()
      );
      if (isDuplicate) {
        setError(t('userForm.duplicateError'));
        setLoading(false);
        return;
      }
      const newUser = {
        id: Date.now().toString(),
        name: form.name.trim(),
        manager: form.manager.trim(),
        createdAt: new Date().toISOString(),
      };
      await saveUsers([newUser, ...users]);
      navigate('/');
    } catch (e) {
      console.error('저장 실패:', e);
      setError(t('userForm.saveError'));
    } finally {
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
          {loading ? t('userForm.saving') : t('userForm.save')}
        </button>
      </div>
    </div>
  );
};

export default UserForm;
