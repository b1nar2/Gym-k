package com.gym.controller.cms;

import com.gym.common.ApiResponse;                    // 공통 응답 래퍼
import com.gym.domain.board.BoardCreateRequest;       // 등록 DTO (기존)
import com.gym.domain.board.BoardResponse;            // 조회 DTO (기존)
import com.gym.domain.board.BoardUpdateRequest;       // 수정 DTO (기존)
import com.gym.service.BoardService;                  // 서비스 인터페이스 (기존)

import io.swagger.v3.oas.annotations.Operation;       // Swagger 요약
import io.swagger.v3.oas.annotations.Parameter;       // Swagger 파라미터
import io.swagger.v3.oas.annotations.tags.Tag;        // Swagger 태그

import lombok.RequiredArgsConstructor;                // 생성자 주입
import lombok.extern.log4j.Log4j2;
import lombok.extern.slf4j.Slf4j;                     // 로깅

import org.springframework.http.MediaType;            // consumes=폼
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;    // 컨트롤러 검증용 단일 SQL(서비스/매퍼 무변경 원칙)
import org.springframework.web.bind.annotation.*;     // REST 애노테이션

// [250922]추가사항
import org.springframework.security.core.Authentication; // 로그인ID 확보
import org.springframework.dao.DataIntegrityViolationException; // 제약 위반
import org.springframework.dao.DuplicateKeyException;	// Unique 충돌
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;

@Log4j2
@Tag(name = "03.Board-CMS", description = "CMS 게시판 관리 API(폼 입력, req.set 매핑 통일)")
@RestController
@RequestMapping("/api/cms/boards")
@RequiredArgsConstructor
@Slf4j
public class CmsBoardController {

    private final BoardService boardService;  // ✅ 서비스 주입(기존 유지)
    private final JdbcTemplate jdbc;          // ✅ 단일 검증 SQL 용도(서비스/매퍼 변경 회피)

    // --------------------------------------------------------------------
    // 1) 게시판 등록(폼 입력) — req.set… 스타일 매핑
    // --------------------------------------------------------------------
    @Operation(summary = "게시판 등록", description = "폼으로 등록(작성자는 로그인ID 자동, 번호는 2자리 필수, 중복 불가)")
    @PostMapping(consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    //@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE) // [251015] 프론트엔드와 경로 일치시켜야 함
    public ResponseEntity<ApiResponse<Integer>> createBoard(
            @Parameter(name="boardTitle", description="게시판명", required=true)
            @RequestParam("boardTitle") String boardTitle,

            @Parameter(name="boardContent", description="상단내용(HTML/텍스트)", required=true)
            @RequestParam("boardContent") String boardContent,

            @Parameter(name="boardNum", description="게시판번호(2자리, 중복 불가)", required=true,
                    schema=@Schema(example="01"))
            @RequestParam("boardNum") String boardNum,

            @Parameter(name="boardUse", description="사용여부(Y/N)", required=true,
                    schema=@Schema(allowableValues={"Y","N"}, example="Y"))
            @RequestParam("boardUse") String boardUse,
            
            // [251016] 첨부파일 경로 추가
            @Parameter(name="boardFilePath", description="첨부파일 상대경로(/images/...)", required=false)
            @RequestParam(name="boardFilePath", required=false) String boardFilePath,


            Authentication auth
    ) {
        // 0) 로그인/권한 체크(관리자만)
        if (auth == null || auth.getName() == null) throw new AccessDeniedException("로그인이 필요합니다.");
        final String loginId = auth.getName();
        String role = jdbc.queryForObject("SELECT member_role FROM member_tbl WHERE member_id = ?",
                                          String.class, loginId);
        if (role == null ||
        	    !( role.equalsIgnoreCase("admin") || role.equals("관리자") || role.equals("책임자") )) {
        	    throw new AccessDeniedException("권한이 없습니다.(관리자/책임자만)");
        	}

        // 1) 번호 형식 검증(콘텐츠 컨트롤러와 동일한 수준의 선검증)
        // return ResponseEntity.ok(ApiResponse.fail(-400, "게시판번호는 숫자 2자리여야 합니다.")); // [251016] 주의사항: 기존에는 HTTP 200으로 내려서 React가 catch로 인식하지 못했음
        if (boardNum == null || !boardNum.matches("^\\d{2}$")) {
            return ResponseEntity
                    .status(400) // [251016] 주의사항: 잘못된 요청 명확히 지정
                    .body(ApiResponse.fail(-400, "게시판번호는 숫자 2자리여야 합니다.")); 
        }
        // return ResponseEntity.ok(ApiResponse.fail(-400, "사용여부는 Y 또는 N만 허용됩니다.")); // [251016] 주의사항: 동일한 문제
        if (!"Y".equalsIgnoreCase(boardUse) && !"N".equalsIgnoreCase(boardUse)) {
            return ResponseEntity
                    .status(400)
                    .body(ApiResponse.fail(-400, "사용여부는 Y 또는 N만 허용됩니다."));
        }

        // 2) 폼 → DTO(req.set… 패턴 통일)
        BoardCreateRequest req = new BoardCreateRequest();
        req.setBoardTitle(boardTitle);         // 제목
        req.setBoardContent(boardContent);     // 상단내용
        req.setBoardNum(boardNum);             // 번호(2자리)
        req.setBoardUse(boardUse.toUpperCase());// Y/N 대문자 정규화
        req.setMemberId(loginId);              // ★ 작성자 = 로그인ID(입력폼 없음)
        req.setBoardFilePath(boardFilePath); // [251016] 첨부파일 경로 세팅

        try {
            Integer newId = boardService.createBoard(req);
            return ResponseEntity.ok(ApiResponse.ok(newId));
        // -----------------[251015] 상세 중복 메시지 개선---------------------
        } catch (RuntimeException ex) {
            String msg = ex.getMessage() != null ? ex.getMessage() : "";
            log.info("⚠️ [251015][createBoard] error msg: {}", msg);

            // 상세 메시지 감지 (서비스에서 detailMsg 전달 시)
            // return ResponseEntity.ok(ApiResponse.fail(-1, msg)); // [251016] 주의사항: HTTP 200으로 내려서 프론트가 성공으로 오인
            if (msg.contains("게시판") && msg.contains("번호(")) {
                return ResponseEntity
                        .status(409) // [251016] 주의사항: 중복 충돌 → 409 Conflict 지정
                        .body(ApiResponse.fail(-1, msg));
            }

            // 단순 키 충돌
            // return ResponseEntity.ok(ApiResponse.fail(-1, "게시판번호가 중복됩니다.")); // [251016] 주의사항: 동일 문제
            if (msg.contains("BOARD_NUM_UK") || msg.contains("BOARD_NUM_DUPLICATE") || msg.contains("ORA-00001")) {
                return ResponseEntity
                        .status(409)
                        .body(ApiResponse.fail(-1, "게시판번호가 중복됩니다."));
            }

            // return ResponseEntity.ok(ApiResponse.fail(-500, "서버 오류가 발생했습니다.")); // [251016] 주의사항: HTTP 200 금지
            return ResponseEntity
                    .status(500)
                    .body(ApiResponse.fail(-500, "서버 오류가 발생했습니다."));
        }
        // -----------------[251015] 상세 중복 메시지 개선---------------------
    }


    // --------------------------------------------------------------------
    // 2) 게시판 조회(기존 필터 그대로) — 변경 없음
    // --------------------------------------------------------------------
    @Operation(summary = "게시판 조회", description = "게시판 목록을 상세 조회합니다.(boardId/boardTitle/memberId 필터)")
    @GetMapping
    public ApiResponse<List<BoardResponse>> getBoards(
            @Parameter(description = "게시판ID") @RequestParam(value = "boardId", required = false) String boardId,
            @Parameter(description = "게시판명(부분일치)") @RequestParam(value = "boardTitle", required = false) String boardTitle,
            @Parameter(description = "작성자 회원ID(담당자)") @RequestParam(value = "memberId", required = false) String memberId
    ) {
        return ApiResponse.ok(boardService.getBoards(boardId, boardTitle, memberId));
    }
    
	// --------------------------------------------------------------------
	// 2.5) [251015] 게시판 단건 조회 — 수정 페이지 진입용
    // - 게시판 수정을 진행하기 전에 기존의 정보를 불러와야 함
	// --------------------------------------------------------------------
	@Operation(summary = "게시판 단건 조회", description = "boardId 기준으로 1건 상세 조회 (수정 페이지용)")
	@GetMapping("/{boardId}")
	public ApiResponse<BoardResponse> getBoardById(@PathVariable("boardId") String boardId) {
	    List<BoardResponse> list = boardService.getBoards(boardId, null, null);
	    if (list.isEmpty()) {
	        return ApiResponse.fail(-404, "해당 게시판이 존재하지 않습니다.");
	    }
	    return ApiResponse.ok(list.get(0)); // ✅ 첫 번째 결과만 반환
	}

    // --------------------------------------------------------------------
    // 3) 게시판 수정(폼 입력)
    // --------------------------------------------------------------------
    @Operation(summary="게시판 수정", description="폼으로 수정(작성자 불변, 번호 중복 감지)")
    @PutMapping(value = "/{boardId}", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<ApiResponse<Integer>> updateBoard(
            @PathVariable("boardId") Integer boardId,

            @Parameter(name="boardTitle",   description="게시판명(선택)", required=false,
                       schema=@Schema(type="string", example="공지사항"))
            @RequestParam(name="boardTitle", required=false) String boardTitle,

            @Parameter(name="boardContent", description="상단내용(선택)", required=false,
                       schema=@Schema(type="string", example="<p>상단 공지</p>"))
            @RequestParam(name="boardContent", required=false) String boardContent,

            @Parameter(name="boardNum",     description="게시판번호(2자리, 선택)", required=false,
                       schema=@Schema(type="string", example="02"))
            @RequestParam(name="boardNum", required=false) String boardNum,

            @Parameter(name="boardUse",     description="사용여부(Y/N, 선택)", required=false,
                       schema=@Schema(allowableValues={"Y","N"}, example="Y"))
            @RequestParam(name="boardUse", required=false) String boardUse,
            
            // ✅ [251016] 첨부파일 경로 추가
            @Parameter(name="boardFilePath", description="첨부파일 상대경로(/images/...)", required=false)
            @RequestParam(name="boardFilePath", required=false) String boardFilePath,
            
            Authentication auth
    ) {
        if (auth == null || auth.getName() == null)
            throw new AccessDeniedException("로그인이 필요합니다.");
        final String actorId = auth.getName();

        // 수행자 권한 체크(관리자만)
        String role = jdbc.queryForObject(
                "SELECT member_role FROM member_tbl WHERE member_id = ?",
                String.class, actorId);
        if (role == null ||
        	    !( role.equalsIgnoreCase("admin") || role.equals("관리자") || role.equals("책임자") )) {
        	    throw new AccessDeniedException("권한이 없습니다.(관리자/책임자만)");
        	}

        // 형식 검증
        // return ResponseEntity.ok(ApiResponse.fail(-400, "게시판번호는 숫자 2자리여야 합니다.")); // [251016] 주의사항: HTTP 200 → React가 성공으로 인식
        if (boardNum != null && !boardNum.isBlank() && !boardNum.matches("^\\d{2}$"))
            return ResponseEntity
                    .status(400)
                    .body(ApiResponse.fail(-400, "게시판번호는 숫자 2자리여야 합니다."));
        // return ResponseEntity.ok(ApiResponse.fail(-400, "사용여부는 Y 또는 N만 허용됩니다.")); // [251016] 주의사항 동일
        if (boardUse != null && !(boardUse.equalsIgnoreCase("Y") || boardUse.equalsIgnoreCase("N")))
            return ResponseEntity
                    .status(400)
                    .body(ApiResponse.fail(-400, "사용여부는 Y 또는 N만 허용됩니다."));

        // 폼 → DTO (작성자 불변)
        BoardUpdateRequest req = new BoardUpdateRequest();
        req.setBoardTitle(boardTitle);
        req.setBoardContent(boardContent);
        req.setBoardNum(boardNum);
        req.setBoardUse(boardUse != null ? boardUse.toUpperCase() : null);
        req.setBoardFilePath(boardFilePath); // [251016] 첨부파일 경로 세팅

        try {
            Integer rows = boardService.updateBoard(boardId, actorId, req);
            return ResponseEntity.ok(ApiResponse.ok(rows));
        // -----------------[251015] 상세 중복 메시지 개선---------------------
        } catch (RuntimeException ex) {
            String msg = ex.getMessage() != null ? ex.getMessage() : "";
            log.info("⚠️ [251015][updateBoard] error msg: {}", msg);

            // return ResponseEntity.ok(ApiResponse.fail(-1, msg)); // [251016] 주의사항: HTTP 200 금지
            if (msg.contains("게시판") && msg.contains("번호(")) {
                return ResponseEntity
                        .status(409)
                        .body(ApiResponse.fail(-1, msg));
            }

            // return ResponseEntity.ok(ApiResponse.fail(-1, "게시판번호가 중복됩니다.")); // [251016] 주의사항 동일
            if (msg.contains("BOARD_NUM_UK") || msg.contains("BOARD_NUM_DUPLICATE") || msg.contains("ORA-00001")) {
                return ResponseEntity
                        .status(409)
                        .body(ApiResponse.fail(-1, "게시판번호가 중복됩니다."));
            }

            // return ResponseEntity.ok(ApiResponse.fail(-500, "서버 오류가 발생했습니다.")); // [251016] 주의사항 동일
            return ResponseEntity
                    .status(500)
                    .body(ApiResponse.fail(-500, "서버 오류가 발생했습니다."));
        }
        // -----------------[251015] 상세 중복 메시지 개선---------------------
    }

    // --------------------------------------------------------------------
    // 4) 게시판 삭제
    // --------------------------------------------------------------------
    @Operation(
        summary = "게시판 삭제",
        description = "특정 게시판 삭제"
    )
    @DeleteMapping("/{boardId}")
    public ApiResponse<Void> deleteBoard(@PathVariable("boardId") Integer boardId,
                                         Authentication auth) {
        if (auth == null || auth.getName() == null)
            throw new AccessDeniedException("로그인이 필요합니다.");
        final String actorId = auth.getName();

        String role = jdbc.queryForObject(
                "SELECT member_role FROM member_tbl WHERE member_id = ?",
                String.class, actorId);
        if (role == null ||
        	    !( role.equalsIgnoreCase("admin") || role.equals("관리자") || role.equals("책임자") )) {
        	    throw new AccessDeniedException("권한이 없습니다.(관리자/책임자만)");
        	}

        log.info("[CMS][DELETE]/api/cms/boards/{} by {}", boardId, actorId);
        boardService.deleteBoard(boardId, actorId);
        return ApiResponse.ok();
    }

}
