package com.deskmate.service;

import com.deskmate.model.Desk;
import com.deskmate.model.Desk.DeskStatus;
import com.deskmate.model.DeskBooking;
import com.deskmate.repository.DeskBookingRepository;
import com.deskmate.repository.DeskRepository;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class DeskService {

    private final DeskRepository deskRepository;
    private final DeskBookingRepository bookingRepository;
    private final EmailService emailService;

    @Autowired
    public DeskService(DeskRepository deskRepository,
                      DeskBookingRepository bookingRepository,
                      EmailService emailService) {
        this.deskRepository = deskRepository;
        this.bookingRepository = bookingRepository;
        this.emailService = emailService;
    }

    public List<Desk> getAllDesks() {
        return deskRepository.findAll();
    }

    public List<Desk> getDesksByStatus(DeskStatus status) {
        return deskRepository.findByStatus(status);
    }

    public List<Desk> getDesksByDepartment(String department) {
        return deskRepository.findByDepartment(department);
    }

    public List<Desk> getVacantDesksByDepartment(String department) {
        return deskRepository.findByStatusAndDepartment(DeskStatus.VACANT, department);
    }

    public Optional<Desk> getDeskById(Long id) {
        return deskRepository.findById(id);
    }

    public Optional<Desk> getDeskByNumber(String deskNumber) {
        return deskRepository.findByDeskNumber(deskNumber);
    }

    public Desk saveDesk(Desk desk) {
        return deskRepository.save(desk);
    }

    public void deleteDesk(Long id) {
        deskRepository.deleteById(id);
    }

    @Transactional
    public DeskBooking bookDesk(DeskBooking booking) throws Exception {
        // Check if the desk exists
        Desk desk = deskRepository.findById(booking.getDesk().getId())
                .orElseThrow(() -> new Exception("Desk not found"));

        // Check if the desk is already booked for the requested date
        List<DeskBooking> existingBookings = bookingRepository.findByDeskAndBookingDate(
                desk, booking.getBookingDate());

        if (!existingBookings.isEmpty()) {
            throw new Exception("Desk is already booked for the requested date");
        }

        // Update desk status and occupant information
        desk.setStatus(DeskStatus.BOOKED);
        
        if (booking.isForFriend()) {
            desk.setOccupantName(booking.getFriendName());
        } else {
            desk.setOccupantName(booking.getBookerName());
        }
        
        desk.setOccupantDepartment(booking.getDepartment());
        deskRepository.save(desk);

        // Save the booking
        DeskBooking savedBooking = bookingRepository.save(booking);

        // Send confirmation email
        try {
            emailService.sendDeskBookingConfirmation(savedBooking);
            savedBooking.setEmailSent(true);
            bookingRepository.save(savedBooking);
        } catch (MessagingException e) {
            // Log the error but don't fail the booking
            System.err.println("Failed to send email: " + e.getMessage());
        } catch (Exception e) {
            // Catch any other email-related exceptions
            System.err.println("Unexpected error sending email: " + e.getMessage());
        }

        return savedBooking;
    }

    public List<DeskBooking> getBookingsByDesk(Desk desk) {
        return bookingRepository.findByDesk(desk);
    }

    public List<DeskBooking> getBookingsByDate(LocalDate date) {
        return bookingRepository.findByBookingDate(date);
    }

    public List<DeskBooking> getBookingsByEmail(String email) {
        return bookingRepository.findByEmail(email);
    }

    public List<DeskBooking> getBookingsByFriendEmail(String friendEmail) {
        return bookingRepository.findByFriendEmail(friendEmail);
    }

    public List<DeskBooking> getBookingsByDepartment(String department) {
        return bookingRepository.findByDepartment(department);
    }

    @Transactional
    public void cancelBooking(Long bookingId) throws Exception {
        DeskBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new Exception("Booking not found"));

        // Update desk status to VACANT
        Desk desk = booking.getDesk();
        desk.setStatus(DeskStatus.VACANT);
        desk.setOccupantName(null);
        desk.setOccupantDepartment(null);
        deskRepository.save(desk);

        // Delete the booking
        bookingRepository.deleteById(bookingId);
    }

    public boolean isDeskAvailable(Long deskId, LocalDate date) {
        Optional<Desk> deskOpt = deskRepository.findById(deskId);
        if (deskOpt.isEmpty()) {
            return false;
        }

        Desk desk = deskOpt.get();
        List<DeskBooking> existingBookings = bookingRepository.findByDeskAndBookingDate(desk, date);

        return existingBookings.isEmpty();
    }
}
