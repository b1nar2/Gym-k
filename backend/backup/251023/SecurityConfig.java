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
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; // BCrypt 구현
import org.springframework.security.crypto.password.PasswordEncoder; // 패스워드 인코더
import org.springframework.security.web.SecurityFilterChain; // 필터체인

import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
// import com.gym.security.JwtTokenProvider; [250916 삭제]
import com.gym.security.NewJwtTokenProvider; // [250916 추가]
import com.gym.security.JwtAuthenticationFilter;
import org.springframework.http.HttpMethod; //[250917 추가]
import org.springframework.web.bind.annotation.RequestMapping;
//⚠️ [251007 추가] CORS 전역 설정용 import
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
//⚠️ [251007 추가] CORS 전역 설정용 import

@Configuration
@EnableWebSecurity // ★★★ 시큐리티 인식을 위해 꼭 필요함, 안그러면 에러는 403만 나옴 ★★★  
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
                "/__authprobe",
                "/images/**" // 이미지 다운로드 허용
                //,"/api/cms/reservations" // [251021] 테스트
        		//,"/api/membersTEMP/me" //250929회원정보 리엑트 연동을 위한 임시 테스트
                //,"/api/boards/*/posts/*/comments/**"
        		);
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

    // ⚠️ [251007 추가] CORS 설정 Bean (전역 허용)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOriginPattern("*"); // 모든 Origin 허용
        configuration.addAllowedMethod("*");        // 모든 HTTP Method 허용
        configuration.addAllowedHeader("*");        // 모든 Header 허용
        configuration.setAllowCredentials(true);    // 쿠키·인증정보 허용
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    // ⚠️ [251007 추가] CORS 설정 Bean (전역 허용)
    
    // [수정] 필터체인 메서드 1개로 통합(세션 무상태 + JWT 필터 등록 추가)
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // [추가] 세션 완전 무상태: JWT 기반 인증
        http.sessionManagement(m -> m.sessionCreationPolicy(SessionCreationPolicy.STATELESS)); // [추가]

        // 기존 개발 초기 정책 유지
        http.csrf(csrf -> csrf.disable()) // 개발 초기 임시: CSRF 비활성(운영 전 복구)
            .authorizeHttpRequests(auth -> auth

            		/* ====================== 회원(CMS) API ====================== */

            		/* ========= 로그인 사용자(일반회원 이상) ========= */
            		// 25년 10월 21일 연동 문제로 위치를 이동시킴 (중간에 예약신청을 막고 있음)
	            	.requestMatchers(
            	    //  "/api/members/*",    // 내 정보 조회/수정/삭제 → [GET/PUT/DELETE]
            	        "/api/reservations/**",   // 예약 신청/변경/조회/삭제 → [POST/PUT/GET/DELETE]
            	        
            	        "/api/cms/reservations",   //[251021] 예약 조회
            	        "/api/cms/reservations/**",   //[251021] 예약 신청/변경/조회/삭제
            	        
            	        "/api/boards/*/posts",    // 게시글 등록 → [POST]
            	        "/api/boards/*/posts/*",  // 게시글 수정/삭제 → [PUT/DELETE]
            	        // "/api/comments/**",       // 댓글 등록/수정/삭제 → [POST/PUT/DELETE]
            	        "/api/payments",          // 결제 등록 → [POST]
            	        "/api/payments/search"    // 결제 목록/검색 → [GET]
            	    ).permitAll()
	            	//).authenticated()
            		
            		
            		// CMS 회원 관리: ROLE_ADMIN, 책임자, 관리자 허용
            		.requestMatchers("/api/cms/members/**").hasAnyAuthority("ROLE_ADMIN", "책임자", "관리자", "admin")
            		/* ====================== 회원(CMS) API ====================== */
            		
            		/* ========= 250929 회원정보 리엑트 연동 테스트  ========= */
            		.requestMatchers(HttpMethod.GET, "/api/membersTEMP/test").permitAll()
            		/* ========= 250929 회원정보 리엑트 연동 테스트  ========= */
            		
            	    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()   // ← 프리플라이트 허용(최상단)

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
            	        "/api/boards/*/posts/*"   // 게시글 상세 → [GET]
            	    ).permitAll()
            	                	    
            	    /* =========================== 콘텐츠 권한 분리  =========================== */
            	    // --- 콘텐츠 단건 조회: 누구나(permitAll) - 링크 클릭 시 단건 조회 허용 ---
            	    .requestMatchers(HttpMethod.GET, "/api/contents/**").permitAll() // GET: 콘텐츠 단건 조회 (뷰/링크)
            	    .requestMatchers(HttpMethod.POST, "/api/cms/contents").permitAll() // ⚠️ 첨부파일 업로드 허용
            	    /* =========================== 콘텐츠 권한 분리  =========================== */
            	    
            	    /* =========================== 계좌 권한 분리 =========================== */
            	    // --- 계좌 등록/목록/대표지정/삭제: 로그인 본인만 허용 ---
            	    .requestMatchers(HttpMethod.POST, "/api/accounts").authenticated()           // POST: 계좌 등록
            	    .requestMatchers(HttpMethod.GET, "/api/members/*/accounts").authenticated() // GET: 회원별 계좌 목록 조회
            	    .requestMatchers(HttpMethod.PATCH, "/api/accounts/*/main").authenticated()  // PATCH: 대표계좌 설정
            	    .requestMatchers(HttpMethod.DELETE, "/api/accounts/*").authenticated()      // DELETE: 계좌 삭제
            	    /* =========================== 계좌 권한 분리 =========================== */

            	    /* =========================== 카드 권한 분리 =========================== */
            	    // --- 카드 등록/목록/대표지정/삭제: 로그인 본인만 허용 ---
            	    .requestMatchers(HttpMethod.POST, "/api/cards").authenticated()            // POST: 카드 등록
            	    .requestMatchers(HttpMethod.GET, "/api/members/*/cards").authenticated()   // GET: 회원별 카드 목록 조회
            	    .requestMatchers(HttpMethod.PATCH, "/api/cards/*/main").authenticated()    // PATCH: 대표카드 설정
            	    .requestMatchers(HttpMethod.DELETE, "/api/cards/*").authenticated()        // DELETE: 카드 삭제
            	    /* =========================== 카드 권한 분리 =========================== */
            	    
            	    /* =========================== 게시판 권한 분리 =========================== */
            	    .requestMatchers(HttpMethod.GET, "/api/boards/**").permitAll()
            	    /* =========================== 게시판 권한 분리 =========================== */

            	    /* ============================= CMS 관리 =========================== */
            	    // 통계정보 (251022)
            	    // .requestMatchers("/api/cms/stats").hasAnyRole("ADMIN")// CMS 통계 정보가 권한 때문에 403 에러가 뜸
            	    .requestMatchers("/api/cms/stats", "/api/cms/stats/**", "/api/cms/dashboard/**").hasAnyRole("ADMIN")
            	    // 계좌
            	    .requestMatchers("/api/cms/accounts/**").hasAnyAuthority("관리자","책임자","ROLE_ADMIN","admin")
            	    // 카드
            	    .requestMatchers("/api/cms/cards/**").hasAnyAuthority("관리자","책임자","ROLE_ADMIN","admin")
            	    // 콘텐츠 
            	    .requestMatchers("/api/cms/contents/**").hasAnyRole("ADMIN")
            	    // 시설
            	    .requestMatchers("/api/cms/facilities/**").hasAnyAuthority("강사","책임자","ROLE_ADMIN","admin")
            	    // 게시판
            	    .requestMatchers("/api/cms/boards/**").hasAnyAuthority("관리자","책임자","ROLE_ADMIN","admin")
            	    
            	    /* ======================= CMS 계좌/카드 관리 =========================== */
            	    
            	    /* ====================== 파일 권한 분리 [250923파일권한] ====================== */
            	    // ✅ 비로그인 허용: 목록/미리보기/다운로드(GET)
            	    .requestMatchers(HttpMethod.GET, "/api/files").permitAll()                   // 파일 목록
            	    .requestMatchers(HttpMethod.GET, "/api/files/*/preview").permitAll()        // 미리보기
            	    .requestMatchers(HttpMethod.GET, "/api/files/download").permitAll()         // 다운로드
            	    .requestMatchers(HttpMethod.POST, "/api/files/upload/**").permitAll()      // 업로드도 허용
            	    .requestMatchers(HttpMethod.POST, "/api/files/upload/editor").permitAll()// [251014] 업로드도 허용 + 리치에디터 하용(**)
            	    /* ====================== 파일 권한 분리 [250923파일권한] ====================== */
            	    
            	    /* ====================== 공휴일 권한 분리 [250924권한] ====================== */
            	    // ✅ 비로그인 허용: 목록(GET)
            	    .requestMatchers(HttpMethod.GET, "/api/closed-days/**").permitAll() // 목록 조회
            	    
            	    // 🔒 로그인 필요: 등록/수정/삭제
            	    .requestMatchers("/api/cms/closed-days/**").hasAnyAuthority("강사","책임자","ROLE_ADMIN","admin")
            	    /* ====================== 파일 권한 분리 [250924권한] ====================== */
            	    
            	    /* ====================== 게시글 권한 분리 [250924게시글권한] ====================== */
            	    // ✅ 비로그인 허용: 목록/상세 조회(GET) — 사용자 화면용
            	    .requestMatchers(HttpMethod.GET, "/api/posts").permitAll() // 게시글 목록 조회(비로그인 허용)
            	    .requestMatchers(HttpMethod.GET, "/api/posts/*").permitAll()// 게시글 단건 조회(비로그인 허용)

            	    // 🔒 로그인 필요: 등록/수정/삭제 — 작성자 본인 여부는 컨트롤러에서 검사(관리자·최고관리자는 예외 허용)
            	    .requestMatchers(HttpMethod.POST,   "/api/posts").authenticated()      // 게시글 등록(로그인 필요)
            	    .requestMatchers(HttpMethod.PUT,    "/api/posts/*").authenticated()    // 게시글 수정(로그인 필요)
            	    .requestMatchers(HttpMethod.DELETE, "/api/posts/*").authenticated()    // 게시글 삭제(로그인 필요)

            	    // 🔒 CMS 전용: 관리자 권한만 접근 가능 — 담당자/관리자/책임자
            	    .requestMatchers("/api/cms/posts/**")
            	    .hasAnyAuthority("담당자","관리자","책임자") // CMS 게시글 관리(권한 계정만 허용)
            	    /* ====================== 게시글 권한 분리 [250924게시글권한] ====================== */
            	    
            	    /* ====================== 댓글 권한 분리 [250925 댓글 권한] ====================== */
            	    //[251020] 이전
            	    .requestMatchers("/api/boards/*/posts/*/comments/**").permitAll() // post 허용 (로그인했을 경우)
            	    .requestMatchers("/api/boards/**/posts/**/comments/demo").permitAll() // ⚠️ 테스트용 댓글 등록 임시 허용
            	    .requestMatchers("/api/cms/boards/**/posts/**/comments/**").permitAll() // [251020] CMS 댓글 조회·삭제 허용
            	    /* ====================== 댓글 권한 분리 [250925 댓글 권한] ====================== */
            	    
            	    
            	    /* ====================== 회원(사용자) API ====================== */
	            	.requestMatchers(HttpMethod.POST, "/api/members").permitAll()
	            	.requestMatchers(HttpMethod.GET,  "/api/members/me").authenticated()
	            	.requestMatchers(HttpMethod.PUT,  "/api/members/me").authenticated()
	            	
	            	.requestMatchers(HttpMethod.GET,    "/api/members").denyAll()
	            	.requestMatchers(HttpMethod.DELETE, "/api/members/*").denyAll()
	            	/* ====================== 회원(사용자) API ====================== */
	
	            	/* ====================== 회원(CMS) API ====================== */
	            	// CMS 회원 관리: ROLE_ADMIN만 1차 허용
	            	// ※ 최종 등급 검증은 컨트롤러에서 adminType == "책임자"로만 진행 가능
	            	.requestMatchers("/api/cms/closed-days/**").hasAnyAuthority("ROLE_ADMIN", "책임자", "admin")
	            	/* ====================== 회원(CMS) API ====================== */
        
            	    .anyRequest().authenticated()
            	);

        // JWT 인증 필터 등록 (스프링의 UsernamePasswordAuthenticationFilter 앞에 삽입)
        http.addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

}
