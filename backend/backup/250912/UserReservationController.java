package com.gym.controller.user;

import com.gym.common.ApiResponse;
import com.gym.domain.content.ContentResponse;
import com.gym.domain.content.ContentSearchRequest;
import com.gym.domain.reservation.Reservation;
import com.gym.domain.reservation.ReservationCreateRequest;
import com.gym.domain.reservation.ReservationResponse;
import com.gym.domain.reservation.ReservationSearchRequest;
import com.gym.domain.reservation.ReservationUpdateRequest;
import com.gym.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class UserReservationController {

    private final ReservationService reservationService;

    @Operation(summary = "예약 등록")
    @PostMapping
    public ApiResponse<Long> createReservation(@RequestBody ReservationCreateRequest request) {
        return ApiResponse.ok(reservationService.createReservation(request));
    }
    /* 등록 Json 예시
    {
	  "memberId": "hong1",
	  "facilityId": 1,
	  "resvContent": "팀 연습",
	  "wantDate": "2025-09-20",
	  "resvPersonCount": 20,
	  "resvStartTime": "2025-09-20 10:00:00",
	  "resvEndTime": "2025-09-20 12:00:00"
	}
	*/

    /**
     * 예약 수정(소유자 강제)
     * - 경로 변수로 userId와 resvId를 모두 받음
     * - body는 ReservationUpdateRequest(널 필드는 무시되어 부분수정)
     */
    @Operation(summary = "예약 수정(소유자 기반)")
    @PutMapping("/{userId}/{resvId}")                                                        // PUT /api/reservations/{userId}/{resvId}
    public String updateReservation(@PathVariable("userId") String userId,                   // 소유자(회원) ID
                                    @PathVariable("resvId") Long resvId,                     // 예약 PK
                                    @RequestBody ReservationUpdateRequest request) {         // 수정 DTO
        reservationService.updateReservationByUser(resvId, userId, request);                 // 서비스 호출
        return "예약이 수정되었습니다.";                                                         // 문자열 응답(요청 형식과 동일)
    }

    /**
     * 예약 삭제(소유자 강제)
     * - 경로 변수로 userId와 resvId를 모두 받음
     */
    @Operation(summary = "예약 삭제(소유자 기반)")
    @DeleteMapping("/{userId}/{resvId}")                                                     // DELETE /api/reservations/{userId}/{resvId}
    public String deleteReservation(@PathVariable("userId") String userId,                   // 소유자(회원) ID
                                    @PathVariable("resvId") Long resvId) {                   // 예약 PK
        reservationService.deleteReservationByUser(resvId, userId);                          // 서비스 호출
        return "예약이 삭제되었습니다.";                                                         // 문자열 응답
    }
    
    /**
     * 조회
     */
    @Operation(summary = "예약 목록", description = "예약 ID, 시설ID, 신청자ID로 검색.")
    @GetMapping
    public ApiResponse<List<ReservationResponse>> listReservation(

    		
    		@Parameter(description = "예약ID")
    		@RequestParam(name = "resvId", required = false) Long resvId,
    		
            @Parameter(description = "시설ID")
            @RequestParam(name = "facilityId", required = false) Long facilityId,

            @Parameter(description = "작성자 ID")
            @RequestParam(name = "memberId", required = false) String memberId
    ) {
        // 검색 DTO 사용
    	ReservationSearchRequest req = ReservationSearchRequest.builder() 
								        .resvId(resvId)
								    	.facilityId(facilityId)
								        .memberId(memberId)
								        .build();
    	
    	return ApiResponse.ok(reservationService.listReservations(req)); 
    }
}
