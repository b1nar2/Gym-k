import React, { createContext, useContext, useReducer } from "react";

export type PaymentMethod = "ACCOUNT" | "CARD";
export interface Payer { name: string; phone: string; }
export interface ReservationState {
  facilityId: string | null;
  date: string | null;
  time: string | null;
  hours: number;
  pricePerHour: number;
  paymentMethod: PaymentMethod | null;
  accountId?: string;
  cardId?: string;
  payer: Payer;
}
type Action =
  | { type: "SET_FACILITY"; facilityId: string }
  | { type: "SET_SCHEDULE"; date: string; time: string; hours: number }
  | { type: "SET_PRICE"; pricePerHour: number }
  | { type: "SET_PAYMENT_METHOD"; method: PaymentMethod }
  | { type: "SET_ACCOUNT"; accountId: string }
  | { type: "SET_CARD"; cardId: string }
  | { type: "SET_PAYER"; payer: Payer }
  | { type: "RESET" };

const initial: ReservationState = {
  facilityId: null, date: null, time: null, hours: 1, pricePerHour: 10000,
  paymentMethod: null, payer: { name: "", phone: "" }
};
function reducer(state: ReservationState, action: Action): ReservationState {
  switch (action.type) {
    case "SET_FACILITY": return { ...state, facilityId: action.facilityId };
    case "SET_SCHEDULE": return { ...state, date: action.date, time: action.time, hours: action.hours };
    case "SET_PRICE": return { ...state, pricePerHour: action.pricePerHour };
    case "SET_PAYMENT_METHOD": return { ...state, paymentMethod: action.method, accountId: undefined, cardId: undefined };
    case "SET_ACCOUNT": return { ...state, accountId: action.accountId };
    case "SET_CARD": return { ...state, cardId: action.cardId };
    case "SET_PAYER": return { ...state, payer: action.payer };
    case "RESET": return initial;
    default: return state;
  }
}
const StateCtx = createContext<ReservationState>(initial);
const DispatchCtx = createContext<React.Dispatch<Action>>(() => {});
export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}
export const useReservation = () => useContext(StateCtx);
export const useReservationDispatch = () => useContext(DispatchCtx);
export const totalPrice = (s: ReservationState) => s.hours * s.pricePerHour;
