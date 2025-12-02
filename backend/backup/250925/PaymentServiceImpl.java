package com.gym.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import com.gym.domain.payment.*;
import com.gym.mapper.xml.PaymentMapper;
import com.gym.service.PaymentService;
// import org.springframework.dao.DataIntegrityViolationException;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class PaymentServiceImpl implements PaymentService {

	private final PaymentMapper paymentMapper;

	/**
     * 결제 등록
     * - paymentMethod 미입력 시 accountId/cardId로 자동 유추
     * - paymentStatus 미입력 시 '예약' 기본값 적용
     * - INSERT 성공 시 같은 세션에서 CURRVAL 회수
     */
	@Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(PaymentCreateRequest req) {
        // [1] 결제수단 보정: 미입력 시 accountId/cardId로 자동 유추
        String method = (req.getPaymentMethod() == null) ? "" : req.getPaymentMethod().trim();
        if (method.isEmpty()) { // 미입력 → 자동 유추
            if (req.getAccountId() != null && req.getCardId() == null) {
                method = "계좌";
            } else if (req.getCardId() != null && req.getAccountId() == null) {
                method = "카드";
            } else {
                throw new IllegalArgumentException("결제수단을 유추할 수 없습니다. 계좌 또는 카드 중 하나만 지정하세요.");
            }
            req.setPaymentMethod(method);
        } else { // 명시 입력 → 조합 규칙 검사(상호배타)
            if ("계좌".equals(method)) {
                if (req.getAccountId() == null || req.getCardId() != null) {
                    throw new IllegalArgumentException("결제수단이 '계좌'이면 accountId만 지정해야 합니다.");
                }
            } else if ("카드".equals(method)) {
                if (req.getCardId() == null || req.getAccountId() != null) {
                    throw new IllegalArgumentException("결제수단이 '카드'이면 cardId만 지정해야 합니다.");
                }
            } else {
                throw new IllegalArgumentException("paymentMethod는 '계좌' 또는 '카드'만 허용됩니다.");
            }
        }

        // [2] 상태 기본값 보정: 미입력 시 '예약'
        if (req.getPaymentStatus() == null || req.getPaymentStatus().isBlank()) {
            req.setPaymentStatus("예약");
        }

        // [3] 엔티티 빌드
        Payment p = Payment.builder()
                .memberId(req.getMemberId())
                .accountId(req.getAccountId())
                .cardId(req.getCardId())
                .resvId(req.getResvId())
                .paymentMoney(req.getPaymentMoney())
                .paymentMethod(req.getPaymentMethod())   // 위에서 보정
                .paymentStatus(req.getPaymentStatus())   // 위에서 보정
                .build();

        // [4] INSERT 실행 (조건 불일치 시 0 반환)
        int rows = paymentMapper.insertPayment(p);
        if (rows != 1) {
            throw new IllegalArgumentException("결제 등록 실패: 잘못된 값 또는 존재하지 않는 참조");
        }

        // [5] 같은 세션에서 CURRVAL 회수
        Long id = paymentMapper.getPaymentSeqCurrval();
        p.setPaymentId(id);
        return id;
    }

	/**
     * 결제 목록/검색
     * - paymentId, memberId, resvId, method, paymentStatus 등 선택적 필터
     * - 페이징 없음(요청 범위 준수)
     */
    @Override
    public List<PaymentResponse> findList(PaymentSearchRequest req) {
        return paymentMapper.selectPayments(req).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }


	/*
	 * @Override public int count(PaymentSearchRequest req) { return
	 * paymentMapper.countPayments(req); }
	 */

    
    /**
     * 결제 상태 변경
     * - 허용값: '완료' | '예약' | '취소'
     */
	@Override
	@Transactional(rollbackFor = Exception.class)
	public void updateStatus(Long paymentId, String status) {
		int rows = paymentMapper.updatePaymentStatus(paymentId, status);
		if (rows != 1)
			throw new IllegalStateException("상태 변경 실패");
	}

	/** 내부 변환: 엔티티 → 응답 DTO */
    private PaymentResponse toResponse(Payment p) {
        return PaymentResponse.builder()
                .paymentId(p.getPaymentId())
                .memberId(p.getMemberId())
                .accountId(p.getAccountId())
                .cardId(p.getCardId())
                .resvId(p.getResvId())
                .paymentMoney(p.getPaymentMoney())
                .paymentMethod(p.getPaymentMethod())
                .paymentStatus(p.getPaymentStatus())
                .paymentDate(p.getPaymentDate())
                .build();
    }
}
