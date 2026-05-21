package com.expensetracker.service;

import com.expensetracker.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

/**
 * Nightly job that purges refresh tokens which are revoked or expired more
 * than 24 hours ago. The 24-hour grace window keeps revoked tokens around
 * briefly for forensic / audit visibility before they're deleted.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenCleanupService {

    private final RefreshTokenRepository refreshRepo;

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeExpiredAndRevoked() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusDays(1);
        long before = refreshRepo.count();
        refreshRepo.deleteExpiredAndRevoked(cutoff);
        long after = refreshRepo.count();
        log.info("TokenCleanup: removed {} refresh tokens (cutoff={})", before - after, cutoff);
    }
}
