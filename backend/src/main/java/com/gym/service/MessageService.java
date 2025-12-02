package com.gym.service;

import com.gym.domain.message.Message;
import com.gym.domain.message.MessageResponse;

import java.util.List;

/**
 * 메시지 관련 서비스 인터페이스
 * - 메시지 전송, 조회 기능 제공
 */
public interface MessageService {
	
	/**
	 * 251016 추가
	 * 메시지 읽음 처리
	 * @param messageId 메시지 고유 ID
	 */
	int markAsRead(Long messageId);

	
	/**
	 * 251016 추가
	 * 사용자별 읽지 않은 메시지 수 조회 서비스 인터페이스
	 */
	int countUnreadMessages(String memberId);

    /**
     * 251016 추가
     * 사용자별 메시지 리스트 조회 서비스 인터페이스
     */
    List<MessageResponse> findByMemberId(String memberId, int limit);

    /**
     * 메시지 저장 및 로그 기록
     * @param message 저장할 메시지 객체
     */
    void sendMessage(Message message);

    /*
     * 2025.09.11 개선형
     * @param startDate 전송날짜 시작일
     * @param endDate   전송날짜 종료일
     * @param messageType 전송메시지 종류 — 옵션
     * @param receiverId 수신자 회원ID — 옵션
     * @return 필터 조건에 부합하는 메시지 전체 리스트
     */
    List<MessageResponse> getAllMessages (String startDate,
    									  String endDate,
    									  String messageType,
    									  String receiverId);
    
}
