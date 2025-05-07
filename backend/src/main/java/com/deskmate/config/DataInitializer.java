package com.deskmate.config;

import com.deskmate.model.Desk;
import com.deskmate.model.MeetingRoom;
import com.deskmate.model.Role;
import com.deskmate.model.ERole;
import com.deskmate.model.User;
import com.deskmate.repository.DeskRepository;
import com.deskmate.repository.MeetingRoomRepository;
import com.deskmate.repository.RoleRepository;
import com.deskmate.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(
            MeetingRoomRepository meetingRoomRepository,
            DeskRepository deskRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // Initialize roles if they don't exist
            if (roleRepository.count() == 0) {
                roleRepository.save(new Role(ERole.ROLE_USER));
                roleRepository.save(new Role(ERole.ROLE_ADMIN));
                System.out.println("Roles initialized");
            }

            // Initialize admin user if it doesn't exist
            if (userRepository.count() == 0) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@deskmate.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setName("Admin User");
                admin.setDepartment("Administration");
                admin.setDesignation("System Administrator");
                admin.setContact("1234567890");
                
                Set<Role> roles = new HashSet<>();
                Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                        .orElseThrow(() -> new RuntimeException("Error: Role not found."));
                roles.add(adminRole);
                admin.setRoles(roles);
                
                userRepository.save(admin);
                System.out.println("Admin user created");
            }

            // Initialize meeting rooms if they don't exist
            if (meetingRoomRepository.count() == 0) {
                // Create meeting rooms
                MeetingRoom room1 = new MeetingRoom();
                room1.setRoomName("Executive Suite");
                room1.setRoomNumber("A101");
                room1.setCapacity(12);
                room1.setHasProjector(true);
                room1.setHasVideoConference(true);
                room1.setStatus(MeetingRoom.RoomStatus.VACANT);
                meetingRoomRepository.save(room1);

                MeetingRoom room2 = new MeetingRoom();
                room2.setRoomName("Brainstorm Room");
                room2.setRoomNumber("A102");
                room2.setCapacity(8);
                room2.setHasProjector(true);
                room2.setHasVideoConference(false);
                room2.setStatus(MeetingRoom.RoomStatus.VACANT);
                meetingRoomRepository.save(room2);

                MeetingRoom room3 = new MeetingRoom();
                room3.setRoomName("Focus Room");
                room3.setRoomNumber("B201");
                room3.setCapacity(4);
                room3.setHasProjector(false);
                room3.setHasVideoConference(false);
                room3.setStatus(MeetingRoom.RoomStatus.VACANT);
                meetingRoomRepository.save(room3);

                MeetingRoom room4 = new MeetingRoom();
                room4.setRoomName("Conference Hall");
                room4.setRoomNumber("C301");
                room4.setCapacity(20);
                room4.setHasProjector(true);
                room4.setHasVideoConference(true);
                room4.setStatus(MeetingRoom.RoomStatus.VACANT);
                meetingRoomRepository.save(room4);

                MeetingRoom room5 = new MeetingRoom();
                room5.setRoomName("Training Room");
                room5.setRoomNumber("C302");
                room5.setCapacity(16);
                room5.setHasProjector(true);
                room5.setHasVideoConference(true);
                room5.setStatus(MeetingRoom.RoomStatus.VACANT);
                meetingRoomRepository.save(room5);

                MeetingRoom room6 = new MeetingRoom();
                room6.setRoomName("Quick Huddle");
                room6.setRoomNumber("B202");
                room6.setCapacity(3);
                room6.setHasProjector(false);
                room6.setHasVideoConference(false);
                room6.setStatus(MeetingRoom.RoomStatus.VACANT);
                meetingRoomRepository.save(room6);

                System.out.println("Meeting rooms initialized");
            }

            // Initialize desks if they don't exist
            if (deskRepository.count() == 0) {
                // Create desks for different departments and floors
                String[] departments = {"Engineering", "Marketing", "Finance", "HR", "Product", "Sales"};
                
                // Floor 1 - Engineering and Marketing
                for (int i = 1; i <= 12; i++) {
                    Desk desk = new Desk();
                    desk.setDeskNumber("F1-" + String.format("%02d", i));
                    desk.setDepartment(i <= 8 ? "Engineering" : "Marketing");
                    desk.setXPosition(i * 50);  // Simple positioning for visualization
                    desk.setYPosition(100);     // Simple positioning for visualization
                    desk.setFloor(1);
                    desk.setStatus(Desk.DeskStatus.VACANT);
                    deskRepository.save(desk);
                }
                
                // Floor 2 - Finance and HR
                for (int i = 1; i <= 10; i++) {
                    Desk desk = new Desk();
                    desk.setDeskNumber("F2-" + String.format("%02d", i));
                    desk.setDepartment(i <= 6 ? "Finance" : "HR");
                    desk.setXPosition(i * 50);  // Simple positioning for visualization
                    desk.setYPosition(200);     // Simple positioning for visualization
                    desk.setFloor(2);
                    desk.setStatus(Desk.DeskStatus.VACANT);
                    deskRepository.save(desk);
                }
                
                // Floor 3 - Product and Sales
                for (int i = 1; i <= 14; i++) {
                    Desk desk = new Desk();
                    desk.setDeskNumber("F3-" + String.format("%02d", i));
                    desk.setDepartment(i <= 7 ? "Product" : "Sales");
                    desk.setXPosition(i * 50);  // Simple positioning for visualization
                    desk.setYPosition(300);     // Simple positioning for visualization
                    desk.setFloor(3);
                    desk.setStatus(Desk.DeskStatus.VACANT);
                    deskRepository.save(desk);
                }
                
                System.out.println("Desks initialized");
            }
        };
    }
}
