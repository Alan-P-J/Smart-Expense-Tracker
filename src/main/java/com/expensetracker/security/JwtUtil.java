package com.expensetracker.security;

import com.expensetracker.config.JwtProperties;
import com.expensetracker.entity.AdminUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * Encapsulates all JWT creation + validation. Uses jjwt 0.12.x fluent API
 * (Jwts.builder() / Jwts.parser()) — NOT the deprecated parserBuilder().
 *
 * Two separate HS256 keys are used — one for access tokens and one for
 * refresh tokens — so a leaked refresh secret can't be used to mint
 * access tokens (and vice versa).
 */
@Component
@Slf4j
public class JwtUtil {

    public enum TokenType { ACCESS, REFRESH }

    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_TYPE = "typ";

    private final SecretKey accessKey;
    private final SecretKey refreshKey;
    private final long accessExpiryMs;
    private final long refreshExpiryMs;

    public JwtUtil(JwtProperties props) {
        this.accessKey  = Keys.hmacShaKeyFor(props.getAccessSecret().getBytes(StandardCharsets.UTF_8));
        this.refreshKey = Keys.hmacShaKeyFor(props.getRefreshSecret().getBytes(StandardCharsets.UTF_8));
        this.accessExpiryMs  = props.getAccessExpiryMs();
        this.refreshExpiryMs = props.getRefreshExpiryMs();
    }

    public String generateAccessToken(AdminUser user) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim(CLAIM_ROLE, user.getRole().name())
                .claim(CLAIM_TYPE, TokenType.ACCESS.name())
                .issuedAt(new Date(now))
                .expiration(new Date(now + accessExpiryMs))
                .signWith(accessKey, Jwts.SIG.HS256)
                .compact();
    }

    public String generateRefreshToken(AdminUser user) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(user.getId().toString())
                .claim(CLAIM_TYPE, TokenType.REFRESH.name())
                .issuedAt(new Date(now))
                .expiration(new Date(now + refreshExpiryMs))
                .signWith(refreshKey, Jwts.SIG.HS256)
                .compact();
    }

    public boolean validateAccessToken(String token) {
        return validate(token, accessKey, TokenType.ACCESS);
    }

    public boolean validateRefreshToken(String token) {
        return validate(token, refreshKey, TokenType.REFRESH);
    }

    public Long extractUserIdFromAccess(String token) {
        return Long.parseLong(parseAccess(token).getSubject());
    }

    public Long extractUserIdFromRefresh(String token) {
        return Long.parseLong(parseRefresh(token).getSubject());
    }

    public Claims parseAccess(String token) {
        return parse(token, accessKey, TokenType.ACCESS);
    }

    public Claims parseRefresh(String token) {
        return parse(token, refreshKey, TokenType.REFRESH);
    }

    private boolean validate(String token, SecretKey key, TokenType expected) {
        if (token == null || token.isBlank()) return false;
        try {
            parse(token, key, expected);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("JWT validation failed ({}): {}", expected, ex.getMessage());
            return false;
        }
    }

    private Claims parse(String token, SecretKey key, TokenType expected) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        String typ = claims.get(CLAIM_TYPE, String.class);
        if (typ == null || !typ.equals(expected.name())) {
            throw new JwtException("Token type mismatch: expected " + expected + " but got " + typ);
        }
        return claims;
    }

    public long getAccessExpiryMs()  { return accessExpiryMs;  }
    public long getRefreshExpiryMs() { return refreshExpiryMs; }
}
