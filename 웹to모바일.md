# 웹 → 모바일 (React Native) 변환 가이드

---

## 인터랙션 변환

| 웹 | 모바일 (React Native) | 이유 |
|---|---|---|
| `hover` | `TouchableOpacity` (탭) | 손가락에 hover 없음 |
| `hover`로 보이는 삭제버튼 | 스와이프 or 길게 누르기 | 터치 UX 표준 |
| `onClick` | `onPress` | RN 컴포넌트 규칙 |
| `onMouseEnter/Leave` | 삭제 | 터치에 없는 개념 |
| 우클릭 컨텍스트 메뉴 | 길게 누르기 (`onLongPress`) | 모바일 표준 |
| `window.print()` | `expo-print` → PDF → 공유 | 브라우저 없음 |

---

## 컴포넌트 변환

| 웹 | 모바일 |
|---|---|
| `<div>` | `<View>` |
| `<span>`, `<p>` | `<Text>` |
| `<button>` | `<TouchableOpacity>` |
| `<input>` | `<TextInput>` |
| `<textarea>` | `<TextInput multiline>` |
| `<img>` | `<Image>` |
| `<select>` | `<Picker>` 또는 커스텀 모달 |
| `<a href>` | `Linking.openURL()` |

---

## 스타일 변환

| 웹 (CSS) | 모바일 (StyleSheet) | 주의 |
|---|---|---|
| `className={styles.box}` | `style={styles.box}` | |
| CSS 파일 | `StyleSheet.create({})` | JS 객체로 |
| `px`, `%`, `vw` | 숫자(dp), `%` | `vw/vh` 없음 |
| `grid` | `flexbox`만 | Grid 지원 안됨 |
| `box-shadow` | `elevation` (Android) / `shadowX` (iOS) | 플랫폼별 다름 |
| `border-radius: 50%` | `borderRadius: 999` | `%` 안됨 |
| `@media print` | 필요 없음 | PDF로 대체 |
| `position: fixed` | `position: absolute` | fixed 없음 |
| `overflow: scroll` | `<ScrollView>` or `<FlatList>` | 컴포넌트로 처리 |

---

## 저장소 변환

| 웹 | 모바일 |
|---|---|
| `localStorage` | `AsyncStorage` (비동기) |
| `sessionStorage` | Zustand 메모리 |
| Cookie | 없음 (토큰은 AsyncStorage) |

---

## 네비게이션 변환

| 웹 | 모바일 |
|---|---|
| `react-router-dom` | `@react-navigation` |
| `<Link to>` | `navigation.navigate()` |
| URL 기반 라우팅 | 스택/탭 기반 네비게이션 |
| 뒤로가기 (브라우저) | 스와이프 백 / 하드웨어 버튼 |

---

## 핵심 요약

비즈니스 로직과 Firebase 연동은 거의 그대로 가져가고, **UI 레이어(JSX + CSS)만 React Native 문법으로 바꾸는 게 전부**.
