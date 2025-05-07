package com.deskmate.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "meeting_rooms")
public class MeetingRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    private String roomNumber;

    @NotBlank
    @Size(max = 100)
    private String roomName;

    private int capacity;

    private boolean hasProjector;

    private boolean hasVideoConference;

    @Enumerated(EnumType.STRING)
    private RoomStatus status = RoomStatus.VACANT;

    public MeetingRoom() {
    }

    public MeetingRoom(String roomNumber, String roomName, int capacity, 
                       boolean hasProjector, boolean hasVideoConference) {
        this.roomNumber = roomNumber;
        this.roomName = roomName;
        this.capacity = capacity;
        this.hasProjector = hasProjector;
        this.hasVideoConference = hasVideoConference;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public boolean isHasProjector() {
        return hasProjector;
    }

    public void setHasProjector(boolean hasProjector) {
        this.hasProjector = hasProjector;
    }

    public boolean isHasVideoConference() {
        return hasVideoConference;
    }

    public void setHasVideoConference(boolean hasVideoConference) {
        this.hasVideoConference = hasVideoConference;
    }

    public RoomStatus getStatus() {
        return status;
    }

    public void setStatus(RoomStatus status) {
        this.status = status;
    }

    public enum RoomStatus {
        VACANT,
        BOOKED
    }
}
