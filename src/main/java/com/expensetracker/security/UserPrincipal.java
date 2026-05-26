package com.expensetracker.security;

import com.expensetracker.entity.AdminUser;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * UserDetails adapter around AdminUser. Exposes the underlying entity (and its
 * id) so the rest of the app can read the authenticated user from
 * SecurityContext without an extra DB lookup.
 */
@Getter
public class UserPrincipal implements UserDetails {

    private final AdminUser user;

    public UserPrincipal(AdminUser user) {
        this.user = user;
    }

    public Long getId() { return user.getId(); }

    /**
     * Tenant id of the authenticated user. {@code null} for SUPER_ADMIN —
     * who isn't bound to a company.
     */
    public Long getCompanyId() {
        return user.getCompany() == null ? null : user.getCompany().getId();
    }

    public boolean isSuperAdmin() {
        return user.isSuperAdmin();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Emit BOTH the ROLE_-prefixed authority (so hasRole('ADMIN') works) and the
        // plain authority (so hasAuthority('ADMIN') works). Different parts of the
        // codebase use different idioms — supporting both is cheaper than picking
        // a fight over conventions.
        String role = user.getRole().name();
        return List.of(
                new SimpleGrantedAuthority("ROLE_" + role),
                new SimpleGrantedAuthority(role)
        );
    }

    @Override public String  getPassword()              { return user.getPasswordHash(); }
    @Override public String  getUsername()              { return user.getEmail(); }
    @Override public boolean isAccountNonExpired()      { return true; }
    @Override public boolean isAccountNonLocked()       { return true; }
    @Override public boolean isCredentialsNonExpired()  { return true; }
    @Override public boolean isEnabled()                { return user.isActive(); }
}
