import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

/**
 * 📌 NoticeTable: 홈 화면 공지사항 프리뷰 테이블 컴포넌트
 * - 헤더 없이 번호, 제목, 날짜만 심플하게 표시
 * - 게시판 제목(title)을 props로 받아 동적으로 렌더링
 * @param posts 공지사항 게시글 배열 [{id, postTitle, date}]
 * @param title 게시판 제목
 * @param onPostClick 게시글 클릭 시 호출되는 함수 (옵션)
 */
// [251023] 공지사항 게시글 형태 정의: id, 제목, 날짜만 포함
export type NoticePostSummary = {
  id: number;
  postTitle: string;
  date?: string;
};

// [251023] NoticeTable 컴포넌트 props 타입 정의
interface NoticeTableProps {
  posts: NoticePostSummary[];
  title: string;
  onPostClick?: (postId: number) => void; // [251023] 게시글 클릭 이벤트 함수 prop 추가
}

// [251023] NoticeTable 컴포넌트 정의
const NoticeTable: React.FC<NoticeTableProps> = ({ posts, title, onPostClick }) => (
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
        mb: 4,
        pt: 4,
        paddingLeft: 7,   // 내부 왼쪽 여백
        textAlign: 'left',
      }}
    >
      {title}
    </Typography>
    {/* [251023] 게시글 번호, 제목, 날짜를 열 형태로 표시하는 테이블 */}
    <Table>
      <TableBody>
        {posts.map((row, idx) => (
          <TableRow
            key={row.id ?? idx}
            hover
            sx={{
              height: 80,
              borderBottom: 'none',
              cursor: onPostClick ? 'pointer' : 'default',
              '&:last-child td': { borderBottom: 0 },
            }}
            onClick={() => {
              if (onPostClick && row.id !== undefined) {
                onPostClick(row.id);
              }
            }}
          >
            <TableCell align="center" sx={{ width: 38, color: 'text.secondary', fontSize: 18, borderBottom: 'none' }}>
              {idx + 1}
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 500,
                color: 'text.secondary',
                fontSize: 18,
                borderBottom: 'none',
              }}
            >
              {row.postTitle}
            </TableCell>
            <TableCell align="right" sx={{ width: 180, color: 'text.secondary', fontSize: 18, borderBottom: 'none' }}>
              {row.date}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Paper>
);

export default NoticeTable;
