import { useNavigate } from "react-router-dom";
import { useReservationDispatch } from "./reservation";

export default function Complete() {
  const nav = useNavigate();
  const dispatch = useReservationDispatch();
  return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <h2>접수가 완료되었습니다.</h2>
      <button onClick={() => { dispatch({ type: "RESET" }); nav("/"); }}>
        메인 화면으로 이동
      </button>
    </div>
  );
}
