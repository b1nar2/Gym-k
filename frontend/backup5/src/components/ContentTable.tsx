import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

/**
 * 📌 ContentTable: 홈 화면 콘텐츠 목록 프리뷰 테이블 컴포넌트
 * - 헤더 없이 번호, 제목, 날짜만 심플하게 표시
 * - 게시판 제목(title)을 props로 받아 동적으로 렌더링
 * - 게시글 클릭 시 onPostClick 이벤트 호출 가능
 * @param posts 콘텐츠 게시글 배열 [{id, postTitle, date}]
 * @param title 게시판 제목
 * @param onPostClick 게시글 클릭 이벤트 함수 (옵션)
 */
// [251023] 콘텐츠 게시글 타입 정의: id, 제목, 날짜 포함
export type ContentPostSummary = {
  id: number;
  postTitle: string;
  date?: string;
};

// [251023] ContentTable 컴포넌트 props 타입
interface ContentTableProps {
  posts: ContentPostSummary[]; // 게시글 데이터 배열
  title: string;               // 게시판 제목
  onPostClick?: (postId: number) => void; // [251023] 게시글 클릭 이벤트 함수 prop 추가 (옵션)
}

// [251023] ContentTable 컴포넌트 정의
const ContentTable: React.FC<ContentTableProps> = ({ posts, title, onPostClick }) => (
  <Paper
    elevation={1} // [251023] 카드 그림자 효과
    sx={{
      p: 2,                      // [251023] 내부 패딩
      borderRadius: 2,           // [251023] 모서리 둥글게
      width: "500px",           // [251023] 고정 너비 500px
      height: "500px",          // [251023] 고정 높이 500px
      backgroundColor: 'background.paper', // [251023] 배경색 설정
      display: 'flex',           // [251023] Flex 사용해 자식 컴포넌트 세로 배치
      flexDirection: 'column',
      justifyContent: 'flex-start'
    }}
  >
    {/* [251023] 게시판 제목: 굵고 크기 있는 폰트로 표시 */}
    <Typography
      variant="h4"
      sx={{
        fontWeight: 700,
        mb: 4,                      // [251023] 아래쪽 마진(글자 아래 공간)
        pt: 4,                      // [251023] 위쪽 패딩(글자 위 공간)
        paddingLeft: 7,             // [251023] 왼쪽 내부 여백
        textAlign: 'left'           // [251023] 텍스트 왼쪽 정렬 선택적 조절 가능
      }}
    >
      {title}
    </Typography>
    {/* [251023] 게시글 목록 테이블 */}
    <Table>
      <TableBody>
        {posts.map((row, idx) => (
          <TableRow
            key={row.id ?? idx}          // [251023] 고유 키 지정
            hover                         // [251023] 호버 효과 활성화
            sx={{
              height: 80,                // [251023] 각 행 높이 고정
              borderBottom: 'none',
              '&:last-child td': { borderBottom: 0 }
            }} 
          >
            {/* [251023] 번호 셀: 중앙 정렬, 회색 텍스트, 크기 지정 */}
            <TableCell align="center" sx={{ width: 38, color: 'text.secondary', fontSize: 18, borderBottom: 'none' }}>
              {idx + 1}
            </TableCell>
            {/* [251023] 제목 셀: 중간 크기, 회색, 포인터 커서, 클릭 시 onPostClick 호출 */}
            <TableCell
              sx={{
                fontWeight: 500,
                color: '#7c7c7cff',
                cursor: 'pointer',
                fontSize: 18,
                borderBottom: 'none',
              }}
              onClick={() => onPostClick && onPostClick(row.id)}
            >
              {row.postTitle}
            </TableCell>
            {/* [251023] 날짜 셀: 우측 정렬, 넓이 180, 크기 지정 */}
            <TableCell align="right" sx={{ width: 180, color: 'text.secondary', fontSize: 18, borderBottom: 'none' }}>
              {row.date}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Paper>
);

export default ContentTable;
