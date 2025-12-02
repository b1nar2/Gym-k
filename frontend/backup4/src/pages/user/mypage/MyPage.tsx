// 화면ID: U_MY_00 // 화면 식별자입니다.
// 화면명: 마이페이지 // 화면명(관리/참고용)입니다.
// 설명: 로그인된 사용자의 회원정보 및 결제내역(예약 상태일 경우 취소 가능) 관리 화면 // 화면 설명입니다.

import React, { useState, useEffect, useMemo } from "react"; // React 훅(useState/useEffect/useMemo) 임포트
import { useNavigate } from "react-router-dom"; // 페이지 이동을 위한 useNavigate 임포트
import { useAuth } from "../../../auth/useAuth"; // 인증(로그인) 상태를 읽는 커스텀 훅 임포트
import api from "../../../api/axios"; // Axios 인스턴스 임포트 (공통 설정된 인스턴스 사용)

import Box from '@mui/material/Box'; // * 251016 레이아웃 박스
import Typography from '@mui/material/Typography'; // * 251016 텍스트
import Button from '@mui/material/Button'; // * 251016 버튼
import Table from '@mui/material/Table'; // * 251016 테이블
import TableBody from '@mui/material/TableBody'; // * 251016 테이블바디
import TableCell from '@mui/material/TableCell'; // * 251016 테이블셀
import TableContainer from '@mui/material/TableContainer'; // * 251016 테이블컨테이너
import TableHead from '@mui/material/TableHead'; // * 251016 테이블헤드
import TableRow from '@mui/material/TableRow'; // * 251016 테이블로우
import Paper from '@mui/material/Paper'; // * 251016 페이퍼
import Modal from '@mui/material/Modal'; // * 251016 모달
import TextField from '@mui/material/TextField'; // * 251016 텍스트필드

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

    // * 251016 모달 스타일 정의 (반드시 컴포넌트 함수 내에 선언)
  const modalStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    borderRadius: 2,
    boxShadow: 24,
    p: 4,
  }

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
  return (
    <Box sx={{ p: 4, maxWidth: 960, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>마이페이지</Typography>

      {/* 탭 버튼 그룹 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant={tab === "info" ? "contained" : "outlined"} onClick={() => setTab("info")}>회원정보</Button>
        <Button variant={tab === "payment" ? "contained" : "outlined"} onClick={() => setTab("payment")}>결제내역</Button>
        <Button variant={tab === "method" ? "contained" : "outlined"} onClick={() => setTab("method")}>결제수단</Button>
      </Box>

      {/* 회원정보 탭 */}
      {tab === "info" && (
        <Box>
          <ul>
            <li>아이디: {authState.memberId}</li>
            <li>이름: {authState.memberName}</li>
            <li>성별: {authState.memberGender}</li>
            <li>이메일: {authState.memberEmail}</li>
            <li>휴대폰: {authState.memberMobile}</li>
            <li>전화번호: {authState.memberPhone}</li>
            <li>주소: {authState.roadAddress} {authState.detailAddress}</li>
            <li>생일: {authState.memberBirthday}</li>
          </ul>
          <Box mt={2}>
            <Button variant="contained" color="primary" onClick={() => navigate("/mypage/edit")}>
              회원정보 수정
            </Button>
          </Box>
        </Box>
      )}

      {/* 결제내역 탭 */}
      {tab === "payment" && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>결제ID</TableCell>
                <TableCell>예약ID</TableCell>
                <TableCell>수단</TableCell>
                <TableCell>금액</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>일자</TableCell>
                <TableCell>취소</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.paymentId}>
                  <TableCell>{p.paymentId}</TableCell>
                  <TableCell>{p.resvId}</TableCell>
                  <TableCell>{p.paymentMethod}</TableCell>
                  <TableCell>{p.paymentMoney.toLocaleString()}원</TableCell>
                  <TableCell>{p.paymentStatus}</TableCell>
                  <TableCell>{p.paymentDate}</TableCell>
                  <TableCell>
                    {p.paymentStatus === "예약" ? (
                      <Button variant="outlined" color="error" size="small" onClick={() => handleCancelPayment(p.paymentId)}>
                        취소
                      </Button>
                    ) : (
                      <Typography color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 결제수단 탭 */}
      {tab === "method" && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
            <Button variant={methodType === "account" ? "contained" : "outlined"} onClick={() => setMethodType("account")}>
              계좌
            </Button>
            <Button variant={methodType === "card" ? "contained" : "outlined"} onClick={() => setMethodType("card")}>
              카드
            </Button>
          </Box>

          {/* 소지 중인 계좌/카드 리스트 */}
          {methodType === "account" && (
            <>
              <Typography variant="h6" mb={1}>소지 중인 계좌</Typography>
              {owningAccounts.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell>은행</TableCell>
                        <TableCell>계좌번호</TableCell>
                        <TableCell>등록일</TableCell>
                        <TableCell>관리</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {owningAccounts.map((acc) => (
                        <TableRow key={acc.accountId}>
                          <TableCell>{acc.accountBank}</TableCell>
                          <TableCell>{acc.accountNumber.replace(/^(\d{2})(.*)$/, (_, f, rest) => `${f}${"*".repeat(rest.length)}`)}</TableCell>
                          <TableCell>{acc.accountRegDate.split("T")[0]}</TableCell>
                          <TableCell>
                            <Button variant="outlined" color="success" size="small" onClick={() => handleSetMainAccount(acc.accountId)}>대표</Button>
                            <Button variant="outlined" color="error" size="small" sx={{ ml: 1 }} onClick={() => handleDeleteAccount(acc.accountId)}>삭제</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">소지 중인 계좌가 없습니다.</Typography>
              )}
            </>
          )}

          {methodType === "card" && (
            <>
              <Typography variant="h6" mb={1}>소지 중인 카드</Typography>
              {owningCards.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell>카드사</TableCell>
                        <TableCell>카드번호</TableCell>
                        <TableCell>등록일</TableCell>
                        <TableCell>관리</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {owningCards.map((cd) => (
                        <TableRow key={cd.cardId}>
                          <TableCell>{cd.cardBank}</TableCell>
                          <TableCell>{cd.cardNumber.replace(/^(\d{2})(.*)$/, (_, f, rest) => `${f}${"*".repeat(rest.length)}`)}</TableCell>
                          <TableCell>{cd.cardRegDate.split("T")[0]}</TableCell>
                          <TableCell>
                            <Button variant="outlined" color="success" size="small" onClick={() => handleSetMainCard(cd.cardId)}>대표</Button>
                            <Button variant="outlined" color="error" size="small" sx={{ ml: 1 }} onClick={() => handleDeleteCard(cd.cardId)}>삭제</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">소지 중인 카드가 없습니다.</Typography>
              )}
            </>
          )}

          <Box textAlign="center" mt={3}>
            <Button variant="contained" onClick={() => setShowModal(true)}>
              {methodType === "account" ? "계좌 추가" : "카드 추가"}
            </Button>
          </Box>

          <Modal open={showModal} onClose={closeModal} aria-labelledby="modal-title">
            <Box sx={modalStyle}>
              <Typography id="modal-title" variant="h6" component="h2" mb={2}>
                {methodType === "account" ? "계좌 등록" : "카드 등록"}
              </Typography>
              <TextField
                label={methodType === "account" ? "은행명" : "카드사명"}
                name="bank"
                value={form.bank}
                onChange={handleInput}
                fullWidth
                margin="normal"
              />
              <TextField
                label={methodType === "account" ? "계좌번호" : "카드번호"}
                name="number"
                value={form.number}
                onChange={handleInput}
                fullWidth
                margin="normal"
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
                <Button variant="outlined" onClick={closeModal}>취소</Button>
                <Button variant="contained" onClick={handleSubmit}>등록</Button>
              </Box>
            </Box>
          </Modal>
        </Box>
      )}

    </Box>
  );
}