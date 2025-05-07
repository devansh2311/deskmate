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

        // Update room status to BOOKED
        meetingRoom.setStatus(RoomStatus.BOOKED);
        meetingRoomRepository.save(meetingRoom);

        // Save the booking
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

        // Update room status to VACANT if this is the last booking for the room on this date
        MeetingRoom meetingRoom = booking.getMeetingRoom();
        List<MeetingRoomBooking> otherBookings = bookingRepository.findByMeetingRoom(meetingRoom);
        otherBookings.removeIf(b -> b.getId().equals(bookingId));

        if (otherBookings.isEmpty()) {
            meetingRoom.setStatus(RoomStatus.VACANT);
            meetingRoomRepository.save(meetingRoom);
        }

        // Delete the booking
        bookingRepository.deleteById(bookingId);
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
