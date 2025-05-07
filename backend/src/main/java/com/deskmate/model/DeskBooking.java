package com.deskmate.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Entity
@Table(name = "desk_bookings")
public class DeskBooking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "desk_id", nullable = false)
    private Desk desk;

    @NotBlank
    @Size(max = 100)
    private String bookerName;

    @NotBlank
    @Size(max = 50)
    private String department;
    
    @NotBlank
    @Size(max = 50)
    private String designation;
    
    @NotBlank
    @Size(max = 20)
    private String contact;

    @NotBlank
    @Size(max = 50)
    private String email;

    // If booking for a friend
    private boolean isForFriend = false;

    @Size(max = 100)
    private String friendName;

    @Size(max = 50)
    private String friendEmail;

    @NotNull
    private LocalDate bookingDate;

    @Column(nullable = false)
    private boolean emailSent = false;

    public DeskBooking() {
    }

    public DeskBooking(Desk desk, String bookerName, String department, String designation, String contact, String email, 
                      LocalDate bookingDate) {
        this.desk = desk;
        this.bookerName = bookerName;
        this.department = department;
        this.designation = designation;
        this.contact = contact;
        this.email = email;
        this.bookingDate = bookingDate;
    }

    public DeskBooking(Desk desk, String bookerName, String department, String designation, String contact, String email, 
                      String friendName, String friendEmail, LocalDate bookingDate) {
        this.desk = desk;
        this.bookerName = bookerName;
        this.department = department;
        this.designation = designation;
        this.contact = contact;
        this.email = email;
        this.isForFriend = true;
        this.friendName = friendName;
        this.friendEmail = friendEmail;
        this.bookingDate = bookingDate;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Desk getDesk() {
        return desk;
    }

    public void setDesk(Desk desk) {
        this.desk = desk;
    }

    public String getBookerName() {
        return bookerName;
    }

    public void setBookerName(String bookerName) {
        this.bookerName = bookerName;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }
    
    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }
    
    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isForFriend() {
        return isForFriend;
    }

    public void setForFriend(boolean forFriend) {
        isForFriend = forFriend;
    }

    public String getFriendName() {
        return friendName;
    }

    public void setFriendName(String friendName) {
        this.friendName = friendName;
    }

    public String getFriendEmail() {
        return friendEmail;
    }

    public void setFriendEmail(String friendEmail) {
        this.friendEmail = friendEmail;
    }

    public LocalDate getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(LocalDate bookingDate) {
        this.bookingDate = bookingDate;
    }

    public boolean isEmailSent() {
        return emailSent;
    }

    public void setEmailSent(boolean emailSent) {
        this.emailSent = emailSent;
    }
}
