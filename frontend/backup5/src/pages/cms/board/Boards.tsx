import { useEffect, useMemo, useState } from 'react';
import api from "../../../api/axiosCms"; // CMS 전용 Axios 인스턴스 불러오기
import { useNavigate } from 'react-router-dom';

// 게시판 목록 데이터 타입 정의
type BoardSummary = {
  boardId: number;
  boardTitle: string;
  boardUse: 'Y' | 'N';
  regDate?: string;
  modDate?: string;
  memberId: string;
  boardNum: string; //! [251015] 정렬번호
};

/*
  Boards 컴포넌트
  - 게시판 목록 조회, 검색, 페이지 이동, 등록/편집 기능 제공
  - 게시글 조회(Posts 페이지 이동)는 게시판 제목 클릭으로만 활성화됨 (조회 버튼 완전 삭제)
*/
export default function Boards() {
  // 게시판 목록 데이터 상태 관리
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;
  const navigate = useNavigate();

  // 게시판 목록 조회 API GET /api/cms/boards
  const fetchBoards = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/cms/boards', {
        params: { boardTitle: keyword || undefined },
      });
      setBoards(response.data.data || []);
      setPageIndex(0);
    } catch {
      setError('게시판 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 목록 조회 자동 실행
  useEffect(() => {
    fetchBoards();
  }, []);

  // 현재 페이지 데이터 계산 (페이징)
  const pagedBoards = useMemo(() => {
    const start = pageIndex * pageSize;
    return boards.slice(start, start + pageSize);
  }, [boards, pageIndex, pageSize]);

  // ✅ 등록 버튼 클릭 시 등록 페이지로 이동 (라우트 통일)
  const handleRegister = () => navigate('/cms/boards/form');

  // ✅ 편집 버튼 클릭 시 수정 페이지로 이동 (라우트 통일)
  const handleEdit = (boardId: number) => navigate(`/cms/boards/form/${boardId}`);

  return (
    <div>
      <h2>게시판 목록</h2>

      {/* 상단 검색/등록 UI */}
      <div style={{ display: 'flex', marginBottom: 10 }}>
        <input
          type="text"
          placeholder="검색어 입력"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyUp={e => e.key === 'Enter' && fetchBoards()}
          style={{ marginRight: 8, width: 160, height: 28 }}
        />
        <button style={{ marginRight: 16, height: 30 }} onClick={fetchBoards}>검색</button>
        <button
          style={{
            background: '#3f51b5',
            color: '#fff',
            fontWeight: 'bold',
            height: 30,
            border: 'none',
            borderRadius: 3,
            padding: '0 18px',
            cursor: 'pointer'
          }}
          onClick={handleRegister}
        >
          등록
        </button>
      </div>

      {/* 로딩/에러 안내 */}
      {loading && <p>로딩 중...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* 게시판 리스트 테이블 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #eee', marginBottom: 10 }}>
        <thead>
          <tr style={{ background: '#fafafa' }}>
            <th>번호</th>
            <th>게시판 제목</th>
            <th>게시판 편집</th>
            <th>이용 가능 여부</th>
            <th>등록일</th>
            <th>수정일</th>
          </tr>
        </thead>
        <tbody>
          {pagedBoards.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center' }}>데이터가 없습니다.</td>
            </tr>
          ) : (
            pagedBoards.map(b => (
              <tr key={b.boardNum}>
                <td>{b.boardNum}</td>
                <td>
                  {/* 게시글 조회: 제목 클릭으로만 이동 */}
                  <a
                    href={`/cms/boards/${b.boardNum}/posts`}
                    onClick={e => {
                      e.preventDefault();
                      navigate(`/cms/boards/${b.boardNum}/posts`);
                    }}
                    style={{ color: '#1565c0', textDecoration: 'underline' }}
                  >
                    {b.boardTitle}
                  </a>
                </td>
                <td>
                  <button
                    style={{
                      padding: '4px 14px',
                      margin: '2px',
                      background: '#555',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 3,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleEdit(b.boardId)} // ✅ 수정 라우트 변경
                  >
                    편집
                  </button>
                </td>
                <td>{b.boardUse === 'Y' ? 'Y' : 'N'}</td>
                <td>{b.regDate ?? '-'}</td>
                <td>{b.modDate ?? '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 페이지 네비게이션 UI */}
      <div style={{ marginTop: 10, textAlign: 'center' }}>
        <button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)} style={{ marginRight: 8 }}>
          &lt;
        </button>
        <span style={{ fontWeight: 600, margin: '0 10px' }}>{pageIndex + 1}</span>
        <button
          disabled={boards.length - (pageIndex + 1) * pageSize <= 0}
          onClick={() => setPageIndex(pageIndex + 1)}
          style={{ marginLeft: 8 }}
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
