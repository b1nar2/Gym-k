import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../api/axios";

// * 251016 MUI 컴포넌트 import
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// [3] 콘텐츠 데이터 타입 정의
interface ContentDetail {
  contentId: number;
  contentTitle: string;
  contentContent: string;
  contentType: string;
  contentNum: number;
  contentUse: string;
  contentRegDate: string;
  contentModDate: string;
}

const ContentDetail: React.FC = () => {
  const { contentType, contentNum } = useParams<{ contentType: string; contentNum: string }>();

  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/contents/${contentType}/${contentNum}`);
      setContent(res.data.data);
    } catch (err) {
      console.error("[ContentDetail] 콘텐츠 조회 실패:", err);
      setError("콘텐츠를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [contentType, contentNum]);

  if (loading) return <Typography align="center" mt={10} color="text.secondary">로딩 중...</Typography>;
  if (error) return <Typography align="center" mt={10} color="error">{error}</Typography>;
  if (!content) return <Typography align="center" mt={10} color="text.disabled">콘텐츠가 존재하지 않습니다.</Typography>;

  return (
    <Box
      maxWidth={720}
      mx="auto"
      mt={10}
      p={6}
      bgcolor="background.paper"
      boxShadow={3}
      borderRadius={2}
    >
      {/* [8-1] 콘텐츠 제목 */}
      <Typography variant="h4" fontWeight="bold" mb={4} color="text.primary">
        {content.contentTitle}
      </Typography>

      {/* [8-2] 상위메뉴 및 정렬번호 */}
      <Typography variant="subtitle2" color="text.secondary" mb={4}>
        상위메뉴: {content.contentType} / 정렬번호: {content.contentNum}
      </Typography>

      {/* [8-3] 본문 내용 (HTML 렌더링 포함) */}
      <Box
        sx={{ typography: 'body1', color: 'text.primary', lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: content.contentContent }}
      />

      {/* [8-4] 등록일 / 수정일 */}
      <Typography variant="caption" color="text.disabled" mt={6} display="block" textAlign="right">
        등록일: {content.contentRegDate?.split("T")[0] || "-"} | 수정일: {content.contentModDate?.split("T")[0] || "-"}
      </Typography>
    </Box>
  );
};

export default ContentDetail;
