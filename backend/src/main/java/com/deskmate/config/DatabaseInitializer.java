package com.deskmate.config;

import com.deskmate.model.ERole;
import com.deskmate.model.Role;
import com.deskmate.model.User;
import com.deskmate.repository.RoleRepository;
import com.deskmate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Initialize roles if they don't exist
        initRoles();
        
        // Create default admin user if it doesn't exist
        createDefaultAdminUser();
        
        // Create default test user if it doesn't exist
        createDefaultTestUser();
    }

    private void initRoles() {
        if (roleRepository.count() == 0) {
            Role adminRole = new Role(ERole.ROLE_ADMIN);
            Role userRole = new Role(ERole.ROLE_USER);
            
            roleRepository.save(adminRole);
            roleRepository.save(userRole);
            
            System.out.println("Roles initialized successfully");
        }
    }

    private void createDefaultAdminUser() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User(
                    "admin",
                    "Admin User",
                    "IT",
                    "System Administrator",
                    "9876543210",
                    "admin@deskmate.com",
                    passwordEncoder.encode("admin123")
            );
            
            Set<Role> roles = new HashSet<>();
            Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                    .orElseThrow(() -> new RuntimeException("Error: Admin Role not found."));
            roles.add(adminRole);
            admin.setRoles(roles);
            
            userRepository.save(admin);
            
            System.out.println("Default admin user created successfully");
        }
    }

    private void createDefaultTestUser() {
        if (!userRepository.existsByUsername("user")) {
            User user = new User(
                    "user",
                    "Test User",
                    "HR",
                    "HR Manager",
                    "9876543211",
                    "user@deskmate.com",
                    passwordEncoder.encode("user123")
            );
            
            Set<Role> roles = new HashSet<>();
            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Error: User Role not found."));
            roles.add(userRole);
            user.setRoles(roles);
            
            userRepository.save(user);
            
            System.out.println("Default test user created successfully");
        }
    }
}
