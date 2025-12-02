package com.gym.mapper.xml;

import com.gym.domain.message.Message;
import com.gym.domain.message.MessageResponse;
import com.gym.domain.message.MessageMarkReadRequest;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * MyBatis 매퍼 인터페이스
 * SQL Mapper XML과 연동되어 DB 작업 수행
 */
@Mapper
public interface MessageMapper {

    /**
     * 251016 추가
     * 읽지 않은 메시지 개수 반환 메서드 (회원별)
     * @param memberId 회원 ID
     * @return 읽지 않은 메시지 개수
     * 
     * 2025-10-17 수정
     * @Param 어노테이션 추가로 MyBatis 파라미터 이름 인식 문제 해결
     */
    int countUnreadMessages(@Param("memberId") String memberId);

    /**
     * 메시지 저장 (insert)
     * @param message 저장 대상 메시지 정보
     * @return 저장된 메시지 고유 ID (생성된 키값)
     */
    int insertMessage(Message message);

    /**
     * 전체 메시지 목록 조회 (단일 엔드포인트용 필터)
     * @param params 검색 파라미터 맵 (startDate, endDate, messageType, receiverId)
     * @return 메시지 전체 리스트
     */
    List<MessageResponse> selectAllMessages(Map<String, Object> params);

    /**
     * 251016 추가
     * 회원별 메시지 리스트 조회 (limit 포함)
     * @param memberId 회원 ID
     * @param limit 최대 리스트 개수
     * @return 회원별 메시지 리스트
     */
    List<MessageResponse> findByMemberId(@Param("memberId") String memberId, @Param("limit") int limit);

    /**
     * 메시지 읽음 처리
     * @param messageId 메시지 고유 ID
     * 
     * 2025-10-17 수정
     * @Param 어노테이션 추가 권장 (일관성 및 명시성 위해)
     */
    // int markAsRead(@Param("messageId") Long messageId);
    // int markAsRead(@Param("request") MessageMarkReadRequest request);
    int markAsRead(@Param("messageId") Long messageId); // [251023] DTO 대신 Long 타입의 messageId를 직접 받도록 변경

}
