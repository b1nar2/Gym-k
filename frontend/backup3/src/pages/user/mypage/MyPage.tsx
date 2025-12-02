// 화면ID: U_MY_00 // 화면 식별자입니다.
// 화면명: 마이페이지 // 화면명(관리/참고용)입니다.
// 설명: 로그인된 사용자의 회원정보 및 결제내역(예약 상태일 경우 취소 가능) 관리 화면 // 화면 설명입니다.

import React, { useState, useEffect, useMemo } from "react"; // React 훅(useState/useEffect/useMemo) 임포트
import { useNavigate } from "react-router-dom"; // 페이지 이동을 위한 useNavigate 임포트
import { useAuth } from "../../../auth/useAuth"; // 인증(로그인) 상태를 읽는 커스텀 훅 임포트
import api from "../../../api/axios"; // Axios 인스턴스 임포트 (공통 설정된 인스턴스 사용)

// [1] 결제내역 DTO 정의 (백엔드 응답 구조와 매칭) 
interface Payment { // Payment 타입 시작
  paymentId: number; // 결제 PK
  resvId: number; // 연관된 예약 ID
  paymentMethod: string; // 결제수단(예: account/card)
  paymentMoney: number; // 결제 금액(숫자)
  paymentStatus: string; // 결제 상태(예약/완료/취소 등)
  paymentDate: string; // 결제 일시(문자열)
} // Payment 타입 끝

// [2] 계좌 DTO 정의
interface Account { // Account 타입 시작
  accountId: number; // 계좌 PK
  accountBank: string; // 은행명
  accountNumber: string; // 계좌번호
  accountMain: boolean; // (사용되지만 이제 UI에서 대표 구간 제거됨) 대표 여부 플래그
  accountRegDate: string; // 등록일
} // Account 타입 끝

// [3] 카드 DTO 정의
interface Card { // Card 타입 시작
  cardId: number; // 카드 PK
  cardBank: string; // 카드사명
  cardNumber: string; // 카드번호
  cardMain: boolean; // (사용되지만 UI에서 대표 구간 제거됨) 대표 여부 플래그
  cardRegDate: string; // 등록일
} // Card 타입 끝

// [4] MyPage 컴포넌트 정의 (기본 export)
export default function MyPage() { // 컴포넌트 시작
  const { authState } = useAuth(); // 로그인된 사용자 상태를 authState에서 읽음
  const navigate = useNavigate(); // 페이지 이동 함수 획득

  // [5] 로컬 상태 정의
  const [tab, setTab] = useState("info"); // 현재 활성 탭: "info" | "payment" | "method"
  const [payments, setPayments] = useState<Payment[]>([]); // 결제내역 리스트 상태
  const [accounts, setAccounts] = useState<Account[]>([]); // 계좌 리스트 상태
  const [cards, setCards] = useState<Card[]>([]); // 카드 리스트 상태
  const [methodType, setMethodType] = useState<"account" | "card">("account"); // 결제수단 유형 상태
  const [showModal, setShowModal] = useState(false); // 등록 모달 표시 여부 상태
  const [form, setForm] = useState({ bank: "", number: "" }); // 등록 폼 필드 상태

  // [6] 입력 변경 핸들러: 모달 폼 입력값 업데이트
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value }); // 폼 상태 병합 업데이트

  // [7] 회원정보 조회 (authState에 이름이 없을 때만 호출)
  useEffect(() => { // effect 시작
    if (!authState.memberName) { // 회원 이름이 비어있다면 API로 내 정보 조회
      api.get("/api/members/me") // 내 정보 호출
        .then(res => console.log("회원정보:", res.data.data)) // 성공 시 콘솔에 로깅(비파괴적)
        .catch(err => console.error("회원정보 조회 실패:", err)); // 실패 시 에러 로깅
    } // if 끝
  }, [authState.memberId]); // authState.memberId 변경 시 재실행

  // [8] 결제내역 조회 (결제 탭으로 전환될 때만 호출)
  useEffect(() => { // effect 시작
    if (tab === "payment") { // 탭이 결제내역이면
      api.get("/api/payments") // 결제내역 API 호출
        .then(res => setPayments(res.data.data)) // 응답 데이터로 상태 갱신
        .catch(err => console.error("결제내역 조회 실패:", err)); // 실패 시 로깅
    } // if 끝
  }, [tab]); // tab 변경 시 재실행

  // [9] 결제수단(계좌/카드) 조회: 대표/그 외 분리 UI는 제거, 전체를 '소지 중인'으로 표기
  useEffect(() => { // effect 시작
    if (tab === "method") { // 탭이 결제수단이면
      const fetchList = async () => { // 비동기 함수 정의
        try { // try 시작
          if (methodType === "account") { // 계좌 타입이면
            const [mainRes, subRes] = await Promise.all([ // 서버에서 대표/서브 둘 다 가져옴
              api.get("/api/accounts/main"), // 대표 계좌 API 호출(백엔드 규격 유지)
              api.get("/api/accounts/sub"), // 일반 계좌 API 호출(백엔드 규격 유지)
            ]); // Promise.all 끝
            const merged = [...(mainRes.data.data ?? []), ...(subRes.data.data ?? [])]; // 둘을 합침
            setAccounts(merged); // 합쳐진 목록을 상태에 저장 (UI에서는 '소지 중인 계좌'로 표기)
          } else { // 카드 타입인 경우
            const [mainRes, subRes] = await Promise.all([ // 대표/서브 카드 가져오기
              api.get("/api/cards/main"), // 대표 카드 API 호출
              api.get("/api/cards/sub"), // 일반 카드 API 호출
            ]); // Promise.all 끝
            const mergedCards = [...(mainRes.data.data ?? []), ...(subRes.data.data ?? [])]; // 합침
            setCards(mergedCards); // 상태에 저장 (UI에서는 '소지 중인 카드'로 표기)
          } // if-else 끝
        } catch (err) { // 에러 처리
          console.error("[결제수단] 조회 실패:", err); // 에러 로깅
        } // try-catch 끝
      }; // fetchList 함수 끝
      fetchList(); // 함수 호출
    } // if 끝
  }, [tab, methodType]); // tab 또는 methodType 변경 시 재실행

  // [10] 결제 취소 처리 핸들러
  const handleCancelPayment = async (paymentId: number) => { // 함수 시작
    if (!window.confirm("해당 결제를 취소하시겠습니까?")) return; // 사용자 확인창
    try { // 시도
      await api.post(`/api/payments/${paymentId}/cancel`); // 취소 API 호출
      alert("결제건이 취소되었습니다."); // 성공 알림
      const res = await api.get("/api/payments"); // 최신 결제내역 재조회
      setPayments(res.data.data); // 상태 갱신
    } catch (err) { // 실패 시
      console.error("결제 취소 실패:", err); // 에러 로깅
    } // try-catch 끝
  }; // handleCancelPayment 끝

  // [11] 대표계좌 변경 핸들러 (백엔드 엔드포인트 호출 유지)
  const handleSetMainAccount = async (id: number) => { // 함수 시작
    try { // 시도
      await api.patch(`/api/accounts/${id}/main`); // 대표계좌로 설정하는 API 호출
      const [mainRes, subRes] = await Promise.all([ // 변경 후 목록 재조회
        api.get("/api/accounts/main"), // 대표 목록
        api.get("/api/accounts/sub"), // 일반 목록
      ]); // Promise.all 끝
      setAccounts([...mainRes.data.data, ...subRes.data.data]); // 병합하여 상태 갱신
      alert("대표계좌가 변경되었습니다."); // 사용자 알림
    } catch (err) { // 실패 시
      console.error("[계좌대표 변경 실패]:", err); // 에러 로깅
    } // try-catch 끝
  }; // handleSetMainAccount 끝

  // [12] 계좌 삭제 핸들러
  const handleDeleteAccount = async (id: number) => { // 함수 시작
    if (!window.confirm("이 계좌를 삭제하시겠습니까?")) return; // 확인
    try { // 시도
      await api.delete(`/api/accounts/${id}`); // 삭제 API 호출
      const [mainRes, subRes] = await Promise.all([ // 삭제 후 목록 재조회
        api.get("/api/accounts/main"),
        api.get("/api/accounts/sub"),
      ]); // Promise.all 끝
      setAccounts([...mainRes.data.data, ...subRes.data.data]); // 상태 갱신
    } catch (err) { // 실패 시
      console.error("[계좌삭제 실패]:", err); // 에러 로깅
    } // try-catch 끝
  }; // handleDeleteAccount 끝

  // [13] 대표카드 변경 핸들러 (백엔드 엔드포인트 호출 유지)
  const handleSetMainCard = async (id: number) => { // 함수 시작
    try { // 시도
      await api.patch(`/api/cards/${id}/main`); // 대표카드로 설정 API 호출
      const [mainRes, subRes] = await Promise.all([ // 변경 후 재조회
        api.get("/api/cards/main"),
        api.get("/api/cards/sub"),
      ]); // Promise.all 끝
      setCards([...mainRes.data.data, ...subRes.data.data]); // 상태 갱신
      alert("대표카드가 변경되었습니다."); // 알림
    } catch (err) { // 실패 시
      console.error("[카드대표 변경 실패]:", err); // 에러 로깅
    } // try-catch 끝
  }; // handleSetMainCard 끝

  // [14] 카드 삭제 핸들러
  const handleDeleteCard = async (id: number) => { // 함수 시작
    if (!window.confirm("이 카드를 삭제하시겠습니까?")) return; // 확인
    try { // 시도
      await api.delete(`/api/cards/${id}`); // 삭제 API 호출
      const [mainRes, subRes] = await Promise.all([ // 삭제 후 재조회
        api.get("/api/cards/main"),
        api.get("/api/cards/sub"),
      ]); // Promise.all 끝
      setCards([...mainRes.data.data, ...subRes.data.data]); // 상태 갱신
    } catch (err) { // 실패 시
      console.error("[카드삭제 실패]:", err); // 에러 로깅
    } // try-catch 끝
  }; // handleDeleteCard 끝

  // [15] 결제수단 등록 핸들러 (계좌/카드 공통)
  const handleSubmit = async () => { // 함수 시작
    if (!form.bank.trim() || !form.number.trim()) { // 입력 검증
      alert("모든 필드를 입력하세요."); // 경고
      return; // 종료
    } // if 끝
    try { // 시도
      if (methodType === "account") { // 계좌 등록 분기
        const formData = new URLSearchParams();
        formData.append("accountBank", form.bank);
        formData.append("accountNumber", form.number);
        await api.post("/api/accounts", formData, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }); // 계좌 등록 API 호출 (tsx식 전송방식)
        const [mainRes, subRes] = await Promise.all([ // 등록 후 목록 재조회
          api.get("/api/accounts/main"),
          api.get("/api/accounts/sub"),
        ]); // Promise.all 끝
        setAccounts([...mainRes.data.data, ...subRes.data.data]); // 상태 갱신
        alert("계좌가 등록되었습니다."); // 알림
      } else { // 카드 등록 분기
        const formData = new URLSearchParams();
        formData.append("cardBank", form.bank);
        formData.append("cardNumber", form.number);
        await api.post("/api/cards", formData, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }); // 카드 등록 API 호출 (tsx 전송방식)
        const [mainRes, subRes] = await Promise.all([ // 등록 후 재조회
          api.get("/api/cards/main"),
          api.get("/api/cards/sub"),
        ]); // Promise.all 끝
        setCards([...mainRes.data.data, ...subRes.data.data]); // 상태 갱신
        alert("카드가 등록되었습니다."); // 알림
      } // if-else 끝
      setShowModal(false); // 모달 닫기
      setForm({ bank: "", number: "" }); // 폼 초기화
    } catch (err) { // 실패 시
      console.error("[등록 실패]:", err); // 에러 로깅
      alert("등록 중 오류가 발생했습니다."); // 사용자 경고
    } // try-catch 끝
  }; // handleSubmit 끝

  // [16] 모달 닫기
  const closeModal = () => { // 함수 시작
    setShowModal(false); // 모달 숨김
    setForm({ bank: "", number: "" }); // 폼 초기화
  }; // closeModal 끝

  // [17] '소지 중인' 목록을 위한 메모이제이션 (대표/일반 구분을 UI에서 제거했으므로 전체 목록을 사용)
  const owningAccounts = useMemo(() => accounts, [accounts]); // 소지 중인 계좌 목록(단순 참조)
  const owningCards = useMemo(() => cards, [cards]); // 소지 중인 카드 목록(단순 참조)

  // [18] JSX 렌더링 시작
  return ( // 반환 시작
    <main className="wrapper"> {/* 최상위 wrapper 컨테이너 */}
      <div className="container"> {/* 내부 컨테이너 */}
        <h1 className="title">마이페이지</h1> {/* 화면 타이틀 */}

        {/* 탭 */}
        <div className="flex gap-4 my-4"> {/* 탭 버튼 그룹 */}
          <button onClick={() => setTab("info")} className={tab === "info" ? "font-bold" : ""}>회원정보</button> {/* 회원정보 탭 */}
          <button onClick={() => setTab("payment")} className={tab === "payment" ? "font-bold" : ""}>결제내역</button> {/* 결제내역 탭 */}
          <button onClick={() => setTab("method")} className={tab === "method" ? "font-bold" : ""}>결제수단</button> {/* 결제수단 탭 */}
        </div>

        {/* 회원정보 블록 */}
        {tab === "info" && ( // info 탭일 때 렌더
          <> {/* fragment 시작 */}
            <ul> {/* 회원정보 리스트 */}
              <li>아이디: {authState.memberId}</li> {/* 회원ID 출력 */}
              <li>이름: {authState.memberName}</li> {/* 이름 출력 */}
              <li>성별: {authState.memberGender}</li> {/* 성별 출력 */}
              <li>이메일: {authState.memberEmail}</li> {/* 이메일 출력 */}
              <li>휴대폰: {authState.memberMobile}</li> {/* 휴대폰 출력 */}
              <li>전화번호: {authState.memberPhone}</li> {/* 전화번호 출력 */}
              <li>주소: {authState.roadAddress} {authState.detailAddress}</li> {/* 주소 출력 */}
              <li>생일: {authState.memberBirthday}</li> {/* 생일 출력 */}
            </ul>
            <div className="mt-4"> {/* 버튼 영역 마진 */}
              <button onClick={() => navigate("/mypage/edit")} className="px-4 py-2 bg-blue-600 text-white rounded">회원정보 수정</button> {/* 정보 수정 버튼 */}
            </div>
          </> /* fragment 끝 */
        )}

        {/* 결제내역 블록 */}
        {tab === "payment" && ( // payment 탭일 때 렌더
          <table className="w-full border mt-4 text-sm"> {/* 결제내역 테이블 */}
            <thead> {/* 테이블 헤더 */}
              <tr className="bg-gray-200"> {/* 헤더 행 */}
                <th>결제ID</th><th>예약ID</th><th>수단</th><th>금액</th><th>상태</th><th>일자</th><th>취소</th> {/* 헤더 컬럼 */}
              </tr>
            </thead>
            <tbody> {/* 테이블 바디 */}
              {payments.map((p) => ( // 결제 항목 반복 렌더
                <tr key={p.paymentId}> {/* 결제 행(고유키 사용) */}
                  <td>{p.paymentId}</td> {/* 결제ID 셀 */}
                  <td>{p.resvId}</td> {/* 예약ID 셀 */}
                  <td>{p.paymentMethod}</td> {/* 결제수단 셀 */}
                  <td>{p.paymentMoney.toLocaleString()}원</td> {/* 금액 포맷팅 출력 */}
                  <td>{p.paymentStatus}</td> {/* 상태 출력 */}
                  <td>{p.paymentDate}</td> {/* 일자 출력 */}
                  <td> {/* 취소 버튼 칸 */}
                    {p.paymentStatus === "예약" ? ( // 예약 상태일 때만 취소 버튼 노출
                      <button onClick={() => handleCancelPayment(p.paymentId)} className="px-2 py-1 bg-red-500 text-white rounded">취소</button> // 취소 버튼
                    ) : <span className="text-gray-400">-</span>} {/* 그 외는 대시 표시 */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 결제수단 블록: '대표' 구간 제거, '소지 중인'으로 표기 변경 */}
        {tab === "method" && ( // method 탭일 때 렌더
          <div> {/* 결제수단 컨테이너 */}
            <div className="flex gap-4 my-3"> {/* 타입 선택 버튼 그룹 */}
              <button onClick={() => setMethodType("account")} className={methodType === "account" ? "font-bold underline" : ""}>계좌</button> {/* 계좌 선택 */}
              <button onClick={() => setMethodType("card")} className={methodType === "card" ? "font-bold underline" : ""}>카드</button> {/* 카드 선택 */}
            </div>

            {/* 소지 중인 계좌 섹션 (대표 구간 제거됨) */}
            {methodType === "account" && ( // 계좌 타입일 때 렌더
              <> {/* fragment 시작 */}
                <h3 className="font-semibold mb-2">소지 중인 계좌</h3> {/* 제목 변경: '소지 중인 계좌' */}
                <li className="font-semibold mb-2">대표계좌로 등록할 경우 최상단에 조회됩니다.</li>
                <li></li>

                {owningAccounts.length > 0 ? ( // 계좌가 하나라도 있으면 테이블로 보여줌
                  <table className="w-full border text-sm"> {/* 계좌 테이블 */}
                    <thead><tr className="bg-gray-200"><th>은행</th><th>계좌번호</th><th>등록일</th><th>관리</th></tr></thead> {/* 헤더 */}
                    <tbody> {/* 바디 시작 */}
                      {owningAccounts.map((acc) => ( // 계좌 항목 반복
                        <tr key={acc.accountId}> {/* 행(고유키) */}
                          <td>{acc.accountBank}</td> {/* 은행명 셀 */}
                          <td>{acc.accountNumber.replace(/^(\d{2})(.*)$/, (_, f, rest) => `${f}${"*".repeat(rest.length)}`)}</td> {/* 계좌번호 마스킹 출력 */}
                          {/* <td>{acc.accountRegDate}</td>  */}{/* 등록일 출력 */}
                          <td>{acc.accountRegDate.split("T")[0]}</td> {/* 등록일(시간 제외, 연-월-일만 출력) */}
                          <td> {/* 관리 버튼 칸 */}
                            <button onClick={() => handleSetMainAccount(acc.accountId)} className="px-2 py-1 bg-green-500 text-white rounded">대표</button> {/* 대표로 설정 버튼(백엔드 호출 유지) */}
                            <button onClick={() => handleDeleteAccount(acc.accountId)} className="px-2 py-1 bg-red-500 text-white rounded ml-2">삭제</button> {/* 삭제 버튼 */}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div className="text-gray-500">소지 중인 계좌가 없습니다.</div>} {/* 계좌 없을 때 메시지 */}
              </> /* fragment 끝 */
            )}

            {/* 소지 중인 카드 섹션 (대표 구간 제거됨) */}
            {methodType === "card" && ( // 카드 타입일 때 렌더
              <> {/* fragment 시작 */}
                <h3 className="font-semibold mb-2">소지 중인 카드</h3> {/* 제목 변경: '소지 중인 카드' */}
                <li className="font-semibold mb-2">대표카드로 등록할 경우 최상단에 조회됩니다.</li>
                <li></li>

                {owningCards.length > 0 ? ( // 카드가 있으면 테이블로 출력
                  <table className="w-full border text-sm"> {/* 카드 테이블 */}
                    <thead><tr className="bg-gray-200"><th>카드사</th><th>카드번호</th><th>등록일</th><th>관리</th></tr></thead> {/* 헤더 */}
                    <tbody> {/* 바디 시작 */}
                      {owningCards.map((cd) => ( // 카드 항목 반복
                        <tr key={cd.cardId}> {/* 행(고유키) */}
                          <td>{cd.cardBank}</td> {/* 카드사명 출력 */}
                          <td>{cd.cardNumber.replace(/^(\d{2})(.*)$/, (_, f, rest) => `${f}${"*".repeat(rest.length)}`)}</td> {/* 카드번호 마스킹 출력 */}
                          {/* <td>{cd.cardRegDate}</td> */}  {/* 등록일 출력 */}
                          <td>{cd.cardRegDate.split("T")[0]}</td> {/* 등록일(시간 제외, 연-월-일만 출력) */}
                          <td> {/* 관리 버튼 칸 */}
                            <button onClick={() => handleSetMainCard(cd.cardId)} className="px-2 py-1 bg-green-500 text-white rounded">대표</button> {/* 대표로 설정 버튼(백엔드 호출 유지) */}
                            <button onClick={() => handleDeleteCard(cd.cardId)} className="px-2 py-1 bg-red-500 text-white rounded ml-2">삭제</button> {/* 삭제 버튼 */}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div className="text-gray-500">소지 중인 카드가 없습니다.</div>} {/* 카드 없을 때 메시지 */}
              </> /* fragment 끝 */
            )}

            {/* 등록 버튼 */}
            <div className="text-center mt-4"> {/* 정렬 및 여백 */}
              <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded">{methodType === "account" ? "계좌 추가" : "카드 추가"}</button> {/* 등록 모달 오픈 버튼 */}
            </div>

          </div>
        )}

        {/* 등록 모달 */}
        {showModal && ( // 모달 표시 여부
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"> {/* 오버레이 */}
            <div className="bg-white p-6 rounded-lg shadow-lg w-96"> {/* 모달 박스 */}
              <h3 className="text-lg font-bold mb-4">{methodType === "account" ? "계좌 등록" : "카드 등록"}</h3> {/* 모달 제목 */}
              <label className="block mb-2 font-semibold"> {/* 은행/카드사 입력 라벨 */}
                {methodType === "account" ? "은행명" : "카드사명"} {/* 라벨 텍스트 */}
                <input type="text" name="bank" value={form.bank} onChange={handleInput} className="border rounded w-full px-2 py-1 mt-1" /> {/* 은행/카드사 입력 필드 */}
              </label>
              <label className="block mb-4 font-semibold"> {/* 번호 입력 라벨 */}
                {methodType === "account" ? "계좌번호" : "카드번호"} {/* 라벨 텍스트 */}
                <input type="text" name="number" value={form.number} onChange={handleInput} className="border rounded w-full px-2 py-1 mt-1" /> {/* 계좌/카드 번호 입력 필드 */}
              </label>
              <div className="flex justify-end gap-2"> {/* 버튼 그룹 정렬 */}
                <button onClick={closeModal} className="px-4 py-2 bg-gray-400 text-white rounded">취소</button> {/* 취소 버튼 */}
                <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">등록</button> {/* 등록 버튼 */}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  ); // return 끝
} // 컴포넌트 끝
