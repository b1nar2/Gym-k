import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios'; // axios 인스턴스 사용
import { useNavigate } from 'react-router-dom';

// 게시판 목록 데이터 타입 정의
type BoardSummary = {
  boardId: number;
  boardTitle: string;
  boardUse: 'Y' | 'N';
  regDate?: string;
  modDate?: string;
  memberId: string;
  boardNum: string;
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
  // 검색어(keyword)가 있으면 boardTitle 파라미터로 전달
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

  // 등록 버튼 클릭 시 등록 페이지로 이동
  // 실제 등록 API 호출은 별도의 페이지에서 구현
  const handleRegister = () => {
    navigate('/CMS/boards/register');
  };

  // 편집 버튼 클릭 시 해당 게시판 편집 페이지로 이동
  // 실제 수정 API 호출은 별도의 페이지에서 구현

  // 게시글 조회 기능: 게시판 제목 클릭 시 해당 게시판 게시글 목록 페이지로 이동
  // -> 기존 조회 버튼은 완전 삭제, 제목 클릭만으로만 이동

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
        {/* 게시판 조회 API 직접 호출 */}
        <button style={{ marginRight: 16, height: 30 }} onClick={fetchBoards}>검색</button>
        {/* 등록 페이지 이동 버튼 */}
        <button style={{ background: '#3f51b5', color: '#fff', fontWeight: 'bold', height: 30, border: 'none', borderRadius: 3, padding: '0 18px' }} onClick={handleRegister}>등록</button>
      </div>
      {/* 로딩/에러 안내 */}
      {loading && <p>로딩 중...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {/* 게시판 리스트 테이블 (조회 버튼 칼럼 완전 삭제됨) */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #eee', marginBottom: 10 }}>
        <thead>
          <tr style={{ background: '#fafafa' }}>
            <th>번호</th>
            <th>게시판 제목</th>
            <th>게시판 편집</th>
            {/* 게시글 조회 칼럼이 삭제됨 */}
            <th>이용 가능 여부</th>
            <th>등록일</th>
            <th>수정일</th>
          </tr>
        </thead>
        <tbody>
          {pagedBoards.length === 0 ? (
            <tr>
              {/* 칼럼 개수 맞춰 colSpan=6으로 수정 */}
              <td colSpan={6} style={{ textAlign: 'center' }}>데이터가 없습니다.</td>
            </tr>
          ) : (
            pagedBoards.map(b => (
              <tr key={b.boardId}>
                <td>{b.boardId}</td>
                <td>
                  {/* 게시글 조회: 제목 클릭으로만 동작, 라우팅 */}
                  <a
                    href={`/CMS/boards/${b.boardId}/posts`}
                    onClick={e => {
                      e.preventDefault();
                      navigate(`/CMS/boards/${b.boardId}/posts`);
                    }}
                    style={{ color: '#1565c0', textDecoration: 'underline' }}
                  >
                    {b.boardTitle}
                  </a>
                </td>
                <td>
                  {/* 편집 버튼: 해당 게시판 편집 페이지로 이동 */}
                  <button
                    style={{ padding: '4px 14px', margin: '2px' }}
                    onClick={() => navigate(`/CMS/boards/${b.boardId}/edit`)}
                  >
                    편집
                  </button>
                </td>
                {/* 게시글 조회 버튼이 있던 <td> 부분 완전히 삭제 */}
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
