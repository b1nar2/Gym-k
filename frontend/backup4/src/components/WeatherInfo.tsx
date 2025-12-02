// import React, { useEffect, useState, useRef } from "react";
// import axios from "axios";

// // 백엔드 DTO 구조에 맞춘 타입 정의
// interface WeatherItem {
//   baseDate: string;
//   baseTime: string;
//   nx: number;
//   ny: number;
//   category: string;     // TMP, REH, SKY 등
//   obsrValue: string;
// }

// interface WeatherApiResponse {
//   response: {
//     header: {
//       resultCode: string;
//       resultMsg: string;
//     };
//     body: {
//       dataType: string;
//       pageNo: number;
//       numOfRows: number;
//       totalCount: number;
//       items: {
//         item: WeatherItem[];
//       };
//     };
//   };
// }

// // 화면에서 사용할 간단 타입
// type WeatherData = {
//   temperature: number;
//   humidity: number;
//   description: string;
// };

// const WeatherInfo: React.FC = () => {
//   const [weather, setWeather] = useState<WeatherData | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const timerRef = useRef<number | null>(null);
//   const FETCH_INTERVAL_MS = 10 * 60 * 1000; // 10분

//   const fetchWeather = async (lat: number, lon: number) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const res = await axios.get<WeatherApiResponse>(
//         `http://localhost:8181/api/weather/current?lat=${lat}&lon=${lon}`
//       );

//       const items = res.data.response.body.items.item || [];

//       if (items.length === 0) {
//         setError("날씨 데이터가 없습니다.");
//         setWeather(null);
//         return;
//       }

//       // category 기반으로 각 데이터 추출
//       const temperatureItem = items.find(i => i.category === "TMP");
//       const humidityItem = items.find(i => i.category === "REH");
//       const descriptionItem = items.find(i => i.category === "SKY");

//       setWeather({
//         temperature: temperatureItem ? Number(temperatureItem.obsrValue) : 0,
//         humidity: humidityItem ? Number(humidityItem.obsrValue) : 0,
//         description: descriptionItem ? descriptionItem.obsrValue : "알 수 없음",
//       });

//     } catch (err) {
//       console.error("날씨 API 호출 실패:", err);
//       setError("날씨 정보를 불러오는 중 오류가 발생했습니다.");
//       setWeather(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 위치 획득 및 주기적 갱신
//   useEffect(() => {
//     let mounted = true;

//     const onSuccess = (pos: GeolocationPosition) => {
//       if (!mounted) return;
//       const { latitude, longitude } = pos.coords;

//       // 최초 호출
//       fetchWeather(latitude, longitude);

//       // 기존 타이머 제거 후 10분마다 갱신
//       if (timerRef.current) clearInterval(timerRef.current);
//       timerRef.current = window.setInterval(() => fetchWeather(latitude, longitude), FETCH_INTERVAL_MS);
//     };

//     const onError = (err: GeolocationPositionError) => {
//       console.error("geolocation error:", err);
//       setError("위치 정보를 사용할 수 없어 날씨를 표시할 수 없습니다. 위치 접근을 허용해주세요.");
//       setLoading(false);
//     };

//     if ("geolocation" in navigator) {
//       navigator.geolocation.getCurrentPosition(onSuccess, onError, {
//         enableHighAccuracy: true,
//         maximumAge: 1000 * 60 * 5,
//       });
//     } else {
//       setError("이 브라우저는 위치 정보를 지원하지 않습니다.");
//       setLoading(false);
//     }

//     return () => {
//       mounted = false;
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, []);

//   // 아이콘 표시용
//   const Icon: React.FC<{ name?: string }> = ({ name }) => {
//     if (!name) return <span>❓</span>;
//     switch (name) {
//       case "1": return <span>☀️</span>; // 맑음
//       case "3": return <span>⛅</span>; // 구름 조금
//       case "4": return <span>☁️</span>; // 흐림
//       case "5": return <span>🌧️</span>; // 비
//       case "6": return <span>❄️</span>; // 눈
//       default: return <span>🌤️</span>;
//     }
//   };

//   if (loading) return <div>현재 위치의 날씨를 불러오는 중...</div>;
//   if (error) return <div style={{ color: "red" }}>{error}</div>;
//   if (!weather) return <div>날씨 데이터가 없습니다.</div>;

//   return (
//     <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, width: 320 }}>
//       <h3>현재 위치 날씨</h3>
//       <p style={{ fontSize: 28 }}>
//         <Icon name={weather.description} />{" "}
//         {weather.temperature}°C
//       </p>
//       <p><strong>습도:</strong> {weather.humidity}%</p>
//       <p><strong>설명:</strong> {weather.description}</p>
//     </div>
//   );
// };

// export default WeatherInfo;
