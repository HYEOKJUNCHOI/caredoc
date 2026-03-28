/* 이용자 등록/수정 폼
   - 필드: 이용자 성명, 담당자 성명 (MVP 기준 최소 필드)
   - 저장 후 홈으로 이동 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUsers, saveUsers } from '../../utils/storage';
import styles from './UserForm.module.css';

const UserForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', manager: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const users = getUsers();
      const newUser = {
        id: Date.now().toString(),
        name: form.name.trim(),
        manager: form.manager.trim() || '栗須康子',
        createdAt: new Date().toISOString(),
      };
      await saveUsers([...users, newUser]);
      navigate('/');
    } catch (e) {
      console.error('저장 실패:', e);
      setError('저장에 실패했습니다. 네트워크 연결을 확인해주세요.');
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
          {loading ? '저장 중...' : t('userForm.save')}
        </button>
      </div>
    </div>
  );
};

export default UserForm;
