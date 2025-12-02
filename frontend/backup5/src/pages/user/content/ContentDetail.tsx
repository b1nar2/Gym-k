//! [파일명] ContentDetail.tsx
//! [설명] 사용자용 콘텐츠 상세 조회 화면 (이용안내 / 상품·시설안내 등)
//! [작성일] [251012 최종본]
//! [연동 API] GET /api/contents/{contentType}/{contentNum}
//! [호출 위치] Navbar.tsx → /contents/:contentType/:contentNum

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // [1] URL 파라미터 읽기용 훅
import api from "../../../api/axios"; // [2] 사용자 전용 Axios 인스턴스

// [3] 콘텐츠 데이터 타입 정의 (백엔드 ContentResponse 기준)
interface ContentDetail {
  contentId: number;
  contentTitle: string;
  contentContent: string; // ⚠️ 백엔드 필드명과 일치
  contentType: string;
  contentNum: number;
  contentUse: string;
  contentRegDate: string;
  contentModDate: string;
}

// [4] 컴포넌트 정의 시작
const ContentDetail: React.FC = () => {
  // [4-1] URL에서 파라미터 추출 (예: /contents/이용안내/1)
  const { contentType, contentNum } = useParams<{ contentType: string; contentNum: string }>();

  // [4-2] 상태값 정의
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // [5] 콘텐츠 데이터 로딩 함수
  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/contents/${contentType}/${contentNum}`);
      setContent(res.data.data); // ✅ 백엔드 응답의 data.data에 단건 콘텐츠 존재
    } catch (err) {
      console.error("[ContentDetail] 콘텐츠 조회 실패:", err);
      setError("콘텐츠를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // [6] 컴포넌트 마운트 시 실행
  useEffect(() => {
    fetchContent();
  }, [contentType, contentNum]);

  // [7] 로딩 / 오류 / 데이터 없음 처리
  if (loading) return <p className="text-center mt-10 text-gray-500">로딩 중...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!content) return <p className="text-center mt-10 text-gray-400">콘텐츠가 존재하지 않습니다.</p>;

  // [8] 본문 렌더링
  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
      {/* [8-1] 콘텐츠 제목 */}
      <h1 className="text-2xl font-bold mb-4 text-gray-800">{content.contentTitle}</h1>

      {/* [8-2] 상위메뉴 및 정렬번호 */}
      <p className="text-sm text-gray-500 mb-4">
        상위메뉴: {content.contentType} / 정렬번호: {content.contentNum}
      </p>

      {/* [8-3] 본문 내용 (HTML 렌더링 포함) */}
      <div
        className="prose max-w-none text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content.contentContent }} // ✅ HTML 태그 포함 렌더링
      />

      {/* [8-4] 등록일 / 수정일 */}
      <p className="text-right text-xs text-gray-400 mt-6">
        등록일: {content.contentRegDate?.split("T")[0] || "-"} | 수정일:{" "}
        {content.contentModDate?.split("T")[0] || "-"}
      </p>
    </div>
  );
};

export default ContentDetail;
