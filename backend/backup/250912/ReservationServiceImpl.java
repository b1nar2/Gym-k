package com.gym.service.impl;                                                     // 서비스 구현 패키지

import com.gym.domain.reservation.Reservation;                                    // 엔티티
import com.gym.domain.reservation.ReservationCreateRequest;                       // 등록 DTO
import com.gym.domain.reservation.ReservationResponse;
import com.gym.domain.reservation.ReservationSearchRequest;
import com.gym.domain.reservation.ReservationUpdateRequest;                       // 수정 DTO
import com.gym.mapper.annotation.MemberMapper;                                    // 회원 존재 여부 확인
import com.gym.mapper.annotation.ReservationMapper;                               // 등록/수정/삭제
import com.gym.mapper.xml.ReservationQueryMapper;                                 // 목록 조회(XML)
import com.gym.service.ReservationService;                                        // 서비스 인터페이스
import lombok.RequiredArgsConstructor;                                            // 생성자 주입
import org.springframework.stereotype.Service;                                    // 스프링 빈
import org.springframework.transaction.annotation.Transactional;                  // 트랜잭션

import java.time.LocalDate;                                                       // LocalDate
import java.time.LocalDateTime;                                                   // LocalDateTime
import java.time.format.DateTimeFormatter;                                        // 포맷터
import java.util.List;                                                            // 목록

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationMapper reservationMapper;                             // CUD 매퍼
    private final ReservationQueryMapper reservationQueryMapper;                   // 조회 매퍼(XML)
    private final MemberMapper memberMapper;                                       // 회원 검증

    @Override
    @Transactional
    public Long createReservation(ReservationCreateRequest request) {
        // 1) 회원 존재 확인: 없으면 중단
        if (!memberMapper.existsMemberById(request.getMemberId())) {
            throw new IllegalArgumentException("존재하지 않는 회원 ID: " + request.getMemberId());
        }

        // 2) 문자열 → 도메인 타입 변환
        //    wantDate: "yyyy-MM-dd" → LocalDate (※ atStartOfDay() 쓰지 않음)
        //    시작/종료: "yyyy-MM-dd HH:mm:ss" → LocalDateTime
        DateTimeFormatter d  = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter dt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        LocalDate wantDate = LocalDate.parse(request.getWantDate(), d);
        LocalDateTime start = LocalDateTime.parse(request.getResvStartTime(), dt);
        LocalDateTime end   = LocalDateTime.parse(request.getResvEndTime(), dt);

        // [추가] INSERT 전에 겹치는 예약 여부 확인 (완료 상태만 막히도록 XML에서 resv_status='완료' 조건 포함)
        if (reservationQueryMapper.existsOverlapReservation(
                request.getFacilityId(), start, end)) {
            throw new IllegalStateException("이미 예약되어 있는 상태입니다.");
        }

        Reservation entity = Reservation.builder()
                .memberId(request.getMemberId())                 // 회원ID
                .facilityId(request.getFacilityId())             // 시설ID
                .resvContent(request.getResvContent())           // 요구사항
                .wantDate(wantDate)                              // [수정] 파싱한 값 사용
                .resvPersonCount(request.getResvPersonCount())   // 인원
                .resvStartTime(start)                            // [수정] 파싱한 값 사용
                .resvEndTime(end)                                // [수정] 파싱한 값 사용
                .build();

        // [삭제] 아래 중복 중첩 체크 블록은 제거(위에서 이미 수행)
        /*
        // [추가] 2-1) 동일 시설 시간대 중복 여부 체크(겹치면 메시지 반환용 예외 발생)
        if (reservationQueryMapper.existsOverlapReservation(
                entity.getFacilityId(),
                entity.getResvStartTime(),
                entity.getResvEndTime()
        )) {
            throw new IllegalStateException("이미 예약되어 있는 상태입니다.");
        }
        */

        // 3) INSERT 수행(성공 시 entity.resvId 채워짐)
        reservationMapper.insertReservation(entity);

        // 4) 생성된 PK 반환
        return entity.getResvId();
    }
  
       
    

    // 검색 조회
    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> listReservations(ReservationSearchRequest req) { // [수정]
        // userId/facilityId가 모두 null/빈값이면 전체 조회됨(XML 동적 where)
        return reservationQueryMapper.listReservations(req);
    }

    @Override
    @Transactional
    public int updateReservationByUser(Long resvId, String userId,
                                       ReservationUpdateRequest request) {
        // 1) 소유권 확인: resvId + userId 일치 여부
        if (!reservationMapper.existsByIdAndMemberId(resvId, userId)) {
            throw new IllegalArgumentException("NOT_FOUND_OR_FORBIDDEN: reservation=" + resvId + ", user=" + userId);
        }

        // 2) 부분수정 엔티티 구성(null 필드는 미반영)
        Reservation patch = Reservation.builder()
                .resvId(resvId)
                .memberId(userId)
                .resvContent(request.getResvContent())
                .resvPersonCount(request.getResvPersonCount())
                .resvStatus(request.getResvStatus())
                .build();

        return reservationMapper.updateByIdAndMemberId(patch);
    }

    @Override
    @Transactional
    public int deleteReservationByUser(Long resvId, String userId) {
        // 1) 소유권 확인
        if (!reservationMapper.existsByIdAndMemberId(resvId, userId)) {
            throw new IllegalArgumentException("NOT_FOUND_OR_FORBIDDEN: reservation=" + resvId + ", user=" + userId);
        }
        // 2) 삭제
        return reservationMapper.deleteByIdAndMemberId(resvId, userId);
    }
}
