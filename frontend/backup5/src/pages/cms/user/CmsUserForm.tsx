//! [파일명] CmsMemberForm.tsx
//! [설명] CMS 회원 등록·수정 통합 화면
//! [백엔드] CmsMemberController.java → POST/PUT/GET /api/cms/members
//! [작성일] [251007]

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../../api/axiosCms"; // CMS 전용 axios 인스턴스

export default function CmsMemberForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // [정보가져오기] URL 파라미터로 ?edit=hong8 처럼 들어올 경우 수정 모드로 판단
  const memberId = searchParams.get("edit");
  const isEdit = !!memberId; // memberId가 존재하면 true → 수정 모드

  const [loading, setLoading] = useState(false);

  // [정보가져오기] 기본 폼 상태 (등록·수정 공용)
  const [form, setForm] = useState({
    memberId: "",
    memberPw: "",
    memberPwConfirm: "", // [등록] 비밀번호 확인용
    newPw: "", // [수정] 변경용 비밀번호
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
    memberJoindate: "", // [수정] 가입일 표시용
  });

  const [idChecked, setIdChecked] = useState(false); // [등록] 회원ID 중복확인 상태

  // ============================================================
  // [정보가져오기] 수정모드일 경우 기존 회원정보 불러오기
  // ============================================================
  useEffect(() => {
    if (!isEdit) return; // 등록모드면 실행 안함

    api
      .get(`/api/cms/members/${memberId}`)
      .then((res) => {
        const data = res.data.data;
        console.log("회원정보 불러오기:", data);

        // 이메일 분리(front/domain)
        let emailFront = "";
        let emailDomain = "naver.com";
        const rawEmail = data.memberEmail || "";
        if (rawEmail.includes("@")) {
          const [front, domain] = rawEmail.split("@");
          emailFront = front;
          emailDomain = domain;
        }

        // 기존 정보 세팅
        setForm({
          ...form,
          memberId: data.memberId || "",
          memberName: data.memberName || "",
          memberGender: data.memberGender || "m",
          memberEmailFront: emailFront,
          memberEmailDomain: emailDomain,
          customDomain: "",
          memberMobile: data.memberMobile || "",
          memberPhone: data.memberPhone || "",
          zip: data.zip || "",
          roadAddress: data.roadAddress || "",
          jibunAddress: data.jibunAddress || "",
          detailAddress: data.detailAddress || "",
          memberBirthday: data.memberBirthday?.substring(0, 10) || "",
          memberRole: data.memberRole || "user",
          adminType: data.adminType || "",
          memberJoindate: data.memberJoindate || "",
          newPw: "", // 변경 시에만 입력
        });
      })
      .catch((err) => console.error("회원정보 조회 실패:", err));
  }, [isEdit, memberId]);

  // ============================================================
  // 공통 입력 변경 핸들러
  // ============================================================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ============================================================
  // [등록] 회원ID 중복확인
  // ============================================================
  const handleIdCheck = async () => {
    if (!form.memberId) {
      alert("회원ID를 입력해주세요.");
      return;
    }
    try {
      const res = await api.get(`/api/cms/members/check-id`, {
        params: { memberId: form.memberId },
      });
      const exists = res.data?.data?.exists;
      if (exists) {
        alert("이미 존재하는 ID입니다.");
        setIdChecked(false);
      } else {
        alert("사용 가능한 ID입니다.");
        setIdChecked(true);
      }
    } catch (err) {
      console.error("ID 중복확인 오류:", err);
      alert("ID 중복확인 중 오류가 발생했습니다.");
    }
  };

  // ============================================================
  // [등록·수정] 유효성 검사
  // ============================================================
  const validate = () => {
    if (!form.memberId.trim()) {
      alert("회원ID를 입력해주세요.");
      return false;
    }
    if (!isEdit && !idChecked) {
      alert("회원ID 중복확인을 해주세요.");
      return false;
    }
    if (!isEdit && form.memberPw !== form.memberPwConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return false;
    }
    if (form.memberEmailFront.trim() === "") {
      alert("이메일을 입력해주세요.");
      return false;
    }
    return true;
  };

  // ============================================================
  // [등록·수정] 저장 처리
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // 이메일 결합
      const fullEmail =
        form.memberEmailDomain === "custom"
          ? `${form.memberEmailFront}@${form.customDomain}`
          : `${form.memberEmailFront}@${form.memberEmailDomain}`;

      const params = new URLSearchParams();
      params.append("memberName", form.memberName);
      params.append("memberGender", form.memberGender);
      params.append("memberEmail", fullEmail);
      params.append("memberMobile", form.memberMobile);
      params.append("memberPhone", form.memberPhone);
      params.append("zip", form.zip);
      params.append("roadAddress", form.roadAddress);
      params.append("jibunAddress", form.jibunAddress);
      params.append("detailAddress", form.detailAddress);
      params.append("memberBirthday", form.memberBirthday);
      params.append("memberRole", form.memberRole);
      params.append("adminType", form.adminType);

      // ----------------------------------------------------------
      // [수정] 기존 회원정보 수정 (PUT)
      // ----------------------------------------------------------
      if (isEdit) {
        if (form.newPw.trim()) params.append("newPw", form.newPw);
        await api.put(`/api/cms/members/${memberId}`, params, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        alert("회원정보가 수정되었습니다.");
      }
      // ----------------------------------------------------------
      // [등록] 신규 회원 등록 (POST)
      // ----------------------------------------------------------
      else {
        params.append("memberId", form.memberId);
        params.append("memberPw", form.memberPw);
        await api.post("/api/cms/members", params, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        alert("회원이 등록되었습니다.");
      }

      //navigate("/cms/member");
      navigate("/cms/user");
    } catch (err) {
      console.error("회원 저장 실패:", err);
      alert("회원 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // 화면 렌더링
  // ============================================================
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? "회원 정보 수정" : "회원 등록"}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-lg p-6 space-y-4"
      >
        {/* [등록] 회원ID + 중복확인 */}
        {!isEdit && (
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block font-medium mb-1">회원ID *</label>
              <input
                type="text"
                name="memberId"
                value={form.memberId}
                onChange={handleChange}
                className="border rounded w-full px-3 py-2"
                required
              />
            </div>
            <button
              type="button"
              onClick={handleIdCheck}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              중복확인
            </button>
          </div>
        )}

        {/* [등록] 비밀번호 입력/확인 */}
        {!isEdit && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">비밀번호 *</label>
              <input
                type="password"
                name="memberPw"
                value={form.memberPw}
                onChange={handleChange}
                className="border rounded w-full px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">비밀번호 확인 *</label>
              <input
                type="password"
                name="memberPwConfirm"
                value={form.memberPwConfirm}
                onChange={handleChange}
                className="border rounded w-full px-3 py-2"
                required
              />
            </div>
          </div>
        )}

        {/* [수정] 가입일 + 비밀번호 변경 */}
        {isEdit && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">가입일</label>
              <input
                type="text"
                value={form.memberJoindate}
                readOnly
                className="border rounded w-full px-3 py-2 bg-gray-100"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">비밀번호 변경</label>
              <input
                type="password"
                name="newPw"
                value={form.newPw}
                onChange={handleChange}
                placeholder="변경 시에만 입력"
                className="border rounded w-full px-3 py-2"
              />
            </div>
          </div>
        )}

        {/* 이름 / 성별 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">이름 *</label>
            <input
              type="text"
              name="memberName"
              value={form.memberName}
              onChange={handleChange}
              className="border rounded w-full px-3 py-2"
              required
              readOnly={isEdit}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">성별 *</label>
            <select
              name="memberGender"
              value={form.memberGender}
              onChange={handleChange}
              disabled={isEdit}
              className="border rounded w-full px-3 py-2"
            >
              <option value="m">남성</option>
              <option value="f">여성</option>
            </select>
          </div>
        </div>

        {/* 이메일 */}
        <div>
          <label className="block font-medium mb-1">이메일 *</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              name="memberEmailFront"
              placeholder="이메일 아이디"
              value={form.memberEmailFront}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-1/3"
              required
            />
            <span>@</span>
            <select
              name="memberEmailDomain"
              value={form.memberEmailDomain}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-1/3"
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
                className="border rounded px-3 py-2 w-1/3"
              />
            )}
          </div>
        </div>

        {/* 연락처 / 생년월일 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">휴대폰 *</label>
            <input
              type="text"
              name="memberMobile"
              value={form.memberMobile}
              onChange={handleChange}
              className="border rounded w-full px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">생년월일 *</label>
            <input
              type="date"
              name="memberBirthday"
              value={form.memberBirthday}
              onChange={handleChange}
              className="border rounded w-full px-3 py-2"
              required
              readOnly={isEdit}
            />
          </div>
        </div>

        {/* 주소 */}
        <div>
          <label className="block font-medium mb-1">주소</label>
          <input
            type="text"
            name="zip"
            value={form.zip}
            onChange={handleChange}
            placeholder="우편번호"
            className="border rounded w-full px-3 py-2 mb-2"
          />
          <input
            type="text"
            name="roadAddress"
            value={form.roadAddress}
            onChange={handleChange}
            placeholder="도로명주소"
            className="border rounded w-full px-3 py-2 mb-2"
          />
          <input
            type="text"
            name="jibunAddress"
            value={form.jibunAddress}
            onChange={handleChange}
            placeholder="지번주소"
            className="border rounded w-full px-3 py-2 mb-2"
          />
          <input
            type="text"
            name="detailAddress"
            value={form.detailAddress}
            onChange={handleChange}
            placeholder="상세주소"
            className="border rounded w-full px-3 py-2"
          />
        </div>

        {/* 권한 / 관리자유형 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">회원권한 *</label>
            <select
              name="memberRole"
              value={form.memberRole}
              onChange={handleChange}
              className="border rounded w-full px-3 py-2"
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">관리자유형</label>
            <select
              name="adminType"
              value={form.adminType}
              onChange={handleChange}
              className="border rounded w-full px-3 py-2"
            >
              <option value="">-- 선택 안함 --</option>
              <option value="책임자">책임자</option>
              <option value="관리자">관리자</option>
              <option value="강사">강사</option>
            </select>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            //onClick={() => navigate("/cms/member")}
            onClick={() => navigate("/cms/user")}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
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
