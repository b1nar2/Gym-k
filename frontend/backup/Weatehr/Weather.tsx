import React, { useEffect, useState } from 'react';
import './Weather.css';

// -------------------- 타입 선언 --------------------
type PrecipitationCode = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface LabelIcon {
  label: string;
  icon: string;
}
type PrecipitationStatus = LabelIcon;
type CategoryInfo = LabelIcon;

const knownCats = ['PTY', 'T1H', 'REH', 'RN1', 'WSD', 'TMP', 'UUU', 'VVV', 'VEC'] as const;
type KnownCategory = typeof knownCats[number];
type Category = KnownCategory | string;

interface WeatherItem {
  category: Category;
  obsrValue: string;
}

interface ApiResponse {
  items?: WeatherItem[];
}

const isKnownCategory = (cat: string): cat is KnownCategory =>
  (knownCats as readonly string[]).includes(cat);

// -------------------- 유틸 함수 --------------------
function getPrecipitationStatus(pty: string | number): PrecipitationStatus {
  const code = typeof pty === 'number' ? pty : parseInt(pty, 10);

  switch (code as PrecipitationCode) {
    case 0: return { label: '맑음', icon: '☀️' };
    case 1: return { label: '비', icon: '🌧️' };
    case 2: return { label: '진눈깨비', icon: '🌨️' };
    case 3: return { label: '눈', icon: '❄️' };
    case 4: return { label: '소나기', icon: '🌦️' };
    case 5: return { label: '이슬비', icon: '🌫️' };
    case 6: return { label: '눈날림', icon: '🌬️' };
    default: return { label: '알 수 없음', icon: '❓' };
  }
}

function formatValue(category: Category, value: string): string {
  switch (category) {
    case 'T1H': return `${value}°C`;   // 기온
    case 'REH': return `${value}%`;    // 습도
    case 'WSD': return `${value} m/s`; // 풍속
    case 'RN1': return `${value} mm`;  // 강수량
    case 'PTY': return '';             // 강수형태는 별도 처리
    default:    return value;
  }
}

// -------------------- 컴포넌트 --------------------
function Weather(): React.ReactElement { 
  const [weatherItems, setWeatherItems] = useState<WeatherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedCategories: Category[] = ['PTY', 'T1H', 'REH'];

  const categoryMap: Record<KnownCategory, CategoryInfo> = {
    PTY: { label: '현재 날씨', icon: '🌦️' },
    REH: { label: '습도', icon: '💧' },
    RN1: { label: '1시간 강수량', icon: '🌧️' },
    T1H: { label: '기온', icon: '🌡️' },
    UUU: { label: '동서 바람', icon: '↔️' },
    VEC: { label: '풍향', icon: '🧭' },
    VVV: { label: '남북 바람', icon: '↕️' },
    WSD: { label: '풍속', icon: '🌬️' },
    TMP: { label: '기온(TMP)', icon: '🌡️' },
  };

//useEffect 안에서 위치 권한을 요청하는 navigator.geolocation.getCurrentPosition 호출을 추가
//권한 허용 시 현재 위치를 받아 백엔드 API를 실시간 좌표로 호출
//거부/오류 시 에러 메시지를 표시하는 로직을 포함 
useEffect(() => {
  const fetchWeather = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      fetch(`http://localhost:8181/api/weather/now?lat=${lat}&lon=${lon}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => setWeatherItems(data.items ?? []))
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }, (err) => {
      setError("위치 정보를 가져오는데 실패했습니다.");
      setLoading(false);
    });
  };
  setLoading(true);
  setError(null);
  fetchWeather();
}, []);


  const filteredItems = weatherItems.filter((item) =>
    selectedCategories.includes(item.category)
  );

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;
  if (filteredItems.length === 0) return <div>표시할 데이터가 없습니다.</div>;

  return (
    <div className="weather-grid">
      {filteredItems.map((item, idx) => {
        let info: CategoryInfo;

        if (item.category === 'PTY') {
          info = getPrecipitationStatus(item.obsrValue);
        } else if (isKnownCategory(item.category)) {
          info = categoryMap[item.category];
        } else {
          info = { label: String(item.category), icon: '❓' };
        }

        return (
          <div key={idx} className="weather-card">
            <div className="icon">{info.icon}</div>
            <div className="label">{info.label}</div>
            <div className="value">{formatValue(item.category, item.obsrValue)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default Weather;
