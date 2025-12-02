// 화면ID: U_FA_03
// 화면명: 결제 신청
// 설명: 예약완료 후, 결제수단(계좌/카드)을 선택하고 결제를 진행하는 화면

import { useState, useEffect } from "react"; // [1] React 훅 불러오기
import { useParams, useNavigate, useLocation } from "react-router-dom"; // [2] 라우터 관련 훅
import { createPayment } from "../../../api/paymentApi"; // [3] 결제 생성 API
import { useAuth } from "../../../auth/useAuth"; // [4] 로그인 사용자 인증 훅

// 계좌/카드 API 불러오기
import { fetchAccounts } from "../../../api/accountApi"; // [5-1] 계좌 목록 API
import type { Account } from "../../../api/accountApi"; // [5-2] Account 타입 정의
import { fetchCards } from "../../../api/cardApi"; // [5-3] 카드 목록 API
import type { Card } from "../../../api/cardApi"; // [5-4] Card 타입 정의

// [251013] MUI 디자인 컴포넌트 import (기본 레이아웃 및 입력 UI)
import Box from '@mui/material/Box'; // *[251013] MUI - 전체 컨테이너, 레이아웃 박스
import Typography from '@mui/material/Typography'; // *[251013] MUI - 텍스트 및 제목
import Radio from '@mui/material/Radio'; // *[251013] MUI - 라디오 버튼
import RadioGroup from '@mui/material/RadioGroup'; // *[251013] MUI - 라디오 그룹
import FormControlLabel from '@mui/material/FormControlLabel'; // *[251013] MUI - 라디오/체크박스 라벨
import FormControl from '@mui/material/FormControl'; // *[251013] MUI - 입력폼 그룹
import TextField from '@mui/material/TextField'; // *[251013] MUI - 텍스트 입력필드
import Button from '@mui/material/Button'; // *[251013] MUI - 버튼
import Select from '@mui/material/Select'; // *[251013] MUI - 셀렉트박스(드롭다운)
import MenuItem from '@mui/material/MenuItem'; // *[251013] MUI - 옵션아이템
import InputLabel from '@mui/material/InputLabel'; // *[251013] MUI - 입력 필드 라벨

export default function PaymentForm() {
  const { id } = useParams<{ id: string }>(); // [6] URL 파라미터에서 시설 ID 추출
  const navigate = useNavigate(); // [7] 페이지 이동용 훅
  const { authState } = useAuth(); // [8] 로그인 사용자 정보 가져오기

  const location = useLocation(); // [9] 현재 URL 가져오기
  const query = new URLSearchParams(location.search); // [10] 쿼리스트링 파싱
  const resvId = query.get("resvId"); // [11] 예약 ID 추출
  const money = query.get("money");  // [추가사항] 예약 신청 시 넘겨받은 총 결제금액

  const [paymentMethod, setPaymentMethod] = useState("계좌"); // [12] 결제수단 상태값 ("계좌"/"카드")
  const [accountId, setAccountId] = useState<number | undefined>(); // [13] 선택된 계좌ID
  const [cardId, setCardId] = useState<number | undefined>(); // [14] 선택된 카드ID
  const [loading, setLoading] = useState(false); // [15] 결제 진행중 여부

  // [16] 계좌/카드 상태 배열
  const [accounts, setAccounts] = useState<Account[]>([]); // [16-1] 계좌 목록 상태
  const [cards, setCards] = useState<Card[]>([]); // [16-2] 카드 목록 상태
  const [cardInstallment, setCardInstallment] = useState<number>(0); // 카드 할부 상태값 (기본 0(일시불))

  // [17] 로그인한 사용자 ID로 계좌/카드 불러오기
  useEffect(() => {
    if (authState.memberId) {
      fetchAccounts(authState.memberId)
        .then(res => {
          const sorted = [...res].sort((a, b) => {
            if (a.accountMain === "Y" && b.accountMain !== "Y") return -1;
            if (a.accountMain !== "Y" && b.accountMain === "Y") return 1;
            return 0;
          });
          setAccounts(sorted);
        })
        .catch(console.error);

      fetchCards(authState.memberId)
        .then(res => {
          const sortedCards = [...res].sort((a, b) => {
            if (a.cardMain === "Y" && b.cardMain !== "Y") return -1;
            if (a.cardMain !== "Y" && b.cardMain === "Y") return 1;
            return 0;
          });
          setCards(sortedCards);
        })
        .catch(console.error);
    }
  }, [authState.memberId]);

  // [18] 결제 버튼 클릭 핸들러
  const handlePayment = async () => {
    if (!id || !resvId) return;
    try {
      setLoading(true);
      await createPayment({
        resvId: Number(resvId),
        paymentMethod,
        accountId: paymentMethod === "계좌" ? accountId : undefined,
        cardId: paymentMethod === "카드" ? cardId : undefined,
        cardInstallment: paymentMethod === "카드" ? cardInstallment : 0,
      });
      navigate(`/facilities/${id}/complete?resvId=${resvId}`);
    } catch (err) {
      console.error("결제 실패", err);
      alert("결제 실패. 다시 시도하세요.");
    } finally {
      setLoading(false);
    }
  };

  // [19] 번호 마스킹 함수 (앞 2자리만 노출)
  const maskNumber = (num: string) => {
    if (!num) return "";
    return num.substring(0, 2) + "-****-****";
  };

  return (
    <Box sx={{ p: 6, maxWidth: 640, mx: "auto" }}> {/* *[251013] MUI 컨테이너, 패딩/중앙정렬/최대넓이 */}
      <Typography variant="h5" fontWeight="bold" mb={4}> {/* *[251013] MUI 타이틀, 크고 볼드 */}
        결제 신청
      </Typography>

      {/* [22] 신청자 정보 */}
      <Box mb={4}>
        <Typography><strong>신청자:</strong> {authState.memberName} ({authState.memberId})</Typography>
      </Box>

      {/* 결제금액 표시 */}
      <Box mb={4}>
        <Typography fontWeight="bold" color="error" variant="h6"> {/* *[251013] MUI 금액 강조, 빨간색 */}
          총 결제금액: {money ? Number(money).toLocaleString() : 0} 원
        </Typography>
      </Box>

      {/* [23] 결제수단 선택 라디오 버튼 */}
      <FormControl component="fieldset" sx={{ mb: 4 }}> {/* *[251013] MUI 라디오 버튼 폼 그룹 */}
        <RadioGroup row value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}> {/* *[251013] MUI 라디오 그룹/가로정렬 */}
          <FormControlLabel
            value="계좌"
            control={<Radio color="primary" />} // *[251013] MUI 라디오버튼
            label="계좌"
          />
          <FormControlLabel
            value="카드"
            control={<Radio color="primary" />}
            label="카드"
          />
        </RadioGroup>
      </FormControl>

      {/* [24] 계좌 목록 표시 */}
      {paymentMethod === "계좌" && (
        <FormControl fullWidth sx={{ mb: 4 }}> {/* *[251013] MUI 드롭다운 폼 */}
          <InputLabel>계좌 선택</InputLabel>
          <Select
            value={accountId ?? ""}
            onChange={e => setAccountId(Number(e.target.value))}
            label="계좌 선택"
          >
            {accounts.map(acc => (
              <MenuItem key={acc.accountId} value={acc.accountId}>
                {acc.accountBank} {maskNumber(acc.accountNumber)}
                {acc.accountMain === "Y" &&
                  <Typography component="span" color="primary" sx={{ ml: 1 }}>
                    (대표)
                  </Typography>
                }
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* [25] 카드 목록 + 할부 표시 */}
      {paymentMethod === "카드" && (
        <>
          <FormControl fullWidth sx={{ mb: 4 }}> {/* *[251013] MUI 카드 드롭다운 */}
            <InputLabel>카드 선택</InputLabel>
            <Select
              value={cardId ?? ""}
              onChange={e => setCardId(Number(e.target.value))}
              label="카드 선택"
            >
              {cards.map(card => (
                <MenuItem key={card.cardId} value={card.cardId}>
                  {card.cardBank} {maskNumber(card.cardNumber)}
                  {card.cardMain === "Y" &&
                    <Typography component="span" color="primary" sx={{ ml: 1 }}>
                      (대표)
                    </Typography>
                  }
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 4 }}> {/* *[251013] MUI 할부개월 드롭다운 */}
            <InputLabel>할부 개월</InputLabel>
            <Select
              value={cardInstallment}
              onChange={e => setCardInstallment(Number(e.target.value))}
              label="할부 개월"
            >
              <MenuItem value={0}>일시불</MenuItem>
              <MenuItem value={2}>2개월(무이자)</MenuItem>
              <MenuItem value={3}>3개월(무이자)</MenuItem>
              <MenuItem value={4}>4개월</MenuItem>
              <MenuItem value={5}>5개월</MenuItem>
              <MenuItem value={6}>6개월</MenuItem>
              <MenuItem value={12}>12개월</MenuItem>
            </Select>
          </FormControl>
        </>
      )}

      {/* [26] 결제 버튼 */}
      <Button
        variant="contained"
        color="primary"
        onClick={handlePayment}
        disabled={loading}
        fullWidth
        sx={{ py: 1.5, mt: 2 }} // *[251013] MUI 버튼 스타일, 넓이/높이/여백
      >
        {loading ? "결제 처리중..." : "결제하기"}
      </Button>
    </Box>
  );
}
