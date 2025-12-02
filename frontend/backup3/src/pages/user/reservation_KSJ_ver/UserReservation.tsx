import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useReservationDispatch } from "./reservation";

type FormValues = {
  date: string;
  timeHour: string;           // "00" ~ "23"
  timeMin: "00" | "30";       // 00분/30분만
  hours: number;
  name: string;
  phone: string;
};

const hoursOptions = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);

export default function UserReservation() {
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      date: "",
      timeHour: "13",
      timeMin: "00",
      hours: 3,
      name: "홍길동",
      phone: "010-0000-0000",
    },
  });
  const dispatch = useReservationDispatch();
  const nav = useNavigate();

  const onSubmit = (v: FormValues) => {
    const time = `${v.timeHour}:${v.timeMin}`; // HH:MM로 조합
    dispatch({ type: "SET_SCHEDULE", date: v.date, time, hours: Number(v.hours) });
    dispatch({ type: "SET_PAYER", payer: { name: v.name, phone: v.phone } });
    nav("/pay");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2>예약 신청</h2>

      <label>
        날짜
        <input type="date" {...register("date", { required: true })} />
      </label>

      <label>
        시간
        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <select {...register("timeHour", { required: true })}>
            {hoursOptions.map((h) => (
              <option key={h} value={h}>
                {h}시
              </option>
            ))}
          </select>
          <select {...register("timeMin", { required: true })}>
            <option value="00">00분</option>
            <option value="30">30분</option>
          </select>
        </span>
      </label>

      <label>
        이용시간
        <input type="number" min={1} max={8} {...register("hours", { valueAsNumber: true })} />
      </label>

      <label>
        대표자
        <input {...register("name", { required: true })} />
      </label>

      <label>
        Phone
        <input {...register("phone", { required: true })} />
      </label>

      <button type="submit">결제하기</button>
    </form>
  );
}
