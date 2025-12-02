import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useReservation, useReservationDispatch, totalPrice } from "./reservation";

type FormValues = { method: "ACCOUNT" | "CARD"; accountId?: string; cardId?: string };

export default function Payment() {
  const state = useReservation();
  const dispatch = useReservationDispatch();
  const { register, handleSubmit, watch } = useForm<FormValues>({ defaultValues: { method: "ACCOUNT" } });
  const method = watch("method");
  const nav = useNavigate();

  const onSubmit = async (v: FormValues) => {
    dispatch({ type: "SET_PAYMENT_METHOD", method: v.method });
    if (v.method === "ACCOUNT" && v.accountId) dispatch({ type: "SET_ACCOUNT", accountId: v.accountId });
    if (v.method === "CARD" && v.cardId) dispatch({ type: "SET_CARD", cardId: v.cardId });

    const payload = {
      facilityId: state.facilityId,
      date: state.date,
      time: state.time,
      hours: state.hours,
      pricePerHour: state.pricePerHour,
      totalPrice: totalPrice(state),
      payer: state.payer,
      payment: { method: v.method, accountId: v.accountId, cardId: v.cardId },
    };

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("RESERVATION_SAVE_REQUEST", payload);
      if (res.ok) {
        console.log("RESERVATION_SAVE_SUCCESS");
        nav("/done", { replace: true });
      } else {
        console.error("RESERVATION_SAVE_FAILED", res.status);
      }
    } catch (e) {
      console.error("RESERVATION_SAVE_ERROR", e);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2>결제 신청</h2>
      <label><input type="radio" value="ACCOUNT" {...register("method")} /> 계좌</label>
      <label><input type="radio" value="CARD" {...register("method")} /> 카드</label>

      {method === "ACCOUNT" && (
        <div>
          <label>계좌 선택
            <select {...register("accountId", { required: true })}>
              <option value="shinhan-123">신한은행 123-****-****</option>
              <option value="hana-3412">하나은행 3412-****-****</option>
            </select>
          </label>
        </div>
      )}

      {method === "CARD" && (
        <div>
          <label>카드 선택
            <select {...register("cardId", { required: true })}>
              <option value="shin-1234">신한카드 1234-****-****</option>
              <option value="hana-3412">하나카드 3412-****-****</option>
            </select>
          </label>
        </div>
      )}

      <p>총 이용료: {totalPrice(state).toLocaleString()}원</p>
      <button type="submit">결제하기</button>
    </form>
  );
}
