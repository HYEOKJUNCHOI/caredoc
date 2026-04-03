/* useInstallPrompt — PWA 홈화면 추가 설치 프롬프트 훅 */

import { useState, useEffect } from 'react';

export const useInstallPrompt = () => {
  const [promptEvent, setPromptEvent] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    /* beforeinstallprompt: 브라우저가 PWA 설치 가능 상태가 되면 발생하는 이벤트
       기본 동작을 막고 이벤트를 저장해두었다가 버튼 클릭 시 직접 호출 */
    const handler = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };

    /* appinstalled: 실제로 설치가 완료되면 발생 */
    const installedHandler = () => {
      setIsInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    /* standalone 모드로 실행 중이면 이미 설치된 상태 */
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setPromptEvent(null);
    }
  };

  return { canInstall: !!promptEvent && !isInstalled, isInstalled, install };
};
