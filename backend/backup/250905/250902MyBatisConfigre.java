package com.gym.config;                               // ⚙️ 설정 패키지

import org.apache.ibatis.session.SqlSessionFactory;   // ⚙️ 팩토리
import org.mybatis.spring.SqlSessionFactoryBean;      // ⚙️ 팩토리 빈
import org.mybatis.spring.annotation.MapperScan;      // ⚙️ 매퍼 스캔
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;    // ⚙️ @Bean
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import javax.sql.DataSource;

@Configuration
@MapperScan(basePackages = {
        "com.gym.mapper.annotation",                  // ✅ 어노테이션 매퍼
        "com.gym.mapper.xml"                          // ✅ XML 매퍼 인터페이스 패키지
})
public class MyBatisConfig {
	
	@Bean
    @ConfigurationProperties(prefix="spring.datasource")
    DataSourceProperties dataSourceProp() {
        return new DataSourceProperties();
    }
   
    @Bean(name="dataSource")
    @ConfigurationProperties(prefix="spring.datasource")
    DataSource dataSource() {
        return dataSourceProp().initializeDataSourceBuilder().build();
    }

    @Bean
    //public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
    public SqlSessionFactory sqlSessionFactory() throws Exception {
        SqlSessionFactoryBean bean = new SqlSessionFactoryBean();
        bean.setDataSource(dataSource());               // 💾 커넥션 풀 주입

        // ✅ 사용자의 실제 경로: /src/main/resources/mappers/account-mapper.xml
        //    → 모든 하위 XML을 인식하도록 와일드카드 지정
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        bean.setMapperLocations(resolver.getResources("classpath*:/mappers/**/*.xml"));

        // (선택) 언더스코어→카멜 자동 매핑
        // org.apache.ibatis.session.Configuration conf = new org.apache.ibatis.session.Configuration();
        // conf.setMapUnderscoreToCamelCase(true);
        // bean.setConfiguration(conf);

        return bean.getObject();
    }
}
