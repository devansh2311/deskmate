package com.deskmate.service;

import com.deskmate.model.DeskBooking;
import com.deskmate.model.MeetingRoomBooking;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private static final String SENDER_EMAIL = "devanshaggarwal23@gmail.com";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    @Autowired
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendMeetingRoomBookingConfirmation(MeetingRoomBooking booking) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        
        helper.setFrom(SENDER_EMAIL);
        helper.setTo(booking.getEmail());
        helper.setSubject("Meeting Room Booking Confirmation");
        
        String emailContent = buildMeetingRoomEmailContent(booking);
        helper.setText(emailContent, true);
        
        mailSender.send(message);
    }
    
    public void sendDeskBookingConfirmation(DeskBooking booking) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        
        helper.setFrom(SENDER_EMAIL);
        helper.setTo(booking.getEmail());
        helper.setSubject("Desk Booking Confirmation");
        
        String emailContent = buildDeskBookingEmailContent(booking, false);
        helper.setText(emailContent, true);
        
        mailSender.send(message);
        
        // If booking is for a friend, send a separate email to the friend
        if (booking.isForFriend() && booking.getFriendEmail() != null) {
            MimeMessage friendMessage = mailSender.createMimeMessage();
            MimeMessageHelper friendHelper = new MimeMessageHelper(friendMessage, true);
            
            friendHelper.setFrom(SENDER_EMAIL);
            friendHelper.setTo(booking.getFriendEmail());
            friendHelper.setSubject("Desk Booking Notification");
            
            String friendEmailContent = buildDeskBookingEmailContent(booking, true);
            friendHelper.setText(friendEmailContent, true);
            
            mailSender.send(friendMessage);
        }
    }
    
    private String buildMeetingRoomEmailContent(MeetingRoomBooking booking) {
        return "<html><body>" +
               "<h2>Meeting Room Booking Confirmation</h2>" +
               "<p>Dear " + booking.getBookerName() + ",</p>" +
               "<p>Your meeting room booking has been confirmed with the following details:</p>" +
               "<ul>" +
               "<li><strong>Room Number:</strong> " + booking.getMeetingRoom().getRoomNumber() + "</li>" +
               "<li><strong>Room Name:</strong> " + booking.getMeetingRoom().getRoomName() + "</li>" +
               "<li><strong>Date:</strong> " + booking.getBookingDate().format(DATE_FORMATTER) + "</li>" +
               "<li><strong>Time:</strong> " + booking.getStartTime().format(TIME_FORMATTER) + 
               " to " + booking.getEndTime().format(TIME_FORMATTER) + "</li>" +
               "</ul>" +
               "<p>Thank you for using our booking system.</p>" +
               "<p>Best regards,<br/>Desk Mate Team</p>" +
               "</body></html>";
    }
    
    private String buildDeskBookingEmailContent(DeskBooking booking, boolean isForFriend) {
        if (isForFriend) {
            return "<html><body>" +
                   "<h2>Desk Booking Notification</h2>" +
                   "<p>Dear " + booking.getFriendName() + ",</p>" +
                   "<p>" + booking.getBookerName() + " has booked a desk for you with the following details:</p>" +
                   "<ul>" +
                   "<li><strong>Desk Number:</strong> " + booking.getDesk().getDeskNumber() + "</li>" +
                   "<li><strong>Department:</strong> " + booking.getDepartment() + "</li>" +
                   "<li><strong>Date:</strong> " + booking.getBookingDate().format(DATE_FORMATTER) + "</li>" +
                   "</ul>" +
                   "<p>Thank you for using our booking system.</p>" +
                   "<p>Best regards,<br/>Desk Mate Team</p>" +
                   "</body></html>";
        } else {
            return "<html><body>" +
                   "<h2>Desk Booking Confirmation</h2>" +
                   "<p>Dear " + booking.getBookerName() + ",</p>" +
                   "<p>Your desk booking has been confirmed with the following details:</p>" +
                   "<ul>" +
                   "<li><strong>Desk Number:</strong> " + booking.getDesk().getDeskNumber() + "</li>" +
                   "<li><strong>Department:</strong> " + booking.getDepartment() + "</li>" +
                   "<li><strong>Date:</strong> " + booking.getBookingDate().format(DATE_FORMATTER) + "</li>" +
                   (booking.isForFriend() ? "<li><strong>Booked for:</strong> " + booking.getFriendName() + "</li>" : "") +
                   "</ul>" +
                   "<p>Thank you for using our booking system.</p>" +
                   "<p>Best regards,<br/>Desk Mate Team</p>" +
                   "</body></html>";
        }
    }
}
