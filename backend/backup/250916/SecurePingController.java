package com.gym.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement; // 스웨거 보안 요구 어노테이션
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController // REST API 컨트롤러
public class SecurePingController {

    @SecurityRequirement(name = "X-AUTH-TOKEN") // 이 API 호출 시 스웨거가 X-AUTH-TOKEN 헤더 자동 첨부
    @GetMapping("/api/secure/ping") // 보호된 엔드포인트
    public String ping() {
        return "secured"; // 정상 접근 시 응답
    }
}
