package com.expensetracker.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Binds the `jwt.*` block from application.yml.
 *
 * Both secrets must be at least 32 characters — HS256 requires a key of
 * at least 256 bits and jjwt 0.12.x throws WeakKeyException otherwise.
 */
@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    @NotBlank
    @Size(min = 32, message = "jwt.access-secret must be at least 32 characters (256 bits)")
    private String accessSecret;

    @NotBlank
    @Size(min = 32, message = "jwt.refresh-secret must be at least 32 characters (256 bits)")
    private String refreshSecret;

    @Min(60_000)
    private long accessExpiryMs;

    @Min(60_000)
    private long refreshExpiryMs;
}
