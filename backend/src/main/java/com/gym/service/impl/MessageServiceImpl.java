package com.gym.service.impl;

import com.gym.domain.message.Message;
import com.gym.domain.message.MessageResponse;
import com.gym.domain.message.MessageMarkReadRequest;
import com.gym.mapper.xml.MessageMapper;
import com.gym.service.MessageService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 메시지 관련 비즈니스 로직 구현 클래스
 * - 메시지 저장 시 현재 시간 세팅, DB 삽입 및 로그 기록
 * - 조회 및 카운트 기능 구현
 */
@Service
public class MessageServiceImpl implements MessageService {

    private static final Logger logger = LoggerFactory.getLogger(MessageServiceImpl.class);

    private final MessageMapper messageMapper;

    /**
     * 생성자 기반 의존성 주입
     * @param messageMapper 메시지 매퍼
     */
    public MessageServiceImpl(MessageMapper messageMapper) {
        this.messageMapper = messageMapper;
    }
       
    /**
     * 251016 추가
     * DB에서 읽지 않은 메시지 수 조회 메서드
     */
    @Override
    public int countUnreadMessages(String memberId) {
        logger.info("[translate:읽지 않은 메시지 개수 조회] memberId={}", memberId);
        int count = messageMapper.countUnreadMessages(memberId);
        logger.info("[translate:읽지 않은 메시지 개수] {}", count);
        return count;
    }

    /**
     * 251016 추가
     * 회원별 메시지 리스트 조회 메서드
     */
    @Override
    public List<MessageResponse> findByMemberId(String memberId, int limit) {
        logger.info("[translate:매퍼 호출] memberId={} 및 limit={} 로 호출합니다.", memberId, limit); // 로그확인
        List<MessageResponse> list = messageMapper.findByMemberId(memberId, limit);
        logger.info("[translate:매퍼가 반환한 결과 수] {}건", list.size());
        return list;
    }

    /**
     * 메시지 저장 및 로그 기록
     */
    @Override
    public void sendMessage(Message message) {
        // 메시지 발송 시 현재 서버시간으로 발송일시 세팅 (나노초는 0으로)
        message.setMessageDate(LocalDateTime.now().withNano(0));

        // DB에 메시지 저장 (영향받은 행 수 반환)
        int affected = messageMapper.insertMessage(message);
        if (affected != 1) {
            throw new IllegalStateException("[translate:메시지 저장 실패:] 예상과 다른 영향 행 수 " + affected);
        }

        // 메시지 전송 내용 로그 기록
        logger.info("[translate:문자전송 요청] - 수신자 ID: {}, 유형: {}, 내용: {}, 발송 시간: {}",
            message.getMemberId(),
            message.getMessageType(),
            message.getMessageContent(),
            message.getMessageDate());
    }

    /**
     * 전체 메시지 조회 (필터 조건 포함)
     */
    @Override
    public List<MessageResponse> getAllMessages(String startDate, String endDate, String messageType, String receiverId) {
        Map<String, Object> params = new HashMap<>();
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        
        params.put("messageType", messageType);
        params.put("receiverId", receiverId);

        logger.info("[translate:전체 메시지 조회] 필터 - startDate: {}, endDate: {}, messageType: {}, receiverId: {}",
                startDate, endDate, messageType, receiverId);

        List<MessageResponse> list = messageMapper.selectAllMessages(params);

        logger.info("[translate:전체 메시지 조회 결과] {}건 반환", list.size());

        return list;
    }
    /*
     * 251020 Transactional 어노테이션 추가
     * 읽음 처리처럼 데이터 변경이 발생하는 서비스 메서드에는 @Transactional을 붙이는 것이 안전함
     * 여러 DB 작업이 있을 경우 원자성 보장 가능
     * 예외 발생 시 롤백 처리 자동 적용
    */
    @Transactional 
    @Override
    public int markAsRead(Long messageId) {
        /*
    	MessageMarkReadRequest request = new MessageMarkReadRequest(messageId);
        return messageMapper.markAsRead(request);
        */
    	return messageMapper.markAsRead(messageId); 
    	// [251023] 불필요한 DTO 생성 로직 → mapper에 있는 Long (messageId) 값을 직접 전달
    }
}
