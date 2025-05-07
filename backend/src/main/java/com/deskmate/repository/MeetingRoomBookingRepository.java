package com.deskmate.repository;

import com.deskmate.model.MeetingRoom;
import com.deskmate.model.MeetingRoomBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface MeetingRoomBookingRepository extends JpaRepository<MeetingRoomBooking, Long> {
    List<MeetingRoomBooking> findByMeetingRoom(MeetingRoom meetingRoom);
    
    List<MeetingRoomBooking> findByBookingDate(LocalDate bookingDate);
    
    List<MeetingRoomBooking> findByEmail(String email);
    
    List<MeetingRoomBooking> findByEmailSent(boolean emailSent);
    
    @Query("SELECT b FROM MeetingRoomBooking b WHERE b.meetingRoom = :room AND b.bookingDate = :date " +
           "AND ((b.startTime <= :endTime AND b.endTime >= :startTime))")
    List<MeetingRoomBooking> findOverlappingBookings(
            @Param("room") MeetingRoom room,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);
}
