import { useNavigate } from "react-router-dom";
import { useReservationDispatch } from "./reservation";

export default function FacilityInfo() {
  const nav = useNavigate();
  const dispatch = useReservationDispatch();
  return (
    <div>
      <h2>시설 정보</h2>
      <div style={{ height: 240, border: "1px dashed #ccc", marginBottom: 12, display: "grid", placeItems: "center" }}>
        시설 이미지
      </div>
      <div style={{ height: 240, border: "1px dashed #ccc", marginBottom: 12, display: "grid", placeItems: "center" }}>
        시설 정보
      </div>
      <button
        onClick={() => {
          dispatch({ type: "SET_FACILITY", facilityId: "gym-a" });
          dispatch({ type: "SET_PRICE", pricePerHour: 10000 });
          nav("/apply");
        }}
      >
        예약하기
      </button>
    </div>
  );
}
