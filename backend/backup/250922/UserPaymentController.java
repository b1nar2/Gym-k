package com.gym.controller.user;

import com.gym.common.ApiResponse;
import com.gym.domain.payment.*;
import com.gym.service.PaymentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

//import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

//import java.time.LocalDateTime;
import java.util.List;

/** 사용자 결제 API 컨트롤러 */
@Tag(name = "Payment", description = "결제API (결제정보등록/결제상태변경/경제목록조회)")
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class UserPaymentController {

	private final PaymentService paymentService;

	@Operation(summary = "결제 등록", description = "결제 신규 등록")
	@PostMapping
	public ApiResponse<Long> create(@Valid @RequestBody PaymentCreateRequest req) {
		log.info("[POST]/api/payments req={}", req);
		return ApiResponse.ok(paymentService.create(req));
	}

	/*
	 * //텍스트박스로 입력하기...미완성
	 * 
	 * @Operation(summary = "결제 등록 (폼 입력)", description =
	 * "회원ID/계좌ID/카드ID/금액/수단/상태를 폼으로 입력")
	 * 
	 * @PostMapping(value = "/form", consumes = "application/x-www-form-urlencoded")
	 * public ApiResponse<Long> createForm(
	 * 
	 * @Parameter(description = "회원ID")
	 * 
	 * @RequestParam("memberId") String memberId,
	 * 
	 * @Parameter(description = "계좌ID")
	 * 
	 * @RequestParam(value = "accountId", required = false) Long accountId,
	 * 
	 * @Parameter(description = "카드ID")
	 * 
	 * @RequestParam(value = "cardId", required = false) Long cardId,
	 * 
	 * @Parameter(description = "결제금액(1원 이상)")
	 * 
	 * @RequestParam("paymentMoney") Long paymentMoney,
	 * 
	 * @Parameter(description = "결제수단 선택 (계좌/카드)")
	 * 
	 * @RequestParam("paymentMethod") String paymentMethod,
	 * 
	 * @Parameter(description = "결제상태 선택 (기본값=예약)")
	 * 
	 * @RequestParam(value = "paymentStatus", required = false, defaultValue = "예약")
	 * String paymentStatus,
	 * 
	 * @Parameter(description = "예약신청ID")
	 * 
	 * @RequestParam("resvId") Long resvId ) { PaymentCreateRequest req =
	 * PaymentCreateRequest.builder() .memberId(memberId) .accountId(accountId)
	 * .cardId(cardId) .paymentMoney(paymentMoney) .paymentMethod(paymentMethod)
	 * .paymentStatus(paymentStatus) .resvId(resvId) .build();
	 * 
	 * return ApiResponse.ok(paymentService.create(req)); }
	 */

	@Operation(summary = "결제 목록 검색", description = "조건별 목록 검색")
	@GetMapping("/search")
	public ApiResponse<List<PaymentResponse>> searchPayments(

			@Parameter(description = "결제ID")
			@RequestParam(name = "paymentId", required = false) Long paymentId,

			@Parameter(description = "회원ID") 
			@RequestParam(name = "memberId", required = false) String memberId,

			@Parameter(description = "예약신청ID") 
			@RequestParam(name = "resvId", required = false) Long resvId,

			@Parameter(description = "결제수단(account/ID)") 
			@RequestParam(name = "method", required = false) String method,

			@Parameter(description = "결제수단(예약/취소/완료)") 
			@RequestParam(name = "paymentStatus", required = false) String paymentStatus

	) {
	    PaymentSearchRequest req = PaymentSearchRequest.builder()
	            .paymentId(paymentId)
	            .memberId(memberId)
	            .resvId(resvId)
	            .method(method)
	            .paymentStatus(paymentStatus)
	            .build(); 
	    return ApiResponse.ok(paymentService.findList(req));
	}


	
	@Operation(summary = "결제 상태 변경", description = "상태값 변경 (완료/예약/취소)")
	@PutMapping("/{paymentId}/status")
	public ApiResponse<Void> updateStatus(
	        @io.swagger.v3.oas.annotations.Parameter(
	            description = "결제ID", required = true)
	        @PathVariable("paymentId") Long paymentId,

	        @io.swagger.v3.oas.annotations.Parameter(
	            description = "결제상태(완료/예약/취소)", required = true)
	        @RequestParam(name = "paymentStatus") String paymentStatus  // ← 쿼리 파라미터명 고정
	) {
	    String status = paymentStatus == null ? null : paymentStatus.trim();
	    if (!("완료".equals(status) || "예약".equals(status) || "취소".equals(status))) {
	        throw new IllegalArgumentException("paymentStatus는 '완료', '예약', '취소'만 허용됩니다.");
	    }
	    paymentService.updateStatus(paymentId, status);
	    return ApiResponse.ok();
	}

}
