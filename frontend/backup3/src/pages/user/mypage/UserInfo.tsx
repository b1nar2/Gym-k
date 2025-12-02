// 화면ID: U_MY_01
// 화면명: 회원정보 수정
// 설명: 로그인된 사용자의 회원정보를 조회하고 수정할 수 있는 화면

// [1] React 불러오기
// import React from "react"; // [old]
import React, { useState } from "react"; // [251005] 회원정보 수정 기능 추가를 위한 useState 도입

// [2] AuthContext 연동용 커스텀 훅
import { useAuth } from "../../../auth/useAuth";
import api from "../../../api/axios"; // [251005] 백엔드 /api/members/me 수정요청용 axios 추가

// [3] UserInfo 컴포넌트 정의
export default function UserInfo() {
  const { authState } = useAuth(); // [3-1] Context에서 로그인 사용자 정보 가져오기

  //! [251005][회원정보 조회] 초기값을 Context 기반으로 세팅
  const [email, setEmail] = useState(authState.memberEmail || "");
  const [mobile, setMobile] = useState(authState.memberMobile || "");
  const [phone, setPhone] = useState(authState.memberPhone || "");
  const [roadAddress, setRoadAddress] = useState(authState.roadAddress || "");
  const [detailAddress, setDetailAddress] = useState(authState.detailAddress || "");

  //! [251005][회원정보 수정] - 수정 버튼 클릭 시 API 호출
  const handleUpdate = async () => {
    try {
      const payload = {
        memberEmail: email,
        memberMobile: mobile,
        memberPhone: phone,
        roadAddress,
        detailAddress
      };
      await api.put("/api/members/me", payload);
      alert("회원정보가 수정되었습니다."); // [251005] 성공 알림 추가
      console.log("회원정보 수정 완료:", payload);
    } catch (err) {
      console.error("회원정보 수정 실패:", err);
      alert("회원정보 수정 중 오류가 발생했습니다.");
    }
  };

  return (
    <main className="wrapper">
      <div className="container">
        <h1 className="title">회원정보</h1>

        {/*//! [251005][회원정보 조회] */}
        <div className="text-box">
          <p className="text">아이디 : {authState.memberId}</p>
          <p className="text">이름 : {authState.memberName}</p>

          {/*//! <p className="text">이메일 : {authState.memberEmail}</p> // [old] 직접 입력필드로 교체됨 */}
          <label className="block font-semibold mt-3">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 w-full rounded"
          />

          {/*//! <p className="text">권한 : {authState.memberRole}</p> // [old] 권한은 수정 불가 항목으로 표시만 */}
          <p className="text mt-3">권한 : {authState.memberRole}</p>

          {/*//! [251005][회원정보 수정] 추가 입력 필드 */}
          <label className="block font-semibold mt-3">휴대폰번호</label>
          <input
            type="text"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="border p-2 w-full rounded"
          />

          <label className="block font-semibold mt-3">일반전화</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border p-2 w-full rounded"
          />

          <label className="block font-semibold mt-3">도로명주소</label>
          <input
            type="text"
            value={roadAddress}
            onChange={(e) => setRoadAddress(e.target.value)}
            className="border p-2 w-full rounded"
          />

          <label className="block font-semibold mt-3">상세주소</label>
          <input
            type="text"
            value={detailAddress}
            onChange={(e) => setDetailAddress(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>

        {/*//! [251005][회원정보 수정] 저장 버튼 추가 */}
        <button
          onClick={handleUpdate}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
        >
          회원정보 수정하기
        </button>
      </div>
    </main>
  );
}
