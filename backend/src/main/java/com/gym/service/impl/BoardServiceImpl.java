package com.gym.service.impl;

import com.gym.domain.board.Board;
import com.gym.domain.board.BoardCreateRequest;
import com.gym.domain.board.BoardResponse;
import com.gym.domain.board.BoardUpdateRequest;
import com.gym.domain.member.Member;
import com.gym.mapper.annotation.MemberMapper;
import com.gym.mapper.xml.BoardQueryMapper;
import com.gym.service.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * [김종범]
 * 게시판 관리 서비스 구현체
 * - DB 트리거 대신 서비스 계층에서 모든 유효성 검사를 수행합니다.
 */
@Service // 이 클래스를 스프링의 서비스 빈으로 등록합니다.
@RequiredArgsConstructor // final로 선언된 필드에 대한 생성자를 자동으로 만들어 의존성을 주입합니다.
public class BoardServiceImpl implements BoardService {

    private final BoardQueryMapper boardQueryMapper; // 게시판 관련 DB 작업을 위한 XML 매퍼입니다.
    private final MemberMapper memberMapper; // 회원 정보 조회를 위한 어노테이션 매퍼입니다.

    @Override
    @Transactional // 이 메서드 전체를 하나의 트랜잭션으로 묶습니다. 실패 시 모든 작업이 롤백됩니다.
    public Integer createBoard(BoardCreateRequest request) {
        // ✅ =================== [핵심 수정] 자바 검문소 로직 추가 ===================
        // 1. 요청으로 들어온 memberId가 유효한지 확인합니다.
        Member member = memberMapper.selectMemberById(request.getMemberId());
        if (member == null) {
            // 회원이 존재하지 않으면, 시퀀스를 사용하기 전에 즉시 에러를 발생시킵니다.
            throw new RuntimeException("존재하지 않는 회원 ID입니다: " + request.getMemberId());
        }

        // 2. 해당 회원의 권한이 'admin'이 맞는지 확인합니다.
        if (!"admin".equalsIgnoreCase(member.getMemberRole())) {
            // 관리자가 아니면, 시퀀스를 사용하기 전에 즉시 에러를 발생시킵니다.
            throw new RuntimeException("게시판을 생성할 권한이 없습니다. (관리자만 가능)");
        }
        // =========================================================================

        // 3. 모든 검사를 통과했으므로, 이제 안심하고 엔티티를 만듭니다.
        Board board = Board.builder()
                .boardTitle(request.getBoardTitle())
                .boardContent(request.getBoardContent())
                .memberId(request.getMemberId())
                .boardNum(request.getBoardNum())
                .boardUse(request.getBoardUse() == null ? "Y" : request.getBoardUse())
                .boardFilePath(request.getBoardFilePath())   // ✅ [251016] 첨부파일 경로 추가
                .build();

        // 4. 검증된 데이터로 DB에 저장을 요청합니다. 이제 실패할 확률이 거의 없습니다.
        try {
            // ✅ [251015] 등록 시 DB 중복번호 발생 감지 + 상세 메시지 개선
            boardQueryMapper.insertBoard(board);
            return board.getBoardId();

        // -----------------[251015] 중복 예외 메시지 개선---------------------
        } catch (DuplicateKeyException e) {
        	Board existingEntity = null;
        	BoardResponse existing = null;
        	try {
        	    existingEntity = boardQueryMapper.findByBoardNum(request.getBoardNum());
        	    if (existingEntity != null) {
        	        existing = BoardResponse.from(existingEntity);
        	    }
        	} catch (Exception ignore) {}

            String existingTitle = (existing != null && existing.getBoardTitle() != null)
                    ? existing.getBoardTitle()
                    : "(기존 게시판 조회 실패)";
            String newTitle = (request.getBoardTitle() != null && !request.getBoardTitle().isEmpty())
                    ? request.getBoardTitle()
                    : "(신규 게시판명 없음)";
            String num = (request.getBoardNum() != null) ? request.getBoardNum() : "(번호 미입력)";

            String detailMsg = String.format("신규 게시판 \"%s\"의 번호(%s)는 이미 \"%s\" 게시판에서 사용 중입니다.",
                    newTitle, num, existingTitle);

            System.err.println("⚠️ DuplicateKeyException 발생(createBoard): " + detailMsg);
            throw new DuplicateKeyException(detailMsg, e);

        } catch (DataIntegrityViolationException e) {
            String msg = e.getMostSpecificCause() != null ? e.getMostSpecificCause().getMessage() : "";
            if (msg.contains("BOARD_NUM_UK") || msg.contains("ORA-00001")) {
            	Board existingEntity = null; 
                BoardResponse existing = null;
                try {
                	existingEntity = boardQueryMapper.findByBoardNum(request.getBoardNum());
                	if (existingEntity != null) {
                	    existing = BoardResponse.from(existingEntity);
                	}
                } catch (Exception ignore) {}

                String existingTitle = (existing != null && existing.getBoardTitle() != null)
                        ? existing.getBoardTitle()
                        : "(기존 게시판 조회 실패)";
                String newTitle = (request.getBoardTitle() != null && !request.getBoardTitle().isEmpty())
                        ? request.getBoardTitle()
                        : "(신규 게시판명 없음)";
                String num = (request.getBoardNum() != null) ? request.getBoardNum() : "(번호 미입력)";

                String detailMsg = String.format("신규 게시판 \"%s\"의 번호(%s)는 이미 \"%s\" 게시판에서 사용 중입니다.",
                        newTitle, num, existingTitle);

                System.err.println("⚠️ DataIntegrityViolationException 발생(createBoard): " + detailMsg);
                throw new DuplicateKeyException(detailMsg, e);
            }
            throw e;
        }
        // -----------------[251015] 중복 예외 메시지 개선---------------------
    }

    // [추가] 검색 필터(부분일치 제목, 작성자, 선택적 boardId) 목록 조회
    @Override // [추가] 인터페이스(BoardService)에 동일 시그니처 존재해야 함
    @Transactional(readOnly = true)
    public List<BoardResponse> getBoards(String boardId, String boardTitle, String memberId) {
        return boardQueryMapper.searchBoards(boardId, boardTitle, memberId).stream()
                .map(BoardResponse::from)
                .collect(Collectors.toList());
    }

    // 수정
    @Override
    @Transactional
    public Integer updateBoard(Integer boardId, String memberId, BoardUpdateRequest request) { // [수정] path의 memberId 추가
        // 수정할 게시판이 존재하는지 먼저 확인합니다.
        var curr = boardQueryMapper.findBoardById(boardId)
                .orElseThrow(() -> new RuntimeException("수정할 게시판을 찾을 수 없습니다. ID: " + boardId));

        // [추가] 경로 memberId 유효성 및 관리자 권한 확인 (수정도 관리자만)
        Member actor = memberMapper.selectMemberById(memberId);
        if (actor == null || !"admin".equalsIgnoreCase(actor.getMemberRole())) {
            throw new RuntimeException("수정 권한이 없습니다. (관리자만 가능)");
        }

        // 담당자(memberId)를 변경하는 경우, 변경될 담당자가 유효한 관리자인지 확인합니다.
        if (request.getMemberId() != null) {
            Member newOwner = memberMapper.selectMemberById(request.getMemberId());
            if (newOwner == null || !"admin".equalsIgnoreCase(newOwner.getMemberRole())) {
                throw new RuntimeException("담당자를 변경할 수 없습니다. (존재하지 않거나 권한 없는 회원)");
            }
        }

        // 수정할 내용을 담은 엔티티를 생성합니다.
        Board boardToUpdate = Board.builder()
                .boardId(boardId)
                .memberId(curr.getMemberId())
                .boardTitle(request.getBoardTitle())
                .boardContent(request.getBoardContent())
                .boardNum(request.getBoardNum())
                .boardUse(request.getBoardUse())
                .boardFilePath(request.getBoardFilePath())   // ✅ [251016] 첨부파일 경로 추가
                .build();

        try {
            // ✅ [251015] 수정 시 DB 중복번호 발생 감지 + 상세 메시지 개선
            int result = boardQueryMapper.updateBoard(boardToUpdate);
            return result;

        // -----------------[251015] 중복 예외 메시지 개선---------------------
        } catch (DuplicateKeyException e) {
            BoardResponse existing = null;
            try {
            	Board existingEntity = boardQueryMapper.findByBoardNum(request.getBoardNum());
            	if (existingEntity != null) {
            	    existing = BoardResponse.from(existingEntity);
            	}
            } catch (Exception ignore) {}

            String existingTitle = (existing != null && existing.getBoardTitle() != null)
                    ? existing.getBoardTitle()
                    : "(기존 게시판 조회 실패)";
            String newTitle = (request.getBoardTitle() != null && !request.getBoardTitle().isEmpty())
                    ? request.getBoardTitle()
                    : "(신규 게시판명 없음)";
            String num = (request.getBoardNum() != null) ? request.getBoardNum() : "(번호 미입력)";

            String detailMsg = String.format("수정하려는 게시판 \"%s\"의 번호(%s)는 이미 \"%s\" 게시판에서 사용 중입니다.",
                    newTitle, num, existingTitle);

            System.err.println("⚠️ DuplicateKeyException 발생(updateBoard): " + detailMsg);
            throw new DuplicateKeyException(detailMsg, e);
        // -----------------[251015] 중복 예외 메시지 개선---------------------
        } catch (Exception e) {
            System.err.println("⚠️ [251015][BoardServiceImpl.updateBoard] 일반 오류: " + e.getMessage());
            throw e; // 기존 구조 유지
        }
    }

    @Override
    @Transactional
    public void deleteBoard(Integer boardId, String memberId) {
        boardQueryMapper.findBoardById(boardId)
                .orElseThrow(() -> new RuntimeException("삭제할 게시판을 찾을 수 없습니다. ID: " + boardId));

        Member actor = memberMapper.selectMemberById(memberId);
        if (actor == null || !"admin".equalsIgnoreCase(actor.getMemberRole())) {
            throw new RuntimeException("삭제 권한이 없습니다. (관리자만 가능)");
        }

        boardQueryMapper.deleteBoardById(boardId);
    }
}
