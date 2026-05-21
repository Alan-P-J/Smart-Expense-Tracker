package com.expensetracker.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String COOKIE_SECURITY_NAME = "access_token";

    @Bean
    public OpenAPI customOpenAPI() {
        SecurityScheme cookieScheme = new SecurityScheme()
                .type(SecurityScheme.Type.APIKEY)
                .in(SecurityScheme.In.COOKIE)
                .name(COOKIE_SECURITY_NAME);

        return new OpenAPI()
                .info(new Info()
                        .title("Expense Tracker API")
                        .version("1.0.0")
                        .description("REST API for Expense Tracker — Spring Boot 3 / Java 21"))
                .components(new Components()
                        .addSecuritySchemes(COOKIE_SECURITY_NAME, cookieScheme))
                .addSecurityItem(new SecurityRequirement().addList(COOKIE_SECURITY_NAME));
    }
}
