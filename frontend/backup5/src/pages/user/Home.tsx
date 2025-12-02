// Home.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../auth/useAuth';
import { fetchFacilities } from '../../api/facilityApi'; // [251023]
import { useNavigate } from 'react-router-dom'; // [251023]
import NoticeTable from '../../components/NoticeTable';
import ContentTable from '../../components/ContentTable';
import FacilityCard from '../../components/FacilityCard';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';

import api from '../../api/axios';

export type PostSummary = {
  id: number;
  postTitle: string;
  memberName?: string;
  postViewCount?: number;
  date?: string;
};

// [251023] 날짜 문자열에서 시간 제외, yyyy-mm-dd만 반환
const formatDateOnly = (dateStr?: string): string => {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
};

// [251023] 백엔드 PostResponse를 PostSummary 타입으로 변환
const transformPosts = (posts: any[]): PostSummary[] =>
  posts.map(({ postId, postTitle, memberName, postViewCount, postRegDate }) => ({
    id: postId,
    postTitle,
    memberName,
    postViewCount,
    date: formatDateOnly(postRegDate),
  }));

export default function Home() {
  // 인증 상태를 확인합니다
  const { authState } = useAuth();
  const access = !!authState.token;
  const navigate = useNavigate(); // [251023]

  // [251023] 시설 목록 상태 선언: 시설 리스트 데이터를 저장합니다
  const [facilities, setFacilities] = useState<
    Array<{
      facilityId: number;
      facilityName: string;
      facilityImagePath: string;
      facilityType: string;
    }>
  >([]);

  // [251023] 공지사항 게시글 원본 데이터 및 게시판 제목 상태 선언
  const [noticePostsRaw, setNoticePostsRaw] = useState<any[]>([]);
  const [noticeBoardTitle, setNoticeBoardTitle] = useState<string>('공지사항');

  // [251023] 콘텐츠 게시글 원본 데이터 및 게시판 제목 상태 선언
  const [contentPostsRaw, setContentPostsRaw] = useState<any[]>([]);
  const [contentBoardTitle, setContentBoardTitle] = useState<string>('콘텐츠 목록');

  // [251023] 게시판 제목 조회 함수 (전체 게시판 조회 후 boardNum으로 매칭)
  const fetchBoardTitle = async (boardNum: string, setTitle: React.Dispatch<React.SetStateAction<string>>) => {
    try {
      // 전체 게시판 목록 API 호출
      const allBoardsRes = await api.get('/api/boards');
      const allBoards = allBoardsRes.data?.data || [];

      // boardNum과 게시판 사용여부('Y')를 비교하여 맞는 게시판 객체 찾기
      const foundBoard = allBoards.find((b: any) => b.boardNum === boardNum && b.boardUse === 'Y');
      if (foundBoard) {
        // 찾은 게시판의 제목을 상태에 설정
        setTitle(foundBoard.boardTitle);
      } else {
        // 게시판이 없으면 기본 텍스트로 설정
        setTitle('제목 없음');
      }
    } catch (err) {
      // API 호출 실패 시 에러 로그 출력 및 상태 기본값 설정
      console.error('게시판 제목 조회 실패:', err);
      setTitle('제목 로드 오류');
    }
  };

  // [251023] 게시글 목록 조회 함수 (boardNum 기반 게시글 불러오기)
  const fetchPosts = async (boardNum: string, setPostsRaw: React.Dispatch<React.SetStateAction<any[]>>) => {
    try {
      // 게시글 목록 API 호출. 실제 사용 시에는 boardNum이 PK(boardId)인지 확인 필요
      const res = await api.get(`/api/boards/${boardNum}/posts`, {
        params: { page: 1, size: 5 },
      });
      // 받은 데이터를 상태에 저장하여 UI에 출력 준비
      setPostsRaw(res.data || []);
    } catch (err) {
      // 실패 시 에러 출력 및 빈 배열 저장으로 UI 대비
      console.error(`게시판 번호 ${boardNum} 게시글 조회 실패`, err);
      setPostsRaw([]);
    }
  };

  // [251023] 시설 목록 API 호출 및 상태 업데이트
  const loadFacilities = async () => {
    try {
      const data = await fetchFacilities({ page: 0, size: 5 });
      console.log('시설 데이터:', data);
      setFacilities(data.items);
    } catch (err) {
      console.error('시설 목록 불러오기 실패:', err);
    }
  };

  // [251023] 컴포넌트가 처음 렌더링될 때 수행하는 API 호출 모음
  useEffect(() => {
    // 시설 목록 불러오기
    loadFacilities();
    console.log('시설 경로들:', facilities.map(f => f.facilityImagePath));

    // 게시판 번호 '01'에 해당하는 공지사항 게시판 제목 및 게시글 목록 불러오기
    fetchBoardTitle('01', setNoticeBoardTitle);
    fetchPosts('01', setNoticePostsRaw);

    // 게시판 번호 '02'에 해당하는 콘텐츠 게시판 제목 및 게시글 목록 불러오기
    fetchBoardTitle('02', setContentBoardTitle);
    fetchPosts('02', setContentPostsRaw);
  }, []);

  // [251023] 게시글 클릭 시 상세 페이지 이동 함수
  const onPostClick = (postId: number, boardNum: string) => {
    navigate(`/board/${boardNum}/posts/${postId}`);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Noto Sans KR", sans-serif', // 한글 폰트 지정
        bgcolor: 'grey.50', // 배경색 설정
      }}
    >
      <Container maxWidth="lg" sx={{ flex: 1, py: 6, mx: 'auto', maxWidth: 1200 }}>
        <Box mb={6} textAlign="center">
          {/* 로그인 UI가 위치할 공간 */}
        </Box>

        {/* [251023] 시설 목록 동적 렌더링: Grid 사용해 여러 시설 카드 균일하게 배치 */}
      <Grid container spacing={3} justifyContent="center" mb={6}>
          {facilities.map((f) => {
            // [251023] 유효한 이미지 경로인지 검증: "string" 같은 가짜 경로 제외
            const validImagePath = f.facilityImagePath && f.facilityImagePath !== "string" ? f.facilityImagePath : null;

            const imageUrl = validImagePath
              ? validImagePath.startsWith('/images')
                ? `http://localhost:8181${validImagePath}`
                : `http://localhost:8181/images/${validImagePath}`
              : '/no-image.png'; // 기본 이미지

            return (
              <Grid
                key={f.facilityId}
                sx={{
                  gridColumn: {
                    xs: 'span 12', // 모바일에서 한 줄 전폭 사용
                    sm: 'span 6', // 작은 화면에서 2열
                    md: 'span 3', // 중간 화면에서 4열
                    lg: 'span 2', // 큰 화면에서는 6열 배치
                  },
                }}
              >
                <FacilityCard
                  name={f.facilityName}
                  image={imageUrl}
                  reservationUrl={`/facilities/${f.facilityId}`} // 시설 상세 페이지 URL로 변경
                />
              </Grid>
            );
          })}
        </Grid>


        {/* [251023] 공지사항 및 콘텐츠 게시판 제목과 게시글 목록 출력 */}
        <Grid container spacing={10} justifyContent="center" mb={6}>
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              minWidth: 340, // 원하는 최소/최대 폭(예: 340~480)
              maxWidth: 480,
              width: '100%',
              height: '100%',
            }}
          >
            {/* 공지사항 게시판 제목과 목록 NoticeTable 컴포넌트 전달 */}
            <NoticeTable
              posts={transformPosts(noticePostsRaw)}
              title={noticeBoardTitle}
              onPostClick={(postId) => onPostClick(postId, '01')}
            />
          </Grid>
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              minWidth: 340,
              maxWidth: 480,
              width: '100%',
              height: '100%',
            }}
          >
            {/* 콘텐츠 게시판 제목과 목록 ContentTable 컴포넌트 전달 */}
            <ContentTable
              posts={transformPosts(contentPostsRaw)}
              title={contentBoardTitle}
              onPostClick={(postId) => onPostClick(postId, '02')}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
