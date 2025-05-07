package com.deskmate.controller;

import com.deskmate.dto.ApiResponse;
import com.deskmate.exception.BookingConflictException;
import com.deskmate.exception.ResourceNotFoundException;
import com.deskmate.model.MeetingRoom;
import com.deskmate.model.MeetingRoom.RoomStatus;
import com.deskmate.model.MeetingRoomBooking;
import com.deskmate.service.MeetingRoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/meeting-rooms")
public class MeetingRoomController {

    private final MeetingRoomService meetingRoomService;

    @Autowired
    public MeetingRoomController(MeetingRoomService meetingRoomService) {
        this.meetingRoomService = meetingRoomService;
    }

    @GetMapping
    public ResponseEntity<List<MeetingRoom>> getAllMeetingRooms(
            @RequestParam(required = false) String status) {
        
        if (status != null) {
            try {
                RoomStatus roomStatus = RoomStatus.valueOf(status.toUpperCase());
                return ResponseEntity.ok(meetingRoomService.getMeetingRoomsByStatus(roomStatus));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        
        return ResponseEntity.ok(meetingRoomService.getAllMeetingRooms());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeetingRoom> getMeetingRoomById(@PathVariable Long id) {
        return meetingRoomService.getMeetingRoomById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting Room", "id", id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<MeetingRoom>> searchMeetingRooms(@RequestParam String name) {
        return ResponseEntity.ok(meetingRoomService.searchMeetingRoomsByName(name));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MeetingRoom>> createMeetingRoom(@Valid @RequestBody MeetingRoom meetingRoom) {
        MeetingRoom savedRoom = meetingRoomService.saveMeetingRoom(meetingRoom);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Meeting room created successfully", savedRoom));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MeetingRoom>> updateMeetingRoom(
            @PathVariable Long id, @Valid @RequestBody MeetingRoom meetingRoom) {
        
        MeetingRoom existingRoom = meetingRoomService.getMeetingRoomById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting Room", "id", id));
        
        meetingRoom.setId(id);
        MeetingRoom updatedRoom = meetingRoomService.saveMeetingRoom(meetingRoom);
        
        return ResponseEntity.ok(ApiResponse.success("Meeting room updated successfully", updatedRoom));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMeetingRoom(@PathVariable Long id) {
        MeetingRoom room = meetingRoomService.getMeetingRoomById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting Room", "id", id));
        
        meetingRoomService.deleteMeetingRoom(id);
        return ResponseEntity.ok(ApiResponse.success("Meeting room deleted successfully"));
    }

    @GetMapping("/available")
    public ResponseEntity<Boolean> checkRoomAvailability(
            @RequestParam Long roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {
        
        // Check if the room exists first
        meetingRoomService.getMeetingRoomById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting Room", "id", roomId));
        
        boolean isAvailable = meetingRoomService.isRoomAvailable(roomId, date, startTime, endTime);
        return ResponseEntity.ok(isAvailable);
    }

    @PostMapping("/bookings")
    public ResponseEntity<ApiResponse<MeetingRoomBooking>> bookMeetingRoom(@Valid @RequestBody MeetingRoomBooking booking) {
        try {
            MeetingRoomBooking savedBooking = meetingRoomService.bookMeetingRoom(booking);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Meeting room booked successfully", savedBooking));
        } catch (Exception e) {
            throw new BookingConflictException(e.getMessage());
        }
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<MeetingRoomBooking>> getBookingsByRoom(
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String email) {
        
        if (roomId != null) {
            MeetingRoom room = meetingRoomService.getMeetingRoomById(roomId)
                    .orElseThrow(() -> new ResourceNotFoundException("Meeting Room", "id", roomId));
            
            return ResponseEntity.ok(meetingRoomService.getBookingsByMeetingRoom(room));
        } else if (date != null) {
            return ResponseEntity.ok(meetingRoomService.getBookingsByDate(date));
        } else if (email != null) {
            return ResponseEntity.ok(meetingRoomService.getBookingsByEmail(email));
        }
        
        return ResponseEntity.badRequest().build();
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelBooking(@PathVariable Long id) {
        try {
            meetingRoomService.cancelBooking(id);
            return ResponseEntity.ok(ApiResponse.success("Booking cancelled successfully"));
        } catch (Exception e) {
            throw new ResourceNotFoundException("Booking", "id", id);
        }
    }
}
