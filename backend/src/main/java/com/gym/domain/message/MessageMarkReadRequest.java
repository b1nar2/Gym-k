package com.gym.domain.message;

import lombok.Getter;
import lombok.Setter;

/**
 * 2025-10-20 읽음 처리용 메시지 ID 전달 DTO
 * 단일 Long 파라미터 대신 DTO로 감싸 매퍼 파라미터명 문제를 회피하기 위함
 */
@Getter
@Setter
public class MessageMarkReadRequest {

    /**
     * 메시지 고유 ID
     */
    private Long messageId;

    public MessageMarkReadRequest() {}

    public MessageMarkReadRequest(Long messageId) {
        this.messageId = messageId;
    }
}
