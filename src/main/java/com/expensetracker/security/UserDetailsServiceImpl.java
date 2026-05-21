package com.expensetracker.security;

import com.expensetracker.entity.AdminUser;
import com.expensetracker.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final AdminUserRepository repo;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        AdminUser user = repo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));

        if (!user.isActive()) {
            throw new DisabledException("Account is disabled");
        }
        return new UserPrincipal(user);
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long id) {
        AdminUser user = repo.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!user.isActive()) {
            throw new DisabledException("Account is disabled");
        }
        return new UserPrincipal(user);
    }
}
