package com.deskmate.repository;

import com.deskmate.model.Desk;
import com.deskmate.model.DeskBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DeskBookingRepository extends JpaRepository<DeskBooking, Long> {
    List<DeskBooking> findByDesk(Desk desk);
    
    List<DeskBooking> findByBookingDate(LocalDate bookingDate);
    
    List<DeskBooking> findByEmail(String email);
    
    List<DeskBooking> findByFriendEmail(String friendEmail);
    
    List<DeskBooking> findByDepartment(String department);
    
    List<DeskBooking> findByDeskAndBookingDate(Desk desk, LocalDate bookingDate);
    
    List<DeskBooking> findByEmailSent(boolean emailSent);
    
    List<DeskBooking> findByIsForFriend(boolean isForFriend);
}
