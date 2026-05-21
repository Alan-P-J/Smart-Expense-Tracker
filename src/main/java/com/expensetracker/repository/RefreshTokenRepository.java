package com.expensetracker.repository;

import com.expensetracker.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    // Revoke all tokens for a user — called on logout and password change
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.isRevoked = true " +
           "WHERE rt.user.id = :userId AND rt.isRevoked = false")
    void revokeAllByUserId(Long userId);

    // Cleanup: remove expired and already-revoked tokens
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :cutoff OR rt.isRevoked = true")
    void deleteExpiredAndRevoked(OffsetDateTime cutoff);
}
