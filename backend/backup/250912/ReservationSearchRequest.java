package com.gym.domain.reservation;


import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.ToString;

/**
 * 예약 목록 조회 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ReservationSearchRequest {
	// 예약신청 ID
	private Long resvId;
    // 회원(신청자) ID
    private String memberId;
    // 시설 ID 
    private Long facilityId;
}