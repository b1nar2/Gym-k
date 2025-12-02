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
  const [realBoardId, setRealBoardId] = useState<number | null>(null); // ✅ [FIX] 실제 게시판 PK를 저장할 상태
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ [251020] 페이지 관련 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const pageRange = 5; // 한 번에 표시할 페이지 수

  // ------------------ [OLD] ------------------
  // 💥 문제점: 아래 두 함수는 URL 파라미터(boardId)를 각각 boardNum과 실제 PK로 다르게 해석하여 데이터 불일치 발생
  // const fetchBoardTitle = async () => { ... }; // URL 파라미터를 boardNum으로 사용
  // const fetchPosts = async () => { ... };      // URL 파라미터를 실제 boardId로 사용
  // useEffect(() => {
  //   fetchBoardTitle();
  //   fetchPosts();
  // }, [boardId]);
  // ---------------------------------------------

  // ✅ [FIX] 데이터 로딩 로직 통합
  const loadBoardData = async () => {
    if (!boardId) return; // URL에 boardNum이 없으면 중단

    setLoading(true);
    setError(null);

    try {
      // 1. 모든 게시판 목록을 가져와 URL의 boardNum과 일치하는 게시판을 찾음 X → //^ boardId를 가져와야 함
      const allBoardsRes = await api.get("/api/boards");
      const allBoards: BoardItem[] = allBoardsRes.data?.data || [];
      const foundBoard = allBoards.find((b) => b.boardNum === boardId && b.boardUse === "Y"); // 게시판번호를 추적해서 가져오면 꼬임
      //const foundBoard = allBoards.find((b) => String(b.boardId) === boardId && b.boardUse === "Y"); // 게시판ID 추적해서 가져와야 함

      if (foundBoard) {
        // 2. 찾은 게시판의 제목과 실제 PK(boardId)를 상태에 저장
        setBoardTitle(foundBoard.boardTitle);
        setRealBoardId(foundBoard.boardId);

        // 3. 저장된 실제 PK(realBoardId)를 사용하여 게시글 목록을 조회
        const postsRes = await api.get(`/api/boards/${foundBoard.boardId}/posts`, {
          params: { keyword: keyword || undefined },
        });
        setPosts(postsRes.data || []);
        setCurrentPage(1); // 검색 시 첫 페이지로
      } else {
        setError("게시판을 찾을 수 없습니다.");
        setPosts([]);
      }
    } catch (err) {
      console.error("게시판 데이터 로딩 실패:", err);
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 검색 버튼 클릭 핸들러
  const handleSearch = () => {
    loadBoardData();
  };

  useEffect(() => {
    loadBoardData();
  }, [boardId]); // URL의 boardId(실제로는 boardNum)가 바뀔 때마다 데이터 다시 로드

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
  // ✅ [FIX] URL의 boardId(boardNum) 대신 실제 PK인 realBoardId를 사용
  const handleRowClick = (postId: number) => navigate(`/board/${realBoardId}/posts/${postId}`);
  const handleCreate = () => navigate(`/board/${realBoardId}/form`);
  const handleEdit = (postId: number) => navigate(`/board/${realBoardId}/posts/${postId}/edit`);

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
          onKeyUp={(e) => e.key === "Enter" && handleSearch()}
          sx={{ width: 200 }}
        />
        <Button variant="contained" onClick={handleSearch}>
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