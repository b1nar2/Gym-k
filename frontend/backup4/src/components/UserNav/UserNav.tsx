import React, { useState } from "react"; // useState: 메뉴 클릭 시 펼침 상태 관리용
import { Link } from "react-router-dom"; // Link: 페이지 이동용 컴포넌트
import api from "../../api/axios"; // [251012] 사용자 전용 axios 인스턴스
import Box from '@mui/material/Box';      // *[251021] MUI 레이아웃 박스
import Button from '@mui/material/Button';// *[251021] MUI 메뉴 버튼
import Typography from '@mui/material/Typography'; // *[251021] MUI 텍스트
import Paper from '@mui/material/Paper';  // *[251021] 드롭다운 박스 배경
import Divider from '@mui/material/Divider'; // *[251021] 경계선

/**
 * [파일명] Navbar.tsx
 * [설명] 사용자 메인 상단 네비게이션 바
 * [구성] 이용안내 / 상품·시설안내 / 시설 이용 신청 / 게시판
 * [작성일] [251016] 구조 통일 및 코드 정리
 */

// [1] 콘텐츠 타입 정의
interface ContentItem {
  contentId: number;
  contentTitle: string;
  contentType: string;
  contentNum: number;
  contentUse?: string; // ⚠️ 콘텐츠 사용여부
}

// [2] 게시판 타입 정의
interface BoardItem {
  boardId: number;
  boardTitle: string;
  boardNum: string;
  boardUse: string; // ⚠️ 게시판 사용여부
}

// [3] 컴포넌트 시작
const Navbar: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null); // [3-1] 현재 펼쳐진 메뉴명
  const [contentMap, setContentMap] = useState<Record<string, ContentItem[]>>({}); // [3-2] 콘텐츠 캐시
  const [boardList, setBoardList] = useState<BoardItem[]>([]); // [3-3] 게시판 캐시

  // [4] 공통: 메뉴 클릭 시 동작
  const toggleMenu = async (type: string) => {
    if (activeMenu === type) {
      setActiveMenu(null);
      return;
    }
    setActiveMenu(type);

    if (type === "게시판") {
      if (boardList.length > 0) return;
      try {
        const res = await api.get("/api/boards");
        let list: BoardItem[] = res.data?.data || [];
        const filteredList = list
          .filter((b) => b.boardUse === "Y")
          .sort((a, b) => parseInt(a.boardNum) - parseInt(b.boardNum));
        setBoardList(filteredList);
      } catch (err) {
        console.error("[Navbar] 게시판 목록 조회 실패:", err);
      }
      return;
    }

    if (contentMap[type]) return;
    try {
      const res = await api.get(`/api/contents?type=${type}`);
      let list: ContentItem[] = res.data?.data || [];
      const filteredList = list
        .filter((c) => c.contentUse === "Y")
        .sort((a, b) => a.contentNum - b.contentNum);
      setContentMap((prev) => ({ ...prev, [type]: filteredList }));
    } catch (err) {
      console.error(`[Navbar] ${type} 콘텐츠 목록 조회 실패:`, err);
    }
  };

  const menuOrder = ["이용안내", "상품/시설안내", "시설 이용 신청", "게시판"];

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1.5px solid #ebebeb",
        display: "flex",
        justifyContent: { xs: "center", sm: "space-between" },
        alignItems: "center",
        boxShadow: "none",
        minHeight: { xs: 56, sm: 64 },
        position: "relative",
        zIndex: 70,
        px: { xs: 1, sm: 3 },
        flexWrap: "wrap",
      }}
    >
      {menuOrder.map((menu) =>
        menu === "시설 이용 신청" ? (
          <Button
            key="시설 이용 신청"
            component={Link}
            to="/facilities"
            color="primary"
            variant="text"
            sx={{
              mx: { xs: 0, sm: 2 },
              mb: { xs: 1, sm: 0 },
              px: { xs: 2, sm: 3 },
              py: { xs: 0.7, sm: 1 },
              color: "#48b43d",
              fontWeight: 600,
              borderRadius: 0,
              textTransform: "none",
              fontSize: { xs: "0.85rem", sm: "1rem" },
              boxShadow: "none",
              backgroundColor: "transparent",
              width: { xs: "100%", sm: "auto" },
              '&:hover': {
                color:"#5ae048",
                backgroundColor: "transparent",
                boxShadow: "none",
              },
            }}
          >
            시설 이용 신청
          </Button>
        ) : (
          <Box
            key={menu}
            sx={{
              mx: { xs: 0, sm: 2 },
              mb: { xs: 1, sm: 0 },
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: { xs: "100%", sm: "auto" },
              textAlign: "center",
            }}
          >
            <Button
              onClick={() => toggleMenu(menu)}
              color="inherit"
              variant="text"
              sx={{
                width: "auto",
                px: { xs: 1, sm: 3 },
                fontWeight: activeMenu === menu ? 700 : 500,
                borderBottom:
                  activeMenu === menu ? "3px solid #5ae048" : "3px solid transparent",
                borderRadius: 0,
                fontSize: { xs: "0.85rem", sm: "1rem" },
                textTransform: "none",
                justifyContent: "flex-start",
                backgroundColor: "transparent",
                boxShadow: "none",
                '&:hover': {
                  backgroundColor: "transparent",
                  color: "#5ae048",
                  boxShadow: "none",
                },
              }}
            >
              {menu}
            </Button>
            {activeMenu === menu && menu !== "시설 이용 신청" && (
              <Paper
                elevation={4}
                sx={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  width: 220,
                  py: 1,
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  boxShadow: 3,
                  zIndex: 99,
                  maxHeight: 320,
                  overflowY: "auto",
                  fontSize: { xs: "0.8rem", sm: "0.93rem" },
                }}
              >
                {(menu === "게시판" ? boardList : contentMap[menu])?.length ? (
                  (menu === "게시판" ? boardList : contentMap[menu]).map((item) => {
                    if (menu === "게시판") {
                      const board = item as BoardItem;
                      return (
                        <Button
                          key={board.boardId}
                          component={Link}
                          to={`/board/${board.boardNum}`}
                          fullWidth
                          sx={{
                            justifyContent: "flex-start",
                            px: 2,
                            py: 1,
                            color: "text.primary",
                            borderRadius: 1,
                            textTransform: "none",
                            fontSize: "inherit",
                            '&:hover': {
                              bgcolor: "grey.100",
                              color: "#5ae048",
                            },
                          }}
                        >
                          {"■ " + board.boardTitle}
                        </Button>
                      );
                    } else {
                      const content = item as ContentItem;
                      return (
                        <Button
                          key={content.contentId}
                          component={Link}
                          to={`/contents/${content.contentType}/${content.contentNum}`}
                          fullWidth
                          sx={{
                            justifyContent: "flex-start",
                            px: 2,
                            py: 1,
                            color: "text.primary",
                            borderRadius: 1,
                            textTransform: "none",
                            fontSize: "inherit",
                            '&:hover': { bgcolor: "grey.100" },
                          }}
                        >
                          {"■ " + content.contentTitle}
                        </Button>
                      );
                    }
                  })
                ) : (
                  <Typography sx={{ px: 2, py: 1, color: "grey.500" }}>
                    등록된 {menu === "게시판" ? "게시판" : "콘텐츠"} 없음
                  </Typography>
                )}
              </Paper>
            )}
          </Box>
        )
      )}
    </Box>
  );
};



export default Navbar;
