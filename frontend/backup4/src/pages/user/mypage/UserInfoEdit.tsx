// 화면ID: U_MY_01
// 화면명: 회원정보 수정
// 설명: 로그인된 회원의 정보를 수정하는 페이지

// [1] React 및 훅 불러오기
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../auth/useAuth"; // [1-1] 로그인 상태(Context)
import api from "../../../api/axios"; // [1-2] axios 인스턴스

// [2] 회원정보 타입 정의
interface Member {
  memberId: string;
  memberPw?: string;
  newPassword?: string;
  confirmPassword?: string;
  memberEmail: string;
  memberPhone: string;
  memberMobile: string;
  zip: string;
  roadAddress: string;
  detailAddress: string;
}

// [3] 컴포넌트 정의
export default function UserInfoEdit() {
  const { authState } = useAuth(); // [3-1] 로그인 회원 정보
  const [member, setMember] = useState<Member | null>(null); // [3-2] 회원정보 상태
  const [loading, setLoading] = useState(true);

  // [4] 회원정보 조회 (최초 렌더링 시)
  useEffect(() => {
    api
      .get("/api/members/me")
      .then((res) => {
        setMember(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("회원정보 불러오기 실패:", err);
        setLoading(false);
      });
  }, []);

  // [5] 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMember((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  // [6] 저장 버튼 클릭 시
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    // ⚠️ 비밀번호 변경 시 검증
    if (member.newPassword && member.newPassword !== member.confirmPassword) {
      alert("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    try {
      const params = new URLSearchParams();
        params.append("currentPw", member.memberPw || "");   // [백엔드 currentPw]
        params.append("newPw", member.newPassword || "");    // [백엔드 newPw]
        params.append("memberEmail", member.memberEmail || "");
        params.append("memberPhone", member.memberPhone || "");
        params.append("memberMobile", member.memberMobile || "");
        params.append("roadAddress", member.roadAddress || "");
        params.append("detailAddress", member.detailAddress || "");
        params.append("zip", member.zip || "");              // [추가] 우편번호

        await api.put("/api/members/me", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

      alert("회원정보가 수정되었습니다.");
    } catch (err) {
      console.error("회원정보 수정 실패:", err);
      alert("회원정보 수정 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <p>로딩 중...</p>;
  if (!member) return <p>회원정보를 불러올 수 없습니다.</p>;

  // [7] JSX UI
  return (
    <main className="wrapper">
      <div className="container">
        <h1 className="title">회원정보 수정</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 아이디 */}
          <div>
            <label>회원 ID</label>
            <input
              type="text"
              name="memberId"
              value={member.memberId}
              readOnly
              className="border p-2 w-full bg-gray-100"
            />
          </div>

          {/* 기존 비밀번호 */}
          <div>
            <label>기존비밀번호 *</label>
            <input
              type="password"
              name="memberPw"
              value={member.memberPw || ""}
              onChange={handleChange}
              className="border p-2 w-full"
              required
            />
          </div>

          {/* 신규 비밀번호 */}
          <div>
            <label>신규비밀번호 *</label>
            <input
              type="password"
              name="newPassword"
              value={member.newPassword || ""}
              onChange={handleChange}
              className="border p-2 w-full"
            />
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label>비밀번호 확인 *</label>
            <input
              type="password"
              name="confirmPassword"
              value={member.confirmPassword || ""}
              onChange={handleChange}
              className="border p-2 w-full"
            />
          </div>

          {/* 이메일 */}
          <div>
            <label>이메일</label>
            <input
              type="email"
              name="memberEmail"
              value={member.memberEmail}
              onChange={handleChange}
              className="border p-2 w-full"
            />
          </div>

          {/* 전화번호 */}
          <div>
            <label>전화번호</label>
            <input
              type="text"
              name="memberPhone"
              value={member.memberPhone}
              onChange={handleChange}
              className="border p-2 w-full"
            />
          </div>

          {/* 휴대폰 */}
          <div>
            <label>휴대폰 *</label>
            <input
              type="text"
              name="memberMobile"
              value={member.memberMobile}
              onChange={handleChange}
              className="border p-2 w-full"
              required
            />
          </div>

          {/* 주소 */}
          <div className="flex gap-2">
            <input
              type="text"
              name="zip"
              value={member.zip}
              onChange={handleChange}
              placeholder="우편번호"
              className="border p-2 w-1/3"
            />
            <input
              type="text"
              name="roadAddress"
              value={member.roadAddress}
              onChange={handleChange}
              placeholder="도로명주소"
              className="border p-2 flex-1"
            />
          </div>

          <div>
            <input
              type="text"
              name="detailAddress"
              value={member.detailAddress}
              onChange={handleChange}
              placeholder="상세주소"
              className="border p-2 w-full"
            />
          </div>

          {/* 저장 버튼 */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded mt-4"
          >
            완료
          </button>
        </form>
      </div>
    </main>
  );
}
