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

import org.springframework.context.annotation.Bean; // @Bean 등록용
import org.springframework.context.annotation.Configuration; // 설정 클래스 표시
import org.springframework.security.config.annotation.web.builders.HttpSecurity; // 보안 빌더
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; // BCrypt 구현
import org.springframework.security.crypto.password.PasswordEncoder; // 패스워드 인코더
import org.springframework.security.web.SecurityFilterChain; // 필터체인

import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
// import com.gym.security.JwtTokenProvider; [250916 삭제]
import com.gym.security.NewJwtTokenProvider; // [250916 추가]
import com.gym.security.JwtAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() { // 비밀번호 해싱(회원 가입/로그인 대비)
        return new BCryptPasswordEncoder(); // BCrypt
    }

    // security 적용 예외 URL 등록 (Swagger 등)
    @Bean
    WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring().requestMatchers("/",
                "/v3/api-docs/**",
                "/favicon.ico",
                "/swagger-ui/**",
                "/swagger-resources/**",
                "/webjars/**",
                "/sign-api/exception",
                "/__authprobe");
    }

    // [추가] JWT 토큰 유틸 주입자
    /*
     * private final JwtTokenProvider jwtTokenProvider;
     * public SecurityConfig(JwtTokenProvider jwtTokenProvider) {
     *   this.jwtTokenProvider = jwtTokenProvider;
     * }
     */
    // 수정
    private final NewJwtTokenProvider jwtTokenProvider;

    public SecurityConfig(NewJwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    // [수정] 필터체인 메서드 1개로 통합(세션 무상태 + JWT 필터 등록 추가)
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // [추가] 세션 완전 무상태: JWT 기반 인증
        http.sessionManagement(m -> m.sessionCreationPolicy(SessionCreationPolicy.STATELESS)); // [추가]

        // 기존 개발 초기 정책 유지
        http.csrf(csrf -> csrf.disable()) // 개발 초기 임시: CSRF 비활성(운영 전 복구)
            .authorizeHttpRequests(auth -> auth

                /* ========= 무인증 공개 영역(permitAll) ========= */
                .requestMatchers(
                    "/health",    // 헬스 체크 → [GET]
                    "/health/db", // DB 헬스 체크 → [GET]
                    "/v3/api-docs/**",    // Swagger JSON → [GET]
                    "/swagger-ui/**",     // Swagger UI → [GET]
                    "/sign-api/**"        // 로그인/회원가입 → [POST/GET]
                ).permitAll()

                // 사용자 공개 조회 -------------------------
                .requestMatchers(
                    "/api/facilities",    // 시설 목록 → [GET]
                    "/api/facilities/*",  // 시설 단건 → [GET]
                    "/api/boards/*/posts",    // 게시글 목록 → [GET]
                    "/api/boards/*/posts/*",  // 게시글 상세 → [GET]
                    "/api/contents",      // 콘텐츠 목록 → [GET]
                    "/api/contents/*"     // 콘텐츠 상세 → [GET]
                ).permitAll()

                /* ========= 로그인 사용자(일반회원 이상) ========= */
                .requestMatchers(
                    "/api/members/*",    // 내 정보 조회/수정/삭제 → [GET/PUT/DELETE]
                    "/api/accounts",     // 계좌 등록 → [POST]
                    "/api/accounts/*/main",   // 대표계좌 설정 → [PATCH]
                    "/api/members/*/accounts",// 내 계좌 목록 → [GET]
                    "/api/accounts/*",   // 계좌 삭제 → [DELETE]

                    // --- Cards (사용자용) ---
                    // [old]
                    // "/api/cards/**",    // 카드 등록/수정/대표설정/삭제/조회(사용자) → [POST/PUT/PATCH/DELETE/GET]
                    // "/api/cards/*/main",    // 대표카드 설정(사용자) → [PATCH]
                    // "/api/members/*/cards", // 회원별 카드 목록(사용자) → [GET]
                    // "/api/cards/*",     // 카드 삭제(사용자) → [DELETE]

                    // [250917] 사용자 카드 전용(본인 계정만 처리, CMS는 별도 경로로 분리)
                    "/api/cards/**",    // 사용자 카드 등록/수정/대표설정/삭제/조회 → [POST/PUT/PATCH/DELETE/GET]
                    "/api/members/*/cards",    // 사용자 카드 목록 → [GET]

                    "/api/reservations/**",   // 예약 신청/변경/조회/삭제 → [POST/PUT/GET/DELETE]
                    "/api/boards/*/posts",    // 게시글 등록 → [POST]
                    "/api/boards/*/posts/*",  // 게시글 수정/삭제 → [PUT/DELETE]
                    "/api/comments/**",       // 댓글 등록/수정/삭제 → [POST/PUT/DELETE]
                    "/api/payments",          // 결제 등록 → [POST]
                    "/api/payments/search"    // 결제 목록/검색 → [GET]
                ).authenticated()

                /* ========= 담당자/최고관리자 ========= */
                .requestMatchers(
                    "/api/facilities",    // 시설 생성 → [POST]
                    "/api/facilities/*",  // 시설 수정/삭제 → [PUT/DELETE]
                    "/api/facilities/*/use" // 시설 사용여부 변경 → [PATCH]
                ).hasAnyAuthority("담당자","최고관리자")

                /* ========= 관리자/최고관리자 ========= */
                .requestMatchers(
                    "/api/contents",     // 콘텐츠 등록 → [POST]
                    "/api/contents/*",   // 콘텐츠 수정/삭제 → [PUT/DELETE]
                    "/api/cms/boards/**",// CMS 게시판 관리 → [GET/POST/PUT/DELETE]
                    "/api/payments/*/status" // 결제 상태 변경 → [PUT]
                ).hasAnyAuthority("관리자","최고관리자")

                /* ========= 최고관리자 전용 ========= */
                .requestMatchers(
                    "/api/members",      // 회원 목록(관리) → [GET]
                    "/api/closed-days/**", // 휴무일 등록/수정/삭제 → [POST/PUT/DELETE]
                    "/api/paymentlogs/**", // 결제 로그 조회 → [GET]
                    "/api/files/**"      // 파일 업로드/삭제/조회 → [GET/POST/DELETE]
                ).hasAuthority("최고관리자")

                /* ========= [250917] 카드 CMS 전용(admin/superadmin) ========= */
                .requestMatchers(
                    "/api/cms/cards/**"  // CMS 카드 관리(등록/수정/삭제/조회) → [GET/POST/PUT/DELETE]
                ).hasAnyAuthority("ROLE_ADMIN","ROLE_SUPERADMIN")

                /* ========= 기타 ========= */
                .anyRequest().authenticated() // 그 외 결과 → 인증 필요
            );

        // JWT 인증 필터 등록 (스프링의 UsernamePasswordAuthenticationFilter 앞에 삽입)
        http.addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

}
