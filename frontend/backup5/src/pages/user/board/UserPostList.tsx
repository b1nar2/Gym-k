// [파일명] UserPostList.tsx
// [설명] 사용자 게시판별 게시글 목록 조회 + 등록/수정/조회 기능 연동 + 페이지네이션 개선
// [작성일] [251020-사용자게시글CRUD+페이지네이션완성본]
// [데이터 연동 흐름]
// 1. GET /api/boards (전체 목록) → boardNum으로 게시판 제목을 찾음 (★추가된 로직)
// 2. GET /api/boards/{boardId}/posts → 게시글 목록 조회 (★URL 파라미터 boardId를 PK로 사용)

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api/axios"; // 사용자 전용 axios 인스턴스
import {
  Box,
  Button,
  TextField,
  Typography,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

type PostSummary = {
  postId: number;
  boardId: number;
  boardPostNo?: number; // [251020] 게시판별 게시글 번호 추가
  postTitle: string;
  memberId?: string;
  memberName?: string;
  postViewCount?: number;
  postRegDate?: string;
  postFilePath?: string;
  postNotice?: boolean;
};

//* [251023] 게시판 전체 목록 조회용 타입 정의
interface BoardItem {
  boardId: number; // 실제 게시판 PK
  boardTitle: string;
  boardNum: string; // URL 파라미터로 넘어오는 2자리 번호 (예: '02')
  boardUse: string;
}

export default function UserPostList() {
  const theme = useTheme(); // [251021] theme.tsx 스타일 적용용
  const navigate = useNavigate();
  // URL 파라미터를 boardId로 받지만, 실제 값은 boardNum('02' 등)이 들어옵니다.
  const { boardId } = useParams<{ boardId: string }>(); 

  // ------------------[1] 상태 정의------------------
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [boardTitle, setBoardTitle] = useState("게시글 목록"); //* [251023] 게시판 제목 상태: 동적으로 표시
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ [251020] 페이지 관련 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const pageRange = 5; // 한 번에 표시할 페이지 수

  // ------------------[2-1] 게시판 제목 조회 (boardNum 매칭 로직) ------------------
  // URL 파라미터(boardId, 예: '02')를 이용하여 전체 목록에서 제목을 찾아 설정합니다.
  const fetchBoardTitle = async () => {
    if (!boardId) return; 
    
    try {
      // 1. 전체 게시판 목록 API 호출 (제목과 boardNum을 모두 가져옴)
      const allBoardsRes = await api.get("/api/boards");
      const allBoards: BoardItem[] = allBoardsRes.data?.data || [];
      
      // 2. URL 파라미터(boardId)를 boardNum으로 간주하여 매칭
      const foundBoard = allBoards.find((b) => b.boardNum === boardId && b.boardUse === "Y");

      if (foundBoard) {
        setBoardTitle(foundBoard.boardTitle); //* [251023] boardNum에 해당하는 제목 설정 완료
      } else {
        setBoardTitle("게시판을 찾을 수 없습니다."); 
      }
    } catch (err) {
      console.error("게시판 제목 조회 실패:", err);
      setBoardTitle("게시판 로드 오류"); 
    }
  };
  
  // ------------------[2-2] 게시글 목록 조회 (boardId를 PK 기준으로 사용) ------------------
  // URL 파라미터(boardId)를 PK라고 가정하고 게시글 목록을 조회합니다.
  const fetchPosts = async () => {
    if (!boardId) return; // URL 파라미터(boardId)가 없으면 중단
    
    setLoading(true);
    setError(null); // 에러 상태 초기화

    try {
      // ★ 목록 조회 API 호출: URL 파라미터(boardId)를 PK로 사용합니다.
      const res = await api.get(`/api/boards/${boardId}/posts`, {
        params: { keyword: keyword || undefined },
      });
      setPosts(res.data || []);
      setCurrentPage(1); // 검색 후 첫 페이지로 리셋
    } catch (err) {
      // 만약 boardId가 PK가 아니어서 404 에러가 났다면, 여기서 오류 메시지를 표시합니다.
      console.error("게시글 목록 조회 실패:", err);
      setError("게시글을 불러오는 중 오류가 발생했습니다. (게시판 ID/번호 확인 필요)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // URL 파라미터가 변경될 때마다 제목과 목록을 독립적으로 호출합니다.
    fetchBoardTitle(); //* [251023] 제목 로드 (boardNum 기준)
    fetchPosts(); //* [251023] 목록 로드 (URL의 boardId를 PK로 사용)
  }, [boardId]); // boardId(URL 값) 변경 시 재호출

  // ------------------[3] 페이지별 목록 계산------------------
  const totalPages = Math.ceil(posts.length / pageSize);
  const pagedPosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return posts.slice(start, start + pageSize);
  }, [posts, currentPage]);

  // ------------------[4] 페이지 이동 함수------------------
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // ------------------[5] 이동 및 버튼 핸들러------------------
  // 라우팅 시에는 URL 파라미터 boardId를 그대로 사용합니다.
  const handleRowClick = (postId: number) => navigate(`/board/${boardId}/posts/${postId}`);
  const handleCreate = () => navigate(`/board/${boardId}/form`);
  const handleEdit = (postId: number) => navigate(`/board/${boardId}/posts/${postId}/edit`);

  // ------------------[6] 페이지네이션 범위 계산------------------
  const startPage = Math.floor((currentPage - 1) / pageRange) * pageRange + 1;
  const endPage = Math.min(startPage + pageRange - 1, totalPages);
  const pageNumbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  if (loading)
    return (
      <Typography variant="body1" sx={{ textAlign: "center", py: 4 }}>
        불러오는 중...
      </Typography>
    );
  if (error)
    return (
      <Typography variant="body1" sx={{ color: "error.main", textAlign: "center", py: 4 }}>
        {error}
      </Typography>
    );

  // ------------------[7] 렌더링------------------
  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: "auto" }}>
      {/* 헤더 */}
      <Typography variant="h5" fontWeight="bold" mb={1}>
        {boardTitle} {/* ✅ [251023] 동적 제목 표시 */}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        총 {posts.length}건
      </Typography>

      {/* 검색창 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, gap: 1 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="검색어 입력"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyUp={(e) => e.key === "Enter" && fetchPosts()}
          sx={{ width: 200 }}
        />
        <Button variant="contained" onClick={fetchPosts}>
          검색
        </Button>
      </Box>

      {/* 목록 테이블 */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
        <Table size="small" sx={{ borderCollapse: "collapse" }}>
          <TableHead sx={{ bgcolor: "grey.100" }}>
            <TableRow>
              <TableCell>번호</TableCell>
              <TableCell>제목</TableCell>
              <TableCell>작성자</TableCell>
              <TableCell>조회수</TableCell>
              <TableCell>등록일</TableCell>
              <TableCell>관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 3, color: "text.disabled", textAlign: "center" }}>
                  게시글이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              pagedPosts.map((p) => (
                <TableRow
                  key={p.postId}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => handleRowClick(p.postId)}
                >
                  {/* ⚠️ [251020] 게시글 번호: boardPostNo 기준 */}
                  <TableCell>{p.postNotice ? "공지" : p.boardPostNo}</TableCell>
                  <TableCell sx={{ color: "#000000", textAlign: "left" }}>
                    {p.postTitle}
                  </TableCell>
                  <TableCell>{p.memberName || p.memberId}</TableCell>
                  <TableCell>{p.postViewCount}</TableCell>
                  <TableCell>{p.postRegDate ? new Date(p.postRegDate).toISOString().slice(0, 10) : "-"}</TableCell>

                  <TableCell>
                    {/* 로그인한 사용자 == 작성자일 때만 수정 가능 */}
                    {sessionStorage.getItem("memberId") === p.memberId ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(p.postId);
                        }}
                        sx={{ borderRadius: 2, px: 2, fontWeight: "bold" }}
                      >
                        수정
                      </Button>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ✅ [251020] 페이지네이션 추가 (CMS 스타일) */}
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          sx={{
            mx: 0.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "grey.400",
            backgroundColor: "transparent",
            px: 1.5,
            py: 0.5,
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
          }}
        >
          {"<<"}
        </Button>
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          sx={{
            mx: 0.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "grey.400",
            backgroundColor: "transparent",
            px: 1.5,
            py: 0.5,
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
          }}
        >
          {"<"}
        </Button>
        {pageNumbers.map((num) => (
          <Button
            key={num}
            onClick={() => handlePageChange(num)}
            sx={{
              mx: 0.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "grey.400",
              backgroundColor: num === currentPage ? theme.palette.primary.main : "transparent",
              color: num === currentPage ? "#fff" : "inherit",
              fontWeight: num === currentPage ? "bold" : "normal",
              px: 1.5,
              py: 0.5,
              cursor: "pointer",
            }}
          >
            {num}
          </Button>
        ))}
        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          sx={{
            mx: 0.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "grey.400",
            backgroundColor: "transparent",
            px: 1.5,
            py: 0.5,
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          }}
        >
          {">"}
        </Button>
        <Button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          sx={{
            mx: 0.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "grey.400",
            backgroundColor: "transparent",
            px: 1.5,
            py: 0.5,
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          }}
        >
          {">>"}
        </Button>
      </Box>

      {/* 등록 버튼 */}
      <Box sx={{ mt: 3, textAlign: "right" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreate}
          sx={{ px: 3, py: 1, borderRadius: 2, fontWeight: "bold" }}
        >
          글쓰기
        </Button>
      </Box>
    </Box>
  );
}