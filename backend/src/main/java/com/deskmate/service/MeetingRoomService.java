package com.deskmate.service;

import com.deskmate.model.MeetingRoom;
import com.deskmate.model.MeetingRoom.RoomStatus;
import com.deskmate.model.MeetingRoomBooking;
import com.deskmate.repository.MeetingRoomBookingRepository;
import com.deskmate.repository.MeetingRoomRepository;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class MeetingRoomService {

    private final MeetingRoomRepository meetingRoomRepository;
    private final MeetingRoomBookingRepository bookingRepository;
    private final EmailService emailService;

    @Autowired
    public MeetingRoomService(MeetingRoomRepository meetingRoomRepository,
                             MeetingRoomBookingRepository bookingRepository,
                             EmailService emailService) {
        this.meetingRoomRepository = meetingRoomRepository;
        this.bookingRepository = bookingRepository;
        this.emailService = emailService;
    }

    public List<MeetingRoom> getAllMeetingRooms() {
        return meetingRoomRepository.findAll();
    }

    public List<MeetingRoom> getMeetingRoomsByStatus(RoomStatus status) {
        return meetingRoomRepository.findByStatus(status);
    }

    public Optional<MeetingRoom> getMeetingRoomById(Long id) {
        return meetingRoomRepository.findById(id);
    }

    public Optional<MeetingRoom> getMeetingRoomByNumber(String roomNumber) {
        return meetingRoomRepository.findByRoomNumber(roomNumber);
    }

    public List<MeetingRoom> searchMeetingRoomsByName(String roomName) {
        return meetingRoomRepository.findByRoomNameContainingIgnoreCase(roomName);
    }

    public MeetingRoom saveMeetingRoom(MeetingRoom meetingRoom) {
        return meetingRoomRepository.save(meetingRoom);
    }

    public void deleteMeetingRoom(Long id) {
        meetingRoomRepository.deleteById(id);
    }

    @Transactional
    public MeetingRoomBooking bookMeetingRoom(MeetingRoomBooking booking) throws Exception {
        // Check if the meeting room exists
        MeetingRoom meetingRoom = meetingRoomRepository.findById(booking.getMeetingRoom().getId())
                .orElseThrow(() -> new Exception("Meeting room not found"));

        // Check if the room is already booked for the requested time
        List<MeetingRoomBooking> overlappingBookings = bookingRepository.findOverlappingBookings(
                meetingRoom, booking.getBookingDate(), booking.getStartTime(), booking.getEndTime());

        if (!overlappingBookings.isEmpty()) {
            throw new Exception("Meeting room is already booked for the requested time");
        }

        // Save the booking without changing the room status
        // The room's status will be determined dynamically based on bookings
        MeetingRoomBooking savedBooking = bookingRepository.save(booking);

        // Send confirmation email
        try {
            emailService.sendMeetingRoomBookingConfirmation(savedBooking);
            savedBooking.setEmailSent(true);
            bookingRepository.save(savedBooking);
        } catch (MessagingException e) {
            // Log the error but don't fail the booking
            System.err.println("Failed to send email: " + e.getMessage());
        }

        return savedBooking;
    }

    public List<MeetingRoomBooking> getBookingsByMeetingRoom(MeetingRoom meetingRoom) {
        return bookingRepository.findByMeetingRoom(meetingRoom);
    }

    public List<MeetingRoomBooking> getBookingsByDate(LocalDate date) {
        return bookingRepository.findByBookingDate(date);
    }

    public List<MeetingRoomBooking> getBookingsByEmail(String email) {
        return bookingRepository.findByEmail(email);
    }

    @Transactional
    public void cancelBooking(Long bookingId) throws Exception {
        MeetingRoomBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new Exception("Booking not found"));

        // Delete the booking without changing the room status
        // The room's status will be determined dynamically based on bookings
        bookingRepository.deleteById(bookingId);
    }

    /**
     * Determines if a room is booked for a specific date
     * @param roomId the room ID
     * @param date the date to check
     * @return true if the room has any bookings for the date, false otherwise
     */
    public boolean isRoomBookedForDate(Long roomId, LocalDate date) {
        Optional<MeetingRoom> roomOpt = meetingRoomRepository.findById(roomId);
        if (roomOpt.isEmpty()) {
            return false;
        }

        MeetingRoom room = roomOpt.get();
        List<MeetingRoomBooking> bookingsForDate = bookingRepository.findByMeetingRoomAndBookingDate(room, date);
        
        return !bookingsForDate.isEmpty();
    }

    /**
     * Gets the current status of a room for a specific date
     * @param room the meeting room
     * @param date the date to check
     * @return BOOKED if the room has bookings for the date, VACANT otherwise
     */
    public RoomStatus getRoomStatusForDate(MeetingRoom room, LocalDate date) {
        try {
            // Get today's date to filter out past bookings
            LocalDate today = LocalDate.now();
            
            // Only consider current or future dates
            if (date.isBefore(today)) {
                // For past dates, show room as VACANT since we can't book in the past anyway
                System.out.println("Date " + date + " is in the past, showing room " + room.getRoomName() + " as VACANT");
                return RoomStatus.VACANT;
            }
            
            List<MeetingRoomBooking> bookingsForDate = bookingRepository.findByMeetingRoomAndBookingDate(room, date);
            System.out.println("Found " + (bookingsForDate != null ? bookingsForDate.size() : 0) + 
                               " bookings for room " + room.getRoomName() + " on date " + date);
            
            // If no bookings found or all bookings are in the past, room is VACANT
            if (bookingsForDate == null || bookingsForDate.isEmpty()) {
                System.out.println("No bookings found for room " + room.getRoomName() + " on date " + date + ", marking as VACANT");
                return RoomStatus.VACANT;
            }
            
            // If date is today, only consider bookings that haven't ended yet
            if (date.isEqual(today)) {
                LocalTime currentTime = LocalTime.now();
                
                // Check if there are any current or future bookings for today
                boolean hasCurrentOrFutureBookings = bookingsForDate.stream()
                    .anyMatch(booking -> booking.getEndTime().isAfter(currentTime));
                
                System.out.println("Today is " + today + ", current time is " + currentTime + 
                                  ", room " + room.getRoomName() + " has " + 
                                  (hasCurrentOrFutureBookings ? "current/future" : "only past") + 
                                  " bookings, marking as " + 
                                  (hasCurrentOrFutureBookings ? "BOOKED" : "VACANT"));
                
                return hasCurrentOrFutureBookings ? RoomStatus.BOOKED : RoomStatus.VACANT;
            }
            
            // For future dates, if there are any bookings, the room is BOOKED
            System.out.println("Date " + date + " is in the future, room " + room.getRoomName() + 
                              " has bookings, marking as BOOKED");
            return RoomStatus.BOOKED;
        } catch (Exception e) {
            // Log the error but return VACANT as a safe default
            System.err.println("Error checking room status for date: " + e.getMessage());
            e.printStackTrace();
            return RoomStatus.VACANT;
        }
    }

    /**
     * Gets the current status of a room for a specific date and time
     * @param room the meeting room
     * @param date the date to check
     * @param time the time to check (HH:MM format)
     * @return BOOKED if the room has bookings for the date and time, VACANT otherwise
     */
    public RoomStatus getRoomStatusForDateTime(MeetingRoom room, LocalDate date, LocalTime time) {
        try {
            // Get today's date to filter out past bookings
            LocalDate today = LocalDate.now();
            LocalTime currentTime = LocalTime.now();
            
            // Only consider current or future dates
            if (date.isBefore(today) || (date.isEqual(today) && time.isBefore(currentTime))) {
                // For past dates/times, show room as VACANT since we can't book in the past
                System.out.println("Date/time " + date + " " + time + " is in the past, showing room " + 
                                  room.getRoomName() + " as VACANT");
                return RoomStatus.VACANT;
            }
            
            List<MeetingRoomBooking> bookingsForDate = bookingRepository.findByMeetingRoomAndBookingDate(room, date);
            System.out.println("Found " + (bookingsForDate != null ? bookingsForDate.size() : 0) + 
                               " bookings for room " + room.getRoomName() + " on date " + date);
            
            // If no bookings found, room is VACANT
            if (bookingsForDate == null || bookingsForDate.isEmpty()) {
                System.out.println("No bookings found for room " + room.getRoomName() + " on date " + date + 
                                  ", marking as VACANT");
                return RoomStatus.VACANT;
            }
            
            // Check if any booking overlaps with the specified time
            boolean hasOverlappingBooking = bookingsForDate.stream()
                .anyMatch(booking -> {
                    LocalTime bookingStart = booking.getStartTime();
                    LocalTime bookingEnd = booking.getEndTime();
                    
                    // Check if the specified time falls within this booking's time range
                    boolean overlaps = !time.isBefore(bookingStart) && time.isBefore(bookingEnd);
                    
                    if (overlaps) {
                        System.out.println("Room " + room.getRoomName() + " is booked at " + time + 
                                          " (booking: " + bookingStart + "-" + bookingEnd + ")");
                    }
                    
                    return overlaps;
                });
            
            return hasOverlappingBooking ? RoomStatus.BOOKED : RoomStatus.VACANT;
        } catch (Exception e) {
            // Log the error but return VACANT as a safe default
            System.err.println("Error checking room status for date and time: " + e.getMessage());
            e.printStackTrace();
            return RoomStatus.VACANT;
        }
    }

    public boolean isRoomAvailable(Long roomId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        Optional<MeetingRoom> roomOpt = meetingRoomRepository.findById(roomId);
        if (roomOpt.isEmpty()) {
            return false;
        }

        MeetingRoom room = roomOpt.get();
        List<MeetingRoomBooking> overlappingBookings = bookingRepository.findOverlappingBookings(
                room, date, startTime, endTime);

        return overlappingBookings.isEmpty();
    }
}
