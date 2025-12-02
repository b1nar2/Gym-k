import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/* =========================
   BoardTable 컴포넌트 및 타입 정의
   ========================= */

// 테이블 컬럼 타입: 헤더명과 렌더 함수 지정
export type TableColumn<T> = {
  header: string;
  render: (item: T) => React.ReactNode;
};

// 테이블 프로퍼티: 데이터 배열, 컬럼 배열, 선택적 키 필드
type TableProps<T> = {
  data: T[];
  columns: TableColumn<T>[];
  keyField?: keyof T;
};

// 안전한 키 생성 함수: null/undefined 방지 및 문자열/숫자 변환
function toKey(value: unknown): string | number {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return value;
  return String(value);
}

// BoardTable 제네릭 컴포넌트: 데이터와 컬럼에 따라 유연한 렌더링 가능
export function BoardTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
}: TableProps<T>) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }} cellPadding={8}>
      <thead>
        <tr>
          {columns.map((col, idx) => (
            <th key={idx} style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} style={{ textAlign: 'center' }}>
              데이터가 없습니다.
            </td>
          </tr>
        ) : (
          data.map((item, idx) => {
            const key = keyField !== undefined ? toKey(item[keyField]) : idx;
            return (
              <tr key={key}>
                {columns.map((col, cidx) => (
                  <td key={cidx} style={{ borderBottom: '1px solid #eee' }}>{col.render(item)}</td>
                ))}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

/* =========================
   게시판 타입 정의
   ========================= */

// 백엔드 BoardResponse와 맞춘 타입
type BoardSummary = {
  boardId: number;
  boardTitle: string;
  boardUse: 'Y' | 'N';
  regDate?: string;
  modDate?: string;
  memberId: string;
  boardNum: string;
};

/* =========================
   BoardList 컴포넌트
   ========================= */

export default function BoardList() {
  // 게시판 데이터 상태
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10; // 페이지당 표시 항목 수

  const navigate = useNavigate();

  // 게시판 목록 조회 API 호출 함수
  const fetchBoards = async () => {
    setLoading(true);
    setError(null);
    try {
      // GET /api/cms/boards, 검색어는 boardTitle 쿼리 파라미터로 전달
      const response = await axios.get('/api/cms/boards', {
        params: { boardTitle: keyword || undefined },
      });
      // ApiResponse 타입에서 실제 데이터는 response.data.data로 가정
      setBoards(response.data.data || []);
      setPageIndex(0);
    } catch {
      setError('목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 첫 렌더링 시 목록 불러오기
  useEffect(() => {
    fetchBoards();
  }, []);

  // 페이지네이션: 현재 페이지에 해당하는 데이터 슬라이싱
  const pagedBoards = useMemo(() => {
    const start = pageIndex * pageSize;
    return boards.slice(start, start + pageSize);
  }, [boards, pageIndex, pageSize]);

  // 테이블 컬럼 정의
  const columns: TableColumn<BoardSummary>[] = [
    { header: '번호', render: (b) => b.boardId },
    {
      header: '게시판 제목',
      render: (b) => (
        <a href={`/CMS/boards/${b.boardId}/posts`} onClick={e => { e.preventDefault(); navigate(`/CMS/boards/${b.boardId}/posts`); }}>
          {b.boardTitle}
        </a>
      ),
    },
    { header: '이용 가능', render: (b) => (b.boardUse === 'Y' ? 'Y' : 'N') },
    { header: '등록일', render: (b) => b.regDate ?? '-' },
    { header: '수정일', render: (b) => b.modDate ?? '-' },
  ];

  return (
    <div>
      <h2>게시판 목록</h2>

      {/* 검색바 */}
      <input
        type="text"
        placeholder="검색어 입력"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyUp={(e) => e.key === 'Enter' && fetchBoards()}
        style={{ marginRight: 8 }}
      />
      <button onClick={fetchBoards}>검색</button>

      {/* 로딩 및 에러 표시 */}
      {loading && <p>로딩 중...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* 게시판 테이블 */}
      <BoardTable data={pagedBoards} columns={columns} keyField="boardId" />

      {/* 페이지네이션 버튼 */}
      <div style={{ marginTop: 10 }}>
        <button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>
          이전
        </button>
        <button
          disabled={boards.length - (pageIndex + 1) * pageSize <= 0}
          onClick={() => setPageIndex(pageIndex + 1)}
          style={{ marginLeft: 8 }}
        >
          다음
        </button>
      </div>
    </div>
  );
}
