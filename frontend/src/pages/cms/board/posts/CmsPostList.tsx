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

import React, { useEffect, useMemo, useState } from "react"; // React 기본 훅 불러오기: 상태관리(useState), 렌더링(useEffect), 메모이제이션(useMemo)
import { useNavigate, useParams } from "react-router-dom"; // 페이지 이동 및 URL 파라미터 추출용 훅 import
import api from "../../../../api/axiosCms"; // CMS 전용 axios 인스턴스 import (cmsToken 자동 첨부로 인증 API 호출)
import "../../../../css/all/form.css"; // 공통 form 스타일 import
import "../../../../css/cms/list.css"; // 게시판 목록 전용 CSS import

type PostSummary = { // 게시글 데이터 구조 정의 (백엔드 DTO 형태와 동일)
  postId: number; // 게시글 고유 ID
  boardId: number; // 게시판 ID (외래키)
  boardPostNo?: number; // 게시판 내 게시글 번호
  postTitle: string; // 게시글 제목
  memberId?: string; // 작성자 ID
  memberName?: string; // 작성자 이름
  postViewCount?: number; // 조회수
  postRegDate?: string; // 등록일시
  postModDate?: string; // 수정일시
  postNotice?: boolean; // 공지 여부
  postFilePath?: string; // 첨부파일 경로
};

const CmsPostList: React.FC = () => { // React 함수형 컴포넌트 선언
  const navigate = useNavigate(); // 페이지 이동을 위한 훅 선언
  const { boardId } = useParams<{ boardId: string }>(); // URL에서 boardId 파라미터 추출 (예: /cms/boards/1/posts)

  const [posts, setPosts] = useState<PostSummary[]>([]); // 게시글 목록 상태값
  const [keyword, setKeyword] = useState(""); // 검색어 입력 상태값
  const [sortKey, setSortKey] = useState("memberId"); // 정렬 기준 (기본: 작성자)
  const [loading, setLoading] = useState(false); // 로딩 상태 관리
  const [error, setError] = useState<string | null>(null); // 오류 메시지 상태
  const [pageIndex, setPageIndex] = useState(0); // 현재 페이지 인덱스
  const pageSize = 10; // 페이지당 게시글 수 고정

  const fetchPosts = async () => { // 게시글 목록을 불러오는 비동기 함수
    if (!boardId) return; // boardId가 없으면 함수 종료
    setLoading(true); // 로딩 시작
    setError(null); // 기존 오류 초기화
    try {
      const res = await api.get(`/api/cms/boards/${boardId}/posts`, { // API 호출: 특정 게시판의 게시글 목록 요청
        params: { keyword: keyword || undefined }, // 검색어가 존재할 때만 파라미터로 전송
      });
      console.log("✅ [DEBUG] res.data =", res.data); // 콘솔에 서버 응답 데이터 출력 (디버깅용)
      setPosts(res.data || []); // 응답 데이터 posts 상태에 저장
      setPageIndex(0); // 첫 페이지로 초기화
    } catch (err) {
      console.error(err); // 에러 콘솔 출력
      setError("게시글 데이터를 불러오는 중 오류가 발생했습니다."); // 사용자용 에러 메시지 설정
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  useEffect(() => { // 컴포넌트 마운트 또는 boardId 변경 시 실행
    fetchPosts(); // 게시글 데이터 요청 실행
  }, [boardId]); // boardId 변경 시마다 재호출

  const pagedPosts = useMemo(() => { // 현재 페이지에 해당하는 게시글 목록만 계산 (성능 최적화)
    const start = pageIndex * pageSize; // 시작 인덱스 계산
    return posts.slice(start, start + pageSize); // 현재 페이지 범위만 반환
  }, [posts, pageIndex, pageSize]); // posts나 pageIndex가 바뀔 때마다 재계산

  const handleSearch = () => { fetchPosts(); }; // 검색 버튼 클릭 시 목록 새로고침

  const handleRowClick = (postId: number) => { // 게시글 행 클릭 시
    navigate(`/cms/boards/${boardId}/posts/${postId}`); // 상세 페이지로 이동
  };

  const handleCreate = () => { // 등록 버튼 클릭 시
    navigate(`/cms/boards/${boardId}/posts/form`); // 게시글 등록 페이지로 이동
  };

  if (loading) return <div className="p-6 text-gray-600 text-center animate-pulse">게시글 불러오는 중...</div>; // 로딩 중 표시
  if (error) return <div className="p-6 text-red-600 text-center">{error}</div>; // 에러 메시지 표시

  return ( // 실제 렌더링 부분 시작
    <div className="p-8 bg-gray-50 min-h-screen rounded-xl"> {/* 전체 화면 컨테이너 */}
      
      {/* 상단 제목 + 등록 버튼 */}
      <div className="flex justify-between items-center mb-6 border-b pb-4"> {/* 헤더 섹션 */}
        <h2 className="text-2xl font-bold text-gray-800"> {/* 제목 */}
          📋 게시글 목록
          <span className="ml-2 text-sm text-gray-500">(총 {posts.length}개)</span> {/* 게시글 개수 표시 */}
        </h2>
      </div>

      {/* 검색 필터 영역 */}
      <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm mb-5"> {/* 검색박스 */}
        <div className="filter-search-row justify-end"> {/* 검색 행 (오른쪽 정렬) */}
          
          {/* 정렬 기준 선택 */}
          <select 
            value={sortKey} 
            onChange={(e) => setSortKey(e.target.value)} 
            className="form-input filter-select w-40"
          >
            <option value="memberId">작성자</option>
            <option value="postRegDate">등록일</option>
            <option value="postViewCount">조회수</option>
          </select>

          {/* 검색 입력창 */}
          <input
            type="text"
            placeholder="검색어 입력"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)} // 입력 변경 시 상태 업데이트
            onKeyUp={(e) => e.key === "Enter" && handleSearch()} // 엔터키로 검색 실행
            className="form-input filter-input w-full"
          />

          {/* 검색 버튼 */}
          <button className="common-button-style" onClick={handleSearch}>
            검색
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}> 
        <button className="primary-button-style" onClick={handleCreate}> {/* 등록 버튼 */}
          + 등록
        </button>
      </div>

      <br />
        
      {/* 게시글 목록 테이블 */}
      <div className="table-wrap mt-6"> {/* 테이블 컨테이너 */}
        <table className="table-fixed"> {/* 고정형 테이블 구조 */}
          <thead className="bg-slate-100 text-gray-700 text-sm"> {/* 테이블 헤더 */}
            <tr>
              <th className="px-5 py-3 text-left w-16">번호</th>
              <th className="px-5 py-3 text-left">게시글 제목</th>
              <th className="px-5 py-3 text-center w-24">첨부파일</th>
              <th className="px-5 py-3 text-center w-24">작성자</th>
              <th className="px-5 py-3 text-center w-20">조회수</th>
              <th className="px-5 py-3 text-left w-32">등록일</th>
              <th className="px-5 py-3 text-left w-32">수정일</th>
            </tr>
          </thead>

          <tbody>
            {pagedPosts.length === 0 ? ( // 게시글이 없을 경우
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  게시글이 없습니다.
                </td>
              </tr>
            ) : ( // 게시글이 있을 경우
              pagedPosts.map((post) => (
                <tr
                  key={post.postId} // 각 행의 고유 key 지정
                  onClick={() => handleRowClick(post.postId)} // 클릭 시 상세 페이지 이동
                  className="group border-b hover:bg-indigo-50 transition-all duration-150 cursor-pointer"
                >
                  <td className="px-5 py-3 text-gray-700 font-medium">
                    {post.postNotice ? "공지" : post.boardPostNo}
                  </td>
                  <td className="px-5 py-3 text-left">
                    <span className="text-indigo-600 underline group-hover:text-indigo-700">
                      {post.postTitle}
                    </span>
                  </td>

                  {/* 첨부파일 열 */}
                  <td className="px-5 py-3 text-center">
                    {post.postFilePath ? ( // 첨부파일이 있을 경우
                      <a
                        href={post.postFilePath.startsWith("/images") ? post.postFilePath : `/images/${post.postFilePath}`} // 파일 경로 처리
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600"
                        onClick={(e) => e.stopPropagation()} // 클릭 시 행 클릭 이벤트 중단
                      >
                        💾 {/* 다운로드 아이콘 */}
                      </a>
                    ) : (
                      "-" // 첨부파일이 없을 때
                    )}
                  </td>

                  <td className="px-5 py-3 text-center">
                    {post.memberName || post.memberId}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {post.postViewCount}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {post.postRegDate ? new Date(post.postRegDate).toISOString().slice(0, 10) : "-"}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {post.postModDate ? new Date(post.postModDate).toISOString().slice(0, 10) : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지 네비게이션 */}
      <div className="pagination-container">
        <button
          className="page-button"
          disabled={pageIndex === 0}
          onClick={() => setPageIndex(0)} // 첫 페이지 이동
        >
          &lt;&lt;
        </button>

        <button
          className="page-button"
          disabled={pageIndex === 0}
          onClick={() => setPageIndex(pageIndex - 1)} // 이전 페이지 이동
        >
          &lt;
        </button>

        <span className="page-info">
          {pageIndex + 1} / {Math.ceil(posts.length / pageSize)} 페이지
        </span>

        <button
          className="page-button"
          disabled={posts.length - (pageIndex + 1) * pageSize <= 0}
          onClick={() => setPageIndex(pageIndex + 1)} // 다음 페이지 이동
        >
          &gt;
        </button>

        <button
          className="page-button"
          disabled={posts.length - (pageIndex + 1) * pageSize <= 0}
          onClick={() => setPageIndex(Math.ceil(posts.length / pageSize) - 1)} // 마지막 페이지 이동
        >
          &gt;&gt;
        </button>
      </div>
    </div>
  );
};

export default CmsPostList; // 기본 내보내기 (export default)
