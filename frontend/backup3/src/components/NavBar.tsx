import React from "react";
import { Link } from "react-router-dom";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

/**
 * 홈페이지 상단 네비게이션 바
 * - 일반 사용자 메뉴 (시설 이용 신청, 상품안내, 게시판, 교육강좌, 이용안내)
 */
const Navbar: React.FC = () => {
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Box>
          {/* 251012 추가 텍스트 링크 스타일 네비게이션 - Typography 컴포넌트 사용, hover 배경색 파스텔 연두 */}
          <Typography
            component={Link}
            to="/facilities"
            sx={{
              px: 3,
              py: 1,
              color: 'text.primary',
              textDecoration: 'none', // 밑줄 제거
              cursor: 'pointer',
              display: 'inline-block', // padding 적용용
              '&:hover': { bgcolor: 'unset', color: '#5ae048' }, // 파스텔 연두 hover 배경색
            }}
          >
            시설 이용 신청
          </Typography>
          <Typography
            component={Link}
            to="/products"
            sx={{
              px: 3,
              py: 1,
              color: 'text.primary',
              textDecoration: 'none',
              cursor: 'pointer',
              display: 'inline-block',
              '&:hover': { bgcolor: 'unset', color: '#5ae048' },
            }}
          >
            상품안내
          </Typography>
          <Typography
            component={Link}
            to="/board"
            sx={{
              px: 3,
              py: 1,
              color: 'text.primary',
              textDecoration: 'none',
              cursor: 'pointer',
              display: 'inline-block',
              '&:hover': { bgcolor: 'unset', color: '#5ae048' },
            }}
          >
            게시판
          </Typography>
          <Typography
            component={Link}
            to="/education"
            sx={{
              px: 3,
              py: 1,
              color: 'text.primary',
              textDecoration: 'none',
              cursor: 'pointer',
              display: 'inline-block',
              '&:hover': { bgcolor: 'unset', color: '#5ae048' },
            }}
          >
            교육강좌
          </Typography>
          <Typography
            component={Link}
            to="/guide"
            sx={{
              px: 3,
              py: 1,
              color: 'text.primary',
              textDecoration: 'none',
              cursor: 'pointer',
              display: 'inline-block',
              '&:hover': { bgcolor: 'unset', color: '#5ae048' },
            }}
          >
            이용안내
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;