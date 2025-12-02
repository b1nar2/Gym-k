//! =============================================================
//! [파일명] CmsUserForm.tsx
//! [설명] CMS 회원 등록·수정 통합 화면 (디자인 최신화: 중앙정렬 + 균일 여백 + 카드형 유지)
//! [작성일] [251024-디자인통합]
//! [특징] 기능(axios, navigate, 취소버튼, 유효성검사 등) 전부 원본 유지
//!         디자인만 form.css 최신 버전 기반으로 통일
//! =============================================================

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../../api/axiosCms";
import "../../../css/all/form.css";

export default function CmsUserForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // [1] 수정모드 여부 판단
  const memberId = searchParams.get("edit");
  const isEdit = !!memberId;
  const [loading, setLoading] = useState(false);

  // [2] 기본 폼 상태
  const [form, setForm] = useState({
    memberId: "",
    memberPw: "",
    memberPwConfirm: "",
    newPw: "",
    memberName: "",
    memberGender: "m",
    memberEmailFront: "",
    memberEmailDomain: "naver.com",
    customDomain: "",
    memberMobile: "",
    memberPhone: "",
    zip: "",
    roadAddress: "",
    jibunAddress: "",
    detailAddress: "",
    memberBirthday: "",
    memberRole: "user",
    adminType: "",
    memberJoindate: "",
  });

  const [idChecked, setIdChecked] = useState(false);

  // =============================================================
  // 📡 [수정모드] 기존 회원 정보 로드
  // =============================================================
  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/api/cms/members/${memberId}`)
      .then((res) => {
        const d = res.data.data;
        const [front, domain] = (d.memberEmail || "").split("@");
        setForm({
          ...form,
          memberId: d.memberId || "",
          memberName: d.memberName || "",
          memberGender: d.memberGender || "m",
          memberEmailFront: front || "",
          memberEmailDomain: domain || "naver.com",
          customDomain: "",
          memberMobile: d.memberMobile || "",
          memberPhone: d.memberPhone || "",
          zip: d.zip || "",
          roadAddress: d.roadAddress || "",
          jibunAddress: d.jibunAddress || "",
          detailAddress: d.detailAddress || "",
          memberBirthday: d.memberBirthday?.substring(0, 10) || "",
          memberRole: d.memberRole || "user",
          adminType: d.adminType || "",
          memberJoindate: d.memberJoindate || "",
          newPw: "",
        });
      })
      .catch((err) => console.error("회원정보 조회 실패:", err));
  }, [isEdit, memberId]);

  // =============================================================
  // ✏️ 입력 핸들러
  // =============================================================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // =============================================================
  // 🔍 [등록] ID 중복확인
  // =============================================================
  const handleIdCheck = async () => {
    if (!form.memberId.trim()) return alert("회원ID를 입력해주세요.");
    try {
      const r = await api.get(`/api/cms/members/check-id`, {
        params: { memberId: form.memberId },
      });
      const exists = r.data?.data?.exists;
      alert(exists ? "이미 존재하는 ID입니다." : "사용 가능한 ID입니다.");
      setIdChecked(!exists);
    } catch {
      alert("ID 중복확인 중 오류가 발생했습니다.");
    }
  };

  // =============================================================
  // ✅ [유효성 검사]
  // =============================================================
  const validate = () => {
    if (!form.memberId.trim()) return alert("회원ID를 입력해주세요.");
    if (!isEdit && !idChecked) return alert("ID 중복확인을 해주세요.");
    if (!isEdit && form.memberPw !== form.memberPwConfirm)
      return alert("비밀번호가 일치하지 않습니다.");
    if (!form.memberEmailFront.trim()) return alert("이메일을 입력해주세요.");
    return true;
  };

  // =============================================================
  // 💾 저장
  // =============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const email =
        form.memberEmailDomain === "custom"
          ? `${form.memberEmailFront}@${form.customDomain}`
          : `${form.memberEmailFront}@${form.memberEmailDomain}`;

      const p = new URLSearchParams();
      p.append("memberName", form.memberName);
      p.append("memberGender", form.memberGender);
      p.append("memberEmail", email);
      p.append("memberMobile", form.memberMobile);
      p.append("memberPhone", form.memberPhone);
      p.append("zip", form.zip);
      p.append("roadAddress", form.roadAddress);
      p.append("jibunAddress", form.jibunAddress);
      p.append("detailAddress", form.detailAddress);
      p.append("memberBirthday", form.memberBirthday);
      p.append("memberRole", form.memberRole);
      p.append("adminType", form.adminType);

      if (isEdit) {
        if (form.newPw.trim()) p.append("newPw", form.newPw);
        await api.put(`/api/cms/members/${memberId}`, p, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        alert("회원정보가 수정되었습니다.");
      } else {
        p.append("memberId", form.memberId);
        p.append("memberPw", form.memberPw);
        await api.post("/api/cms/members", p, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        alert("회원이 등록되었습니다.");
      }
      navigate("/cms/user");
    } catch (err) {
      console.error("회원 저장 실패:", err);
      alert("회원 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // =============================================================
  // 🖥️ 렌더링 (디자인 최신화)
  // =============================================================
  return (
    // <div className="min-h-screen flex justify-center items-start bg-gray-50 py-10">
    <div className="form-container">
      <form
        onSubmit={handleSubmit}
        //className="bg-white w-full max-w-3xl p-10 rounded-xl border border-slate-200 shadow-lg space-y-8"
        className="form-box space-y-8"
      >
        {/* 상단 타이틀 */}
        <div className="text-center border-b pb-6 mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? "👤 회원 정보 수정" : "🆕 회원 등록"}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            CMS 시스템 내 사용자 관리 페이지
          </p>
        </div>

        {/* 회원ID + 중복확인 */}
        {!isEdit && (
          // <div className="flex gap-2 items-center">
          <div 
            className="flex gap-2 items-stretch" // ✅ 핵심: items-stretch → 자식 높이 자동 맞춤
            style={{ alignItems: "stretch" }} // (보조)
          > 
            <div className="flex-1" style={{ flex: "0 0 85%" }}>
              <label className="form-label">회원ID *</label>
              <input
                type="text"
                name="memberId"
                value={form.memberId}
                onChange={handleChange}
                className="form-input w-full"
                required
              />
            </div>
            <button
              type="button"
              onClick={handleIdCheck}
              style={{
                flexShrink: 0,         // 🔹 버튼이 줄어들지 않게
                alignSelf: "flex-end", // 🔹 아래쪽 기준 정렬
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "100px",
                
              }}
              className="common-button-style self-end"
            >
              중복확인
            </button>
          </div>
        )}

        <br/>

        {/* 비밀번호 */}
        {!isEdit && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="form-label">비밀번호 *</label>
              <input
                type="password"
                name="memberPw"
                value={form.memberPw}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <br />
            <div>
              <label className="form-label">비밀번호 확인 *</label>
              <input
                type="password"
                name="memberPwConfirm"
                value={form.memberPwConfirm}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>
        )}

        <br />

        {/* 가입일 / 비밀번호 변경 */}
        {isEdit && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="form-label">가입일</label>
              <input
                type="text"
                value={form.memberJoindate}
                readOnly
                className="form-input bg-gray-100"
              />
            </div>
            <br />
            <div>
              <label className="form-label">비밀번호 변경</label>
              <input
                type="password"
                name="newPw"
                value={form.newPw}
                onChange={handleChange}
                placeholder="변경 시에만 입력"
                className="form-input"
              />
            </div>
          </div>
        )}
        
        {/* 이름 / 성별 */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="form-label">이름 *</label>
            <input
              type="text"
              name="memberName"
              value={form.memberName}
              onChange={handleChange}
              className="form-input"
              required
              readOnly={isEdit}
            />
          </div>
          <br />
          <div>
            <label className="form-label">성별 *</label>
            <select
              name="memberGender"
              value={form.memberGender}
              onChange={handleChange}
              disabled={isEdit}
              className="form-input"
            >
              <option value="m">남성</option>
              <option value="f">여성</option>
            </select>
          </div>
        </div>

        <br />

        {/* 이메일 */}
        <div>
          <label className="form-label">이메일 *</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              name="memberEmailFront"
              placeholder="이메일 아이디"
              value={form.memberEmailFront}
              onChange={handleChange}
              className="form-input flex-1"
              required
            />
            <span className="text-gray-500">@</span>
            <select
              name="memberEmailDomain"
              value={form.memberEmailDomain}
              onChange={handleChange}
              className="form-input w-40"
            >
              <option value="naver.com">naver.com</option>
              <option value="google.com">google.com</option>
              <option value="hanmail.net">hanmail.net</option>
              <option value="kakao.com">kakao.com</option>
              <option value="custom">직접입력</option>
            </select>
            {form.memberEmailDomain === "custom" && (
              <input
                type="text"
                name="customDomain"
                placeholder="직접입력"
                value={form.customDomain}
                onChange={handleChange}
                className="form-input w-40"
              />
            )}
          </div>
        </div>

        <br />

        {/* 연락처 / 생년월일 */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="form-label">휴대폰 *</label>
            <input
              type="text"
              name="memberMobile"
              value={form.memberMobile}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <br />

          <div>
            <label className="form-label">생년월일 *</label>
            <input
              type="date"
              name="memberBirthday"
              value={form.memberBirthday}
              onChange={handleChange}
              className="form-input"
              required
              readOnly={isEdit}
            />
          </div>
        </div>

        <br />

        {/* 주소 */}
        <div className="space-y-3">
          <label className="form-label">주소</label>
          <input
            type="text"
            name="zip"
            value={form.zip}
            onChange={handleChange}
            placeholder="우편번호"
            className="form-input"
          />
          <input
            type="text"
            name="roadAddress"
            value={form.roadAddress}
            onChange={handleChange}
            placeholder="도로명주소"
            className="form-input"
          />
          <input
            type="text"
            name="jibunAddress"
            value={form.jibunAddress}
            onChange={handleChange}
            placeholder="지번주소"
            className="form-input"
          />
          <input
            type="text"
            name="detailAddress"
            value={form.detailAddress}
            onChange={handleChange}
            placeholder="상세주소"
            className="form-input"
          />
        </div>

        <br />

        {/* 권한 / 관리자유형 */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="form-label">회원권한 *</label>
            <select
              name="memberRole"
              value={form.memberRole}
              onChange={handleChange}
              className="form-input"
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          
          <br />

          <div>
            <label className="form-label">관리자유형</label>
            <select
              name="adminType"
              value={form.adminType}
              onChange={handleChange}
              className="form-input"
            >
              <option value="">-- 선택 안함 --</option>
              <option value="책임자">책임자</option>
              <option value="관리자">관리자</option>
              <option value="강사">강사</option>
            </select>
          </div>
        </div>

        {/* 버튼 영역 (기존 취소 버튼 완전 복원) */}
        <br />

        <div className="pt-8 border-t border-slate-200 flex flex-col items-center space-y-4">
          <button
            type="button"
            onClick={() => navigate("/cms/user")}
            style={{ width: "80%", maxWidth: "640px", height: "50px" }}
            className="secondary-button-style"
          >
            취소
          </button>

          <button
            type="submit"
            disabled={loading}
            style={{ width: "85%", maxWidth: "640px", height: "50px" }}
            className="primary-button-style"
          >
            {loading
              ? isEdit
                ? "수정 중..."
                : "등록 중..."
              : isEdit
                ? "수정"
                : "등록"}
          </button>

        </div>
      </form>
    </div>
  );
}
