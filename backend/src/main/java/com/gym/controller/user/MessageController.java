package com.gym.controller.user;

import com.gym.domain.message.Message;
import com.gym.domain.message.MessageResponse;
import com.gym.service.MessageService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

// @RequestParam 어노테이션
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 250925 임포트 추가
import org.springframework.http.MediaType; // consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE 지정할 때 필요
import org.springframework.http.ResponseEntity;

import io.swagger.v3.oas.annotations.media.Schema;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 메시지 전송 및 조회 REST API 컨트롤러
 */
@CrossOrigin("*")
@RestController
@RequestMapping("/api/messages")
@Tag(name = "11.Message", description = "문자전송 및 조회 API")
public class MessageController {

	private final MessageService messageService;
	// 251020 로그
	private static final Logger logger = LoggerFactory.getLogger(MessageController.class);

	/**
	 * 생성자 기반 의존성 주입
	 */
	public MessageController(MessageService messageService) {
		this.messageService = messageService;
	}

	/**
	 * 메시지 전송 요청 API
	 * 
	 * @param message 요청 바디의 메시지 객체(JSON)
	 * @return 처리 결과 메시지
	 */
	/*
	 * @Operation(summary = "문자 전송 요청 (DB 저장 및 로그 기록)")
	 * 
	 * @PostMapping("/send") public String sendMessage(
	 * 
	 * @Parameter(description = "전송할 메시지 객체", required = true)
	 * 
	 * @RequestBody Message message) { messageService.sendMessage(message); return
	 * "문자전송 요청이 처리되었습니다."; }
	 */
	/*
	 * { "memberId": "hong10", "resvId": null, "closedId": null, "messageType":
	 * "예약확인용", "messageContent": "테스트 메시지.", "messageDate":
	 * "2025-09-04T06:26:43.858Z" }
	 */

	@Operation(summary = "문자 전송 요청 (폼 입력)")
	@PostMapping(value = "/send", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
	public String sendMessage(
			@Parameter(description = "회원ID(수신자)", required = true, example = "hong10") @RequestParam("memberId") String memberId,

			@Parameter(name = "resvId", description = "예약 PK", required = false, schema = @Schema(type = "integer", format = "int64", example = "1001")) @RequestParam(name = "resvId", required = false) Long resvId,

			@Parameter(name = "closedId", description = "휴관일 PK", required = false, schema = @Schema(type = "integer", format = "int64", example = "2001")) @RequestParam(name = "closedId", required = false) Long closedId,

			@Parameter(description = "메시지 종류: 예약확인, 예약취소, 휴관공지", required = true, schema = @Schema(type = "string", example = "예약취소")) @RequestParam("messageType") String messageType,

			@Parameter(description = "문자 본문", required = true, schema = @Schema(type = "string", example = "예약신청 취소되었습니다.")) @RequestParam("messageContent") String messageContent) {
		// Message 객체 수동 생성
		Message msg = Message.builder().memberId(memberId).resvId(resvId).closedId(closedId).messageType(messageType)
				.messageContent(messageContent).build();

		messageService.sendMessage(msg); // 기존 서비스 호출
		return "문자전송 요청이 처리되었습니다.";
	}

	@Operation(summary = "전체 메시지 목록 조회(단일 엔드포인트)")
	@GetMapping
	public List<MessageResponse> getAllMessages(
			@Parameter(description = "전송날짜 시작일 (YYYY-MM-DD)", required = false) @RequestParam(name = "startDate", required = false) String startDate,
			@Parameter(description = "전송날짜 종료일 (YYYY-MM-DD)", required = false) @RequestParam(name = "endDate", required = false) String endDate,
			@Parameter(description = "메시지 종류: 예약확인, 예약취소, 휴관공지", required = false) @RequestParam(name = "messageType", required = false) String messageType,
			@Parameter(description = "수신자(회원ID, 예: hong1)", required = false) @RequestParam(name = "receiverId", required = false) String receiverId) {
		return messageService.getAllMessages(startDate, endDate, messageType, receiverId); // ✅ 서비스 호출만 변경
	}

	/**
	 * 251016 추가 회원별 메시지 리스트 조회
	 * 
	 * @param memberId 회원 ID
	 * @param limit    최대 조회 개수, 기본 5개
	 * @return 회원의 메시지 리스트
	 */
	@Operation(summary = "회원별 메시지 리스트 조회")
	@GetMapping(value = "/member")
//	public List<MessageResponse> getMessagesForMember(@RequestParam("memberId") String memberId,
//	@RequestParam(defaultValue = "5") int limit) {
//	    return messageService.findByMemberId(memberId, limit);
//	}// [251016] 회원별 메시지 리스트 조회 기능 추가
	
	public List<MessageResponse> getMessagesForMember(@RequestParam("memberId") String memberId,
	                                                 @RequestParam(value = "limit", defaultValue = "5") int limit) {
	    return messageService.findByMemberId(memberId, limit);
	} // [251030] limit 파라미터 명시 추가


	/**
	 * 251016 추가 읽지 않은 메시지 개수 조회 API 클라이언트에서 memberId를 쿼리 파라미터로 전달받아 해당 사용자의 읽지 않은
	 * 메시지 수를 반환
	 */
	@GetMapping("/unreadCount")
	public ResponseEntity<Integer> getUnreadCount(@RequestParam("memberId") String memberId) {
		int count = messageService.countUnreadMessages(memberId);

		return ResponseEntity.ok(count);
	}

	/**
	 * 251017 추가 메시지 읽음 처리 API
	 * 
	 * @param messageId 메시지 고유 ID
	 * @return 처리 결과 메시지 응답
	 */
    @PostMapping("/{messageId}/read")
    public ResponseEntity<String> markMessageAsRead(@PathVariable("messageId") Long messageId) {
        logger.info("[MessageController] 읽음 처리 요청 messageId={}", messageId);
        try {
            messageService.markAsRead(messageId);
            logger.info("[MessageController] 읽음 처리 성공 messageId={}", messageId);
            return ResponseEntity.ok("읽음 처리 완료");
        } catch (Exception e) {
            logger.error("[MessageController] 읽음 처리 실패 messageId={}", messageId, e);
            return ResponseEntity.status(500).body("읽음 처리 실패");
        }
    }


}
