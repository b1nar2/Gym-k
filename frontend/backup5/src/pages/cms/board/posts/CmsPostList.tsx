// [파일명] CmsPostList.tsx
// [설명] CMS 게시판별 게시글 목록 조회 (데이터 로직 + 디자인 통합 최종본 + 첨부파일 표시 추가)
// [작성일] [251017-첨부파일표시추가]
// [데이터 연동 흐름]
// 1. React useEffect → axiosCms.get("/api/cms/boards/{boardId}/posts") 호출
// 2. Controller: CmsPostController.listPosts()
// 3. Service: PostService.getPostsByBoard()
// 4. Mapper: postMapper.selectPostsByBoard()
// 5. Oracle: SELECT post_file_path 포함
// 6. 응답 → React에서 posts 상태에 저장 후 테이블 렌더링

import React, { useEffect, useMemo, useState } from "react"; // React 기본 훅 불러옴 (렌더링, 상태 관리, 메모이제이션 등)
import { useNavigate, useParams } from "react-router-dom"; // URL 파라미터 추출과 페이지 이동 기능 제공
import api from "../../../../api/axiosCms"; // CMS 전용 axios 인스턴스 (cmsToken 자동 첨부로 인증 요청 처리)

type PostSummary = { // 게시글 목록 데이터 구조 정의 (백엔드 응답 DTO와 동일)
  postId: number; // 게시글 PK (고유 식별자)
  boardId: number; // 게시판 ID (FK)
  boardPostNo?: number; // 게시판 내부 게시글 번호
  postTitle: string; // 게시글 제목
  memberId?: string; // 작성자 ID
  memberName?: string; // 작성자 이름
  postViewCount?: number; // 조회수
  postRegDate?: string; // 등록일시
  postModDate?: string; // 수정일시
  postNotice?: boolean; // 공지 여부
  postFilePath?: string; // 첨부파일 경로
};

const CmsPostList: React.FC = () => { // CMS 게시글 목록 컴포넌트 시작
  const navigate = useNavigate(); // React Router 훅으로 페이지 이동 기능 생성
  const { boardId } = useParams<{ boardId: string }>(); // URL에서 게시판 ID 추출 (예: /cms/boards/1/posts)

  const [posts, setPosts] = useState<PostSummary[]>([]); // 게시글 목록 상태값
  const [keyword, setKeyword] = useState(""); // 검색어 입력 상태
  const [sortKey, setSortKey] = useState("memberId"); // 정렬 기준 (기본값: 작성자)
  const [loading, setLoading] = useState(false); // 데이터 로딩 상태
  const [error, setError] = useState<string | null>(null); // 오류 메시지 상태
  const [pageIndex, setPageIndex] = useState(0); // 현재 페이지 인덱스 상태
  const pageSize = 10; // 한 페이지당 표시할 게시글 수

  const fetchPosts = async () => { // 게시글 목록 불러오는 비동기 함수
    if (!boardId) return; // URL에 boardId 없으면 실행 중단
    setLoading(true); // 로딩 시작 표시
    setError(null); // 이전 오류 초기화
    try {
      const res = await api.get(`/api/cms/boards/${boardId}/posts`, { // 게시판별 게시글 목록 API 호출
        params: { keyword: keyword || undefined }, // 검색어가 있을 경우만 파라미터로 전달
      });
      console.log("✅ [DEBUG] res.data =", res.data); // 서버 응답 확인용 콘솔 출력
      setPosts(res.data || []); // 응답 데이터를 posts 상태에 저장
      setPageIndex(0); // 첫 페이지로 초기화
    } catch (err) {
      console.error(err); // 콘솔에 에러 출력 (디버깅용)
      setError("게시글 데이터를 불러오는 중 오류가 발생했습니다."); // 사용자에게 표시할 오류 메시지
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  useEffect(() => { // 컴포넌트가 처음 렌더링되거나 boardId 변경 시 실행
    fetchPosts(); // 게시글 데이터 요청 실행
  }, [boardId]); // boardId 의존성 지정 → 변경 시 재호출

  const pagedPosts = useMemo(() => { // 페이지별로 게시글 잘라내는 메모이제이션 처리
    const start = pageIndex * pageSize; // 현재 페이지 시작 인덱스 계산
    return posts.slice(start, start + pageSize); // 현재 페이지에 해당하는 데이터만 반환
  }, [posts, pageIndex, pageSize]); // 데이터나 페이지 변경 시 재계산

  const handleSearch = () => { fetchPosts(); }; // 검색 버튼 클릭 시 새 데이터 요청

  const handleRowClick = (postId: number) => { // 게시글 행 클릭 시 상세 페이지로 이동
    navigate(`/cms/boards/${boardId}/posts/${postId}`);
  };

  const handleCreate = () => { // 등록 버튼 클릭 시 새 게시글 등록 페이지로 이동
    navigate(`/cms/boards/${boardId}/posts/form`); 
  };

  if (loading) return <p style={{ textAlign: "center", padding: 20 }}>게시글 불러오는 중...</p>; // 로딩 표시
  if (error) return <p style={{ textAlign: "center", color: "red", padding: 20 }}>{error}</p>; // 에러 표시

  return ( // 실제 게시글 목록 테이블 렌더링
    <div style={{ padding: 20 }}> {/* 페이지 여백 지정 */}
      <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>게시판 제목</h2> {/* 상단 제목 표시 */}
      <p style={{ marginBottom: 20, color: "#666" }}>총 {posts.length}개</p> {/* 게시글 총 개수 출력 */}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}> {/* 검색 및 정렬 영역 */}
        <select
          value={sortKey} // 현재 선택된 정렬 기준
          onChange={(e) => setSortKey(e.target.value)} // 변경 시 상태 업데이트
          style={{ height: 30 }}
        >
          <option value="memberId">작성자</option> {/* 작성자 기준 정렬 */}
          <option value="postRegDate">등록일</option> {/* 등록일 기준 정렬 */}
          <option value="postViewCount">조회수</option> {/* 조회수 기준 정렬 */}
        </select>

        <input
          type="text"
          placeholder="검색어 입력"
          value={keyword} // 입력된 검색어 상태
          onChange={(e) => setKeyword(e.target.value)} // 입력 시 상태 변경
          onKeyUp={(e) => e.key === "Enter" && handleSearch()} // Enter 키 입력 시 검색 실행
          style={{ width: 180, height: 28, paddingLeft: 8 }}
        />

        <button
          onClick={handleSearch} // 검색 버튼 클릭 시 실행
          style={{
            background: "#666", color: "#fff", fontWeight: "bold",
            border: "none", borderRadius: 3, padding: "0 14px", cursor: "pointer",
          }}
        >
          검색
        </button>
      </div>

      <table
        style={{
          width: "100%", borderCollapse: "collapse", border: "1px solid #eee",
          marginBottom: 10, textAlign: "center",
        }}
      >
        <thead style={{ background: "#fafafa" }}> {/* 테이블 헤더 영역 */}
          <tr>
            <th style={{ padding: 8 }}>번호</th>
            <th style={{ padding: 8 }}>게시글 제목</th>
            <th style={{ padding: 8 }}>첨부파일</th> {/* 첨부파일 열 */}
            <th style={{ padding: 8 }}>작성자</th>
            <th style={{ padding: 8 }}>조회수</th>
            <th style={{ padding: 8 }}>등록일</th>
            <th style={{ padding: 8 }}>수정일</th>
          </tr>
        </thead>
        <tbody>
          {pagedPosts.length === 0 ? ( // 데이터가 없을 때 안내 메시지 출력
            <tr>
              <td colSpan={7} style={{ padding: 12, color: "#777" }}>게시글이 없습니다.</td>
            </tr>
          ) : (
            pagedPosts.map((post) => ( // 게시글 목록 반복 렌더링
              <tr
                key={post.postId} // React key 필수
                onClick={() => handleRowClick(post.postId)} // 행 클릭 시 상세로 이동
                style={{ cursor: "pointer" }}
              >
                <td style={{ padding: 8 }}>{post.postNotice ? "공지" : post.boardPostNo}</td> {/* 공지글 표시 */}
                <td style={{ textAlign: "left", padding: "8px 12px" }}>
                  <span
                    style={{ color: "#1565c0", textDecoration: "underline", cursor: "pointer" }}
                  >
                    {post.postTitle} {/* 제목 표시 */}
                  </span>
                </td>

                <td style={{ padding: 8 }}> {/* 첨부파일 아이콘 표시 */}
                  {post.postFilePath ? (
                    <a
                      href={post.postFilePath.startsWith("/images") ? post.postFilePath : `/images/${post.postFilePath}`} // 경로 처리
                      target="_blank" rel="noopener noreferrer" // 새 창 열기 및 보안 설정
                      onClick={(e) => e.stopPropagation()} // 행 클릭 이벤트 중단
                      style={{ textDecoration: "none", color: "#4caf50" }}
                    >
                      💾 {/* 첨부파일 존재 시 아이콘 표시 */}
                    </a>
                  ) : ("-")} {/* 첨부파일이 없을 경우 */}
                </td>

                <td style={{ padding: 8 }}>{post.memberName || post.memberId}</td> {/* 작성자 표시 */}
                <td style={{ padding: 8 }}>{post.postViewCount}</td> {/* 조회수 표시 */}
                <td style={{ padding: 8 }}>
                  {post.postRegDate ? new Date(post.postRegDate).toISOString().slice(0, 10) : "-"} {/* 등록일 */}
                </td>
                <td style={{ padding: 8 }}>
                  {post.postModDate ? new Date(post.postModDate).toISOString().slice(0, 10) : "-"} {/* 수정일 */}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div style={{ marginTop: 10, textAlign: "center" }}> {/* 페이지 네비게이션 */}
        <button disabled={pageIndex === 0} onClick={() => setPageIndex(0)} style={{ margin: "0 4px" }}>
          &lt;&lt;
        </button>
        <button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)} style={{ margin: "0 4px" }}>
          &lt;
        </button>
        <span style={{ fontWeight: 600, margin: "0 10px" }}>{pageIndex + 1}</span> {/* 현재 페이지 번호 */}
        <button
          disabled={posts.length - (pageIndex + 1) * pageSize <= 0}
          onClick={() => setPageIndex(pageIndex + 1)}
          style={{ margin: "0 4px" }}
        >
          &gt;
        </button>
        <button
          disabled={posts.length - (pageIndex + 1) * pageSize <= 0}
          onClick={() => setPageIndex(Math.ceil(posts.length / pageSize) - 1)}
          style={{ margin: "0 4px" }}
        >
          &gt;&gt;
        </button>
      </div>

      <div style={{ marginTop: 20, textAlign: "right" }}> {/* 등록 버튼 영역 */}
        <button
          onClick={handleCreate} // 클릭 시 게시글 등록 페이지로 이동
          style={{
            background: "#666", color: "#fff", fontWeight: "bold",
            border: "none", borderRadius: 3, padding: "6px 18px", cursor: "pointer",
          }}
        >
          등록 {/* 버튼 텍스트 */}
        </button>
      </div>
    </div>
  );
};

export default CmsPostList; // 컴포넌트 기본 내보내기
