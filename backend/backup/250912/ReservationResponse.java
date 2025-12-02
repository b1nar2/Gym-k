package com.gym.domain.reservation;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 예약 응답 DTO
 * - DATE ↔ LocalDate, TIMESTAMP ↔ LocalDateTime
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @ToString
public class ReservationResponse {
    private Long resvId;
    private String memberId;
    private Long facilityId;
    private String resvContent;
    private LocalDate wantDate;
    private LocalDate resvDate;
    private Integer resvPersonCount;
    private String resvStatus;
    private Long facilityMoney;
    private LocalDateTime resvStartTime;
    private LocalDateTime resvEndTime;
    private Integer resvMoney;
}
