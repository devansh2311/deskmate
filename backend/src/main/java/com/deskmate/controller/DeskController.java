package com.deskmate.controller;

import com.deskmate.dto.ApiResponse;
import com.deskmate.exception.BookingConflictException;
import com.deskmate.exception.ResourceNotFoundException;
import com.deskmate.model.Desk;
import com.deskmate.model.Desk.DeskStatus;
import com.deskmate.model.DeskBooking;
import com.deskmate.service.DeskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/desks")
public class DeskController {

    private final DeskService deskService;

    @Autowired
    public DeskController(DeskService deskService) {
        this.deskService = deskService;
    }

    @GetMapping
    public ResponseEntity<List<Desk>> getAllDesks(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String department) {
        
        if (status != null && department != null) {
            try {
                DeskStatus deskStatus = DeskStatus.valueOf(status.toUpperCase());
                if (deskStatus == DeskStatus.VACANT) {
                    return ResponseEntity.ok(deskService.getVacantDesksByDepartment(department));
                }
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        } else if (status != null) {
            try {
                DeskStatus deskStatus = DeskStatus.valueOf(status.toUpperCase());
                return ResponseEntity.ok(deskService.getDesksByStatus(deskStatus));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        } else if (department != null) {
            return ResponseEntity.ok(deskService.getDesksByDepartment(department));
        }
        
        return ResponseEntity.ok(deskService.getAllDesks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Desk> getDeskById(@PathVariable Long id) {
        return deskService.getDeskById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Desk", "id", id));
    }

    @GetMapping("/number/{deskNumber}")
    public ResponseEntity<Desk> getDeskByNumber(@PathVariable String deskNumber) {
        return deskService.getDeskByNumber(deskNumber)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Desk", "number", deskNumber));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Desk>> createDesk(@Valid @RequestBody Desk desk) {
        Desk savedDesk = deskService.saveDesk(desk);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Desk created successfully", savedDesk));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Desk>> updateDesk(
            @PathVariable Long id, @Valid @RequestBody Desk desk) {
        
        Desk existingDesk = deskService.getDeskById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Desk", "id", id));
        
        desk.setId(id);
        Desk updatedDesk = deskService.saveDesk(desk);
        
        return ResponseEntity.ok(ApiResponse.success("Desk updated successfully", updatedDesk));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDesk(@PathVariable Long id) {
        Desk desk = deskService.getDeskById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Desk", "id", id));
        
        deskService.deleteDesk(id);
        return ResponseEntity.ok(ApiResponse.success("Desk deleted successfully"));
    }

    @GetMapping("/available")
    public ResponseEntity<Boolean> checkDeskAvailability(
            @RequestParam Long deskId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        // Check if the desk exists first
        deskService.getDeskById(deskId)
                .orElseThrow(() -> new ResourceNotFoundException("Desk", "id", deskId));
        
        boolean isAvailable = deskService.isDeskAvailable(deskId, date);
        return ResponseEntity.ok(isAvailable);
    }

    @PostMapping("/bookings")
    public ResponseEntity<ApiResponse<DeskBooking>> bookDesk(@Valid @RequestBody DeskBooking booking) {
        try {
            DeskBooking savedBooking = deskService.bookDesk(booking);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Desk booked successfully", savedBooking));
        } catch (Exception e) {
            throw new BookingConflictException(e.getMessage());
        }
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<DeskBooking>> getBookings(
            @RequestParam(required = false) Long deskId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String friendEmail,
            @RequestParam(required = false) String department) {
        
        if (deskId != null) {
            Desk desk = deskService.getDeskById(deskId)
                    .orElseThrow(() -> new ResourceNotFoundException("Desk", "id", deskId));
            
            return ResponseEntity.ok(deskService.getBookingsByDesk(desk));
        } else if (date != null) {
            return ResponseEntity.ok(deskService.getBookingsByDate(date));
        } else if (email != null) {
            return ResponseEntity.ok(deskService.getBookingsByEmail(email));
        } else if (friendEmail != null) {
            return ResponseEntity.ok(deskService.getBookingsByFriendEmail(friendEmail));
        } else if (department != null) {
            return ResponseEntity.ok(deskService.getBookingsByDepartment(department));
        }
        
        return ResponseEntity.badRequest().build();
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelBooking(@PathVariable Long id) {
        try {
            deskService.cancelBooking(id);
            return ResponseEntity.ok(ApiResponse.success("Booking cancelled successfully"));
        } catch (Exception e) {
            throw new ResourceNotFoundException("Booking", "id", id);
        }
    }
}
