//! [파일명] CmsFacilityAdminPopup.tsx
//! [설명] CMS 시설 담당자(강사) 선택 팝업
//! [백엔드] CmsMemberController.java → GET /api/cms/members?adminType=강사

import React, { useEffect, useState } from "react";
import api from "../../api/axiosCms"; // CMS 전용 axios 인스턴스
import "../../css/all/form.css";

interface Admin {
  memberId: string;
  memberName: string;
}

interface Props {
  onSelect: (admin: Admin) => void; // 선택된 담당자 전달
  onClose: () => void;              // 팝업 닫기
}

export default function CmsFacilityAdminPopup({ onSelect, onClose }: Props) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  // [1] 강사 목록 조회 (admin_type='강사')
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/cms/facilities/admins", { // 강사조회 호출
        params: {
          adminType: "강사", // ✅ 강사만 조회
          name: keyword || undefined, // 검색어 있을 경우 필터링
        },
      });
      setAdmins(res.data?.data?.items || []);
    } catch (err) {
      console.error("강사 목록 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return (
    // ✅ absolute: 부모(relative) 기준으로 “아래쪽에 겹쳐서” 표시됨
    <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-300 shadow-lg rounded z-50">
      <div className="p-3 border-b flex justify-between items-center">
        <span className="font-semibold">시설 담당자 선택</span>
        <button onClick={onClose} className="button-secondary small">닫기</button>
      </div>

      {/* 🔍 검색 */}
      <div className="flex gap-2 mb-4 p-3 border-b">
        <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="회원명 검색" className="form-input" />
        <button onClick={fetchAdmins} className="button-primary">검색</button>
      </div>

      {/* 📋 목록 */}
      <table className="w-full border text-sm text-gray-700">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 w-16">번호</th>
            <th className="p-2">회원 ID</th>
            <th className="p-2">회원명</th>
            <th className="p-2 w-20">선택</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} className="text-center p-4">
                로딩 중...
              </td>
            </tr>
          ) : admins.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center p-4 text-gray-500">
                강사 계정이 없습니다.
              </td>
            </tr>
          ) : (
            admins.map((a, i) => (
              <tr key={a.memberId} className="border-b hover:bg-blue-50">
                <td className="p-2 text-center">{i + 1}</td>
                <td
                  className="p-2 text-blue-600 underline cursor-pointer"
                  onClick={() => onSelect(a)} // ID 클릭 시 선택
                >
                  {a.memberId}
                </td>
                <td className="p-2">{a.memberName}</td>
                  <td className="p-2 text-center">
                    <button onClick={() => onSelect(a)} className="button-primary small">선택</button>
                  </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      
    </div>
  );
}
