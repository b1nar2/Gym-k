//! [파일명] CmsFacilityForm.tsx
//! [설명] CMS 시설 등록·수정 공용 화면
//! [백엔드] CmsFacilityController.java → POST/PUT /api/cms/facilities
//! [작성일] [251007]
//! [수정일] [251010] 파일 업로드 공용 컴포넌트(FileUploadInput) 적용

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../../api/axiosCms";
import "../../../css/all/form.css";
import "../../../css/cms/list.css";
import CmsFacilityAdminPopup from "../../../components/cms/CmsFacilityAdminPopup"; // ![251008] 🚀 팝업 컴포넌트 import
import FileUploadInput from "../../../components/FileUploadInput"; //!💾 [251010] 공용 업로드 컴포넌트 import
import apiCms from "../../../api/axiosCms"; //!💾 [251010] CMS 전용 axios 인스턴스 import

export default function CmsFacilityForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const facilityId = searchParams.get("edit"); // 수정 시 ?edit=ID
  const isEdit = !!facilityId;

  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false); // ![251008] 🚀 팝업 표시 여부
  const [form, setForm] = useState({
    facilityType: "수영장",
    facilityName: "",
    facilityPhone: "",
    facilityContent: "",
    facilityImagePath: "",
    facilityPersonMin: "",
    facilityPersonMax: "",
    facilityUse: "true",
    openHour: "",
    closeHour: "",
    facilityMoney: "",
    instructorId: "",    //! [251008 추가] 담당자ID (memberId → instructorId)
    instructorName: "",  //! [251008 추가] 담당자이름 (대문자 오타 수정)
  });

  // [1] 수정 시 기존 데이터 로딩
  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/api/cms/facilities/${facilityId}`)
      .then((res) => {
        const data = res.data?.data;
        setForm({
          facilityType: data.facilityType || "수영장",
          facilityName: data.facilityName || "",
          facilityPhone: data.facilityPhone || "",
          facilityContent: data.facilityContent || "",
          facilityImagePath: data.facilityImagePath || "",
          facilityPersonMin: data.facilityPersonMin || "",
          facilityPersonMax: data.facilityPersonMax || "",
          facilityUse: data.facilityUse ? "true" : "false",
          openHour: data.facilityOpenTime?.substring(0, 2) || "",
          closeHour: data.facilityCloseTime?.substring(0, 2) || "",
          facilityMoney: data.facilityMoney || "",
          instructorId: data.instructorId || "",     //! 담당자ID
          instructorName: data.instructorName || "", //! 담당자이름 (대문자 일관화)
        });
      })
      .catch((err) => console.error("시설 불러오기 실패:", err));
  }, [facilityId]);

  // [2] 변경 핸들러
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ![251008] 🚀 팝업에서 강사 선택 시 호출
  const handleSelectAdmin = (admin: { memberId: string; memberName: string }) => {
    setForm((prev) => ({
      ...prev,
      instructorId: admin.memberId,   //! 수정: memberId → instructorId
      instructorName: admin.memberName, //! 수정: memberName → instructorName
    }));
    setShowPopup(false);
  };

  // [3] 등록/수정 전 검증
  const validate = () => {
    if (!form.facilityName.trim()) {
      alert("필수 입력사항은 입력해주세요.");
      return false;
    }
    if (
      form.facilityPersonMin &&
      form.facilityPersonMax &&
      Number(form.facilityPersonMin) > Number(form.facilityPersonMax)
    ) {
      alert("최소 인원수가 최대 인원수보다 많습니다.");
      return false;
    }
    if (
      form.openHour &&
      form.closeHour &&
      Number(form.openHour) >= Number(form.closeHour)
    ) {
      alert("운영시간 선택 오류: 시작 시간은 종료 시간보다 빨라야 합니다.");
      return false;
    }
    if (form.facilityMoney && Number(form.facilityMoney) < 0) {
      alert("이용료는 0 이상 숫자만 입력해주세요.");
      return false;
    }
    if (!form.instructorId.trim()) {
      alert("⚠️ 담당자(강사)가 선택되지 않았습니다. 반드시 선택 후 저장하세요.");
      return false;
    }
    return true;
  };

  // [4] 등록/수정 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      console.log("🚀 전송 전 instructorId:", form.instructorId, "instructorName:", form.instructorName);
      if (!form.instructorId || form.instructorId.trim() === "") {
        alert("⚠️ 담당자(강사)가 선택되지 않았습니다. 반드시 선택 후 저장하세요.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      Object.entries(form).forEach(([k, v]) => params.append(k, String(v)));

      if (isEdit) {
        await api.put(`/api/cms/facilities/${facilityId}`, params, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        alert("시설 정보가 수정되었습니다.");
      } else {
        await api.post("/api/cms/facilities", params, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        alert("시설이 등록되었습니다.");
      }

      navigate("/cms/facility");
    } catch (err) {
      console.error("시설 저장 실패:", err);
      alert("시설 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ![251008] 🚀 팝업 닫기
  const handleClosePopup = () => setShowPopup(false);

  return (
  // !------------------------------- [251024] UI 개선 -------------------------------//
    // <div className="p-8">  // ❌ 기존 p-8 제거
    <div className="form-container"> 
      <form onSubmit={handleSubmit} 
            // className="form-container" // ❌ 이 클래스 제거
            className="form-box space-y-8" // ✅ form-box로 카드형 적용
      >
        {/* 상단 타이틀 추가 (CmsUserForm 구조 차용) */}
        <div className="text-center border-b pb-6 mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? "시설 정보 수정" : "🆕 시설 등록"}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            CMS 시스템 내 시설 관리 페이지
          </p>
        </div>
        {/* -------------------------- 입력 영역 -------------------------*/}

        {/* 1열: 시설명 / 시설유형 */}
        <div className="grid grid-cols-2 gap-6">
          {/* 시설명 */}
          <div>
            <label className="form-label">시설명 *</label>
            <input
              type="text"
              name="facilityName"
              value={form.facilityName}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <br/>
          {/* 시설유형 */}
          <div>
            <label className="form-label">시설유형 *</label>
            <select name="facilityType" value={form.facilityType} onChange={handleChange} className="form-input">
              <option value="수영장">수영장</option>
              <option value="농구장">농구장</option>
              <option value="풋살장">풋살장</option>
              <option value="배드민턴장">배드민턴장</option>
              <option value="볼링장">볼링장</option>
            </select>
          </div>
        </div>
        <br/>
        {/* 2열: 시설 전화번호 / 빈칸 */}
        <div className="grid grid-cols-2 gap-6">
          {/* 전화번호 */}
          <div>
            <label className="form-label">전화번호</label>
            <input
              type="text"
              name="facilityPhone"
              value={form.facilityPhone}
              onChange={handleChange}
              className="form-input"
              placeholder="예: 02-1234-5678"
            />
          </div>
          {/* 빈 칸 */}
          <div /> 
        </div>

        <br/>

        {/* 3열: 시설 설명 (전체) */}
        <div>
          <label className="form-label">시설 설명</label>
          <textarea name="facilityContent" value={form.facilityContent} onChange={handleChange} rows={4} className="form-input form-textarea" /> {/* form-textarea 클래스 추가 */}
        </div>
        
        <br/>

        {/* 4열: 썸네일 업로드 */}
        <div>
          <label className="form-label">썸네일 *</label>
          <FileUploadInput
            targetType="facility"
            targetId={Number(facilityId) || 0} // 신규는 0, 수정은 실제 ID
            apiInstance={apiCms}
            onUploadSuccess={(path: string) => {
              setForm((prev) => ({ ...prev, facilityImagePath: path })); // 업로드 성공 시 경로 자동 반영
            }}
          />
          {/* 업로드 완료 후 경로 표시 */}
          {form.facilityImagePath && (
            <p className="form-hint mt-1">업로드된 경로: <span className="font-mono">{form.facilityImagePath}</span></p>
          )}
        </div>

        <br/>

        {/* 5열: 최소 인원 / 최대 인원 */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="form-label">최소 인원</label>
            <input type="number" name="facilityPersonMin" value={form.facilityPersonMin} onChange={handleChange} className="form-input" />
          </div>
          <div>
            <label className="form-label">최대 인원</label>
            <input type="number" name="facilityPersonMax" value={form.facilityPersonMax} onChange={handleChange} className="form-input" />
          </div>
        </div>

        <br/>

        {/* 6열: 운영 시간 */}
        <div>
          <label className="form-label">운영 시간</label>
          <div className="flex gap-2 items-center">
            <select name="openHour" value={form.openHour} onChange={handleChange} className="form-input">
              <option value="">시작</option>
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i.toString().padStart(2, "0")}>
                  {i.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
            <span className="text-gray-500">~</span>
            <select name="closeHour" value={form.closeHour} onChange={handleChange} className="form-input">
              <option value="">종료</option>
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i.toString().padStart(2, "0")}>
                  {i.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <br/>

        {/* 7열: 1시간 이용료 / 사용 여부 */}
        <div className="grid grid-cols-2 gap-6">
          {/* 1시간 이용료 */}
          <div>
            <label className="form-label">1시간 이용료(원)</label>
            <input type="number" name="facilityMoney" value={form.facilityMoney} onChange={handleChange} className="form-input" />
          </div>

          <br/>

          {/* 사용 여부 */}
          <div>
            <label className="form-label">사용 여부</label>
            <select
                name="facilityUse"
                value={form.facilityUse}
                onChange={handleChange}
                className="form-input"
              >
              <option value="true">사용중</option>
              <option value="false">미사용</option>
            </select>
          </div>
        </div>
        
        <br/>

        {/* 8열: 시설 담당자(강사) - ID/버튼 높이 맞춤 적용 */}
        
        <div className="relative">
          <label className="form-label">시설 담당자(강사)</label>
          <div className="flex gap-2 items-end"> 
            <input 
              type="text" 
              name="instructorName" 
              value={form.instructorName || ""} 
              readOnly 
              className="form-input flex-1" 
              placeholder="담당 강사를 선택하세요" 
            />
            <br/>
            <button 
              type="button" 
              onClick={() => setShowPopup(true)} 
              // height: 41px를 인라인으로 강제 지정하여 입력창 높이와 일치시킴
              style={{
                height: '41px',
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px", // common-button-style의 기본 radius 사용
                // width: 'auto',
                padding: '0 20px', // common-button-style의 기본 padding 사용
              }}
              className="common-button-style flex-shrink-0" // common-button-style 사용
            >
              선택
            </button>
            <br/>
          </div>
          {showPopup && (
            <CmsFacilityAdminPopup
              onSelect={handleSelectAdmin}
              onClose={handleClosePopup}
            />
          )}
        </div>

        {/* 버튼 영역 (CmsUserForm 구조 차용) */}
        <br />

        <div className="pt-8 border-t border-slate-200 flex flex-col items-center space-y-4">
          <button
            type="button"
            onClick={() => navigate("/cms/facility")}
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
            {loading ? (isEdit ? "수정 중..." : "등록 중...") : isEdit ? "수정" : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
