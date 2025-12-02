package com.gym.controller.user;

import com.gym.common.ApiResponse;
import com.gym.domain.card.*;
import com.gym.service.CardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;    // [250917] 본인 확인용
import org.springframework.security.access.AccessDeniedException; // [250917] 접근차단 예외
import io.swagger.v3.oas.annotations.media.Schema; // [250917] 입력폼
import org.springframework.http.MediaType; // [250917] 입력폼

import java.util.List;

/**
 * 카드 API (등록/목록/대표설정/삭제)
 * - 경로/메서드/파라미터/반환: 사용자 표와 1:1 일치
 * - [250917] 등록/대표설정/삭제는 로그인 본인 소유만 허용
 */
@Tag(name = "06.Card-User", description = "카드 API (등록/목록/대표설정/삭제)")
@RestController
@RequiredArgsConstructor
@Slf4j
public class UserCardController {

    private final CardService cardService;

    /** 1) 등록(POST /api/cards) — CardCreateRequest → PK(Long) */
    // [old]
    /*
    @Operation(summary = "카드 등록", description = "card_tbl INSERT (시퀀스/제약 준수)")
    @PostMapping("/api/cards")
    public ApiResponse<Long> createCard(@RequestBody CardCreateRequest req) {
        log.info("[POST]/api/cards req={}", req);
        Long pk = cardService.createCard(req);
        return ApiResponse.ok(pk);
    }
    */
    // 1) 등록(POST /api/cards) — 입력폼(form-urlencoded) + 본인 계정 고정
    @Operation(summary = "카드 등록", description = "card_tbl INSERT (폼 입력, 작성자ID는 로그인ID로 자동 설정)")
    @PostMapping(value = "/api/cards", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ApiResponse<Long> createCard(
            // memberId는 폼에서 받지 않음(로그인ID로 강제)
            @Parameter(name = "cardBank", description = "카드사명", required = true)
            @RequestParam("cardBank") String cardBank, // 필수: 카드사명

            @Parameter(name = "cardNumber", description = "카드번호", required = true)
            @RequestParam("cardNumber") String cardNumber, // 필수: 카드번호

            @Parameter(name = "cardApproval", description = "승인번호(APPR-1021)")
            @RequestParam(name = "cardApproval", required = false) String cardApproval, // 선택: 승인번호

            @Parameter(
                name = "cardMain",
                description = "대표 여부(true/false)",
                schema = @Schema(type = "string", allowableValues = {"true","false"}, example = "false")
            )
            @RequestParam(name = "cardMain", defaultValue = "false") boolean cardMain, // 선택: 대표여부

            Authentication auth // 보안 필터에서 이미 인증 보장
    ) {
        // 작성자ID는 로그인ID로 고정(스푸핑 불가)
        final String loginId = auth.getName();

        // 입력값 로깅(민감정보는 정책에 따라 마스킹 고려)
        log.info("[POST]/api/cards loginId={}, cardBank={}, cardNumber={}, cardApproval={}, cardMain={}",
                loginId, cardBank, cardNumber, cardApproval, cardMain);

        // 폼 → DTO 변환(서비스는 DTO만 처리)
        CardCreateRequest req = new CardCreateRequest();
        req.setMemberId(loginId);       // 작성자ID = 로그인ID
        req.setCardBank(cardBank);      // 카드사명
        req.setCardNumber(cardNumber);  // 카드번호
        req.setCardApproval(cardApproval); // 승인번호
        req.setCardMain(cardMain);      // 대표여부

        // 서비스 호출(매퍼/SQL 변경 없음)
        Long pk = cardService.createCard(req);

        // 표준 응답 반환
        return ApiResponse.ok(pk);
    }


    /** 2) 회원별 목록(GET /api/members/{memberId}/cards) — List<CardResponse> */
    @Operation(summary = "카드 목록", description = "memberId 기준 SELECT")
    @GetMapping("/api/members/{memberId}/cards")
    // [old]
    /*
    public ApiResponse<List<CardResponse>> listByMember(
            @Parameter(description = "회원ID") @PathVariable("memberId") String memberId) {
        log.info("[GET]/api/members/{}/cards", memberId);
        return ApiResponse.ok(cardService.listCardsByMember(memberId));
    }
    */
    // [250917] 본인 카드 목록만 조회 가능
    public ApiResponse<List<CardResponse>> listByMember(
            @Parameter(description = "회원ID") @PathVariable("memberId") String memberId,
            Authentication auth) {
        log.info("[GET]/api/members/{}/cards", memberId);
        if (!auth.getName().equals(memberId)) throw new AccessDeniedException("본인 카드만 조회할 수 있습니다.");
        return ApiResponse.ok(cardService.listCardsByMember(memberId));
    }

    /** 3) 대표카드 설정(PATCH /api/cards/{cardId}/main?memberId=xxx) — void */
    // [old]
    /*
    @Operation(summary = "대표카드 설정", description = "대상만 'Y', 나머지 자동 'N'")
    @PatchMapping("/api/cards/{cardId}/main")
    public ApiResponse<Void> setMainCard(
            @Parameter(description = "대표로 지정할 카드 PK") @PathVariable("cardId") Long cardId,
            @Parameter(description = "카드 소유 회원ID") @RequestParam("memberId") String memberId) {
        log.info("[PATCH]/api/cards/{}/main?memberId={}", cardId, memberId);
        cardService.setMainCard(cardId, memberId);
        return ApiResponse.ok();
    }
    */
    // [250917] 본인 카드만 대표로 설정 가능
    // 3) 대표카드 설정(PATCH /api/cards/{cardId}/main) — 본인만 가능
    @Operation(summary = "대표카드 설정", description = "대상만 'Y', 나머지 자동 'N' (본인만 가능)")
    @PatchMapping("/api/cards/{cardId}/main")
    public ApiResponse<Void> setMainCard(
            @Parameter(description = "대표로 지정할 카드 PK")
            @PathVariable("cardId") Long cardId,
            Authentication auth // 인증 정보(컨트롤러 진입 시 인증 보장)
    ) {
        // 로그인ID 추출(폼으로 받지 않음)
        final String loginId = auth.getName();

        // 로깅(민감정보 제외)
        log.info("[PATCH]/api/cards/{}/main loginId={}", cardId, loginId);

        // 서비스 호출: 서비스 내부에서 카드 소유자=loginId 검증 및 대표카드 전환 처리
        cardService.setMainCard(cardId, loginId);

        // 표준 응답
        return ApiResponse.ok();
    }


    /** 4) 삭제(DELETE /api/cards/{cardId}) — void */
    @Operation(summary = "카드 삭제", description = "PK로 단건 삭제(트리거/참조 제약 주의)")
    @DeleteMapping("/api/cards/{cardId}")
    // [old]
    /*
    public ApiResponse<Void> deleteCardById(
            @Parameter(description = "삭제할 카드 PK") @PathVariable("cardId") Long cardId) {
        log.info("[DELETE]/api/cards/{}", cardId);
        cardService.deleteCardById(cardId);
        return ApiResponse.ok();
    }
    */
    // [250917] 본인 카드만 삭제 가능(서비스에서 소유자 최종 검증)
    /*public ApiResponse<Void> deleteCardById(
            @Parameter(description = "삭제할 카드 PK") @PathVariable("cardId") Long cardId,
            Authentication auth) {
        log.info("[DELETE]/api/cards/{}", cardId);
        cardService.deleteCardByIdForOwner(cardId, auth.getName());   // 소유자 검증 포함 삭제
        return ApiResponse.ok();
    }*/
    public ApiResponse<Void> deleteCardById(
            @Parameter(description = "삭제할 카드 PK") @PathVariable("cardId") Long cardId,
            Authentication auth) {
        log.info("[DELETE]/api/cards/{}", cardId);
        try {
            cardService.deleteCardByIdForOwner(cardId, auth.getName()); // 소유자 검증 포함 삭제
            return ApiResponse.ok();
        } catch (RuntimeException e) {
            // DB 트리거가 터질 때 ORA-20041, ORA-20042 같은 코드가 메시지에 포함됨
            if (e.getMessage() != null && e.getMessage().contains("대표카드")) {
                return ApiResponse.fail(400, "대표카드는 삭제할 수 없습니다."); 
            }
            // 나머지 메시지 전송
            throw e;
        }
    }

}
