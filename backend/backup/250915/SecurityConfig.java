/* ============================================================
[임시 설정] 개발 단계 전용(SecurityConfig)
- 목적: /health, /health/db, /v3/api-docs/**, /swagger-ui/** 만 permitAll
- 임시 허용: csrf.disable()  ← 개발 단계에서만 허용
- 금지: 운영(prod)에서 csrf.disable() 유지 금지, /health/db 외부 공개 금지
- 실전 전 TODO(반드시 수행):
  1) csrf.enable()로 복구
  2) /health/db 삭제 또는 내부망/IP 제한
  3) Swagger UI 외부 비공개(문서 JSON은 CI에서만 수집)
- 스택/규칙: STS4 + Spring Boot 3.4.9 + MyBatis + Log4j2 + Oracle + Gradle
- 금기: 파워셸, 임의 확장/리팩토링, 불필요한 엔드포인트 추가
============================================================ */

package com.gym.config;

import org.springframework.context.annotation.Bean; //@Bean 등록용
import org.springframework.context.annotation.Configuration; // 설정 클래스 표시
import org.springframework.security.config.annotation.web.builders.HttpSecurity; // 보안 빌더
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain; // 필터체인
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; // BCrypt 구현
import org.springframework.security.crypto.password.PasswordEncoder;     // 패스워드 인코더

/**
 * Spring Security 최소 뼈대 설정
 * - 목적: 헬스체크/Swagger만 공개, 나머지는 인증 필요(추후 정책 강화 전제)
 * - 주의: 개발 초기엔 CSRF 비활성(폼로그인/세션 정책 확립 전)
 */
@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() { // 비밀번호 해싱(회원 가입/로그인 대비)
        return new BCryptPasswordEncoder();    // BCrypt
    }
    //=======================================================================================
	
    // security 적용 예외 URL 등록
    // Swagger 페이지 접근에 대한 제외(열외) 처리
    @Bean
    WebSecurityCustomizer webSecurityCustomizer() {
    	
    	return (web) -> web.ignoring()
    					   // 접근권한 없이 접속할 수 있는 주소 입력
    					   .requestMatchers("/", 
    							   			"/v3/api-docs/**",     							   			
    							   			"/favicon.ico",
    							   			"/swagger-ui/**", 
    							   			"/swagger-resources/**",
							   				"/webjars/**", 
							   				"/sign-api/exception");
    }
    
    //========================================================================================
        
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    	 // 250915 추가사항 로그인 토큰(매우 중요)
    	http.sessionManagement(sessionManagement ->
	         sessionManagement.sessionCreationPolicy(
             SessionCreationPolicy.STATELESS)); // JWT Token 인증방식으로 세션은 필요 없으므로 비활성화
    	// 개발 초기 테스트용     	
        http.csrf(csrf -> csrf.disable()) // ⚠️ 개발 초기 임시: CSRF 비활성
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/health", "/health/db",			// 헬스 체크(앱/DB)
                    "/v3/api-docs/**", "/swagger-ui/**",	// Swagger(OpenAPI) 문서/화면
                    
                    /*--------- 임시 환경세팅 검증 테스트용---------*/
                    "/api/members/**",		// 회원 정보
                    "/api/accounts/**",		// 계좌 정보
                    "/api/facilities/**",	// 시설 정보
                    "/api/cards/**",		// 카드 정보
                    "/api/payments/**",		// 결제 정보
                    "/api/paymentlogs/**",	// 결제 내역
                    //-- 리우씨꺼 --
                    "/api/contents/**",   // ✅ 콘텐츠 허용
                    "/api/files/**",      // ✅ 파일 허용
                    //-- 수진씨꺼 --
                    "/api/messages/**",					// 메시지 임시 허용
                    "/api/closed-days/**",				// 휴무일 삭제 임시허용
                    "/api/boards/*/posts/**",			// 게시글 임시 허용
                    "/api/comments/**",					// 댓글 임시 허용
                    /*-- 종범씨꺼 --*/
                    "/api/reservations/**",
                    "/api/cms/boards/**"
                    /*--------- 임시 환경세팅 검증 테스트용---------*/
                    
                ).permitAll()
                .anyRequest().authenticated() // 그외 결과 → 인증 필요(기본 정책) 로그인만 하면 됨
            );
        return http.build();
    }
    // 250915 기존껀 JPA 최적화였었는데, 이제부터 MyBatis 최적화로 바꿔야 함
    //========================================================================================
    
    
    
}
