package com.deskmate.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class BookingConflictException extends RuntimeException {
    
    public BookingConflictException(String message) {
        super(message);
    }
    
    public BookingConflictException(String resourceType, String resourceId, String date, String time) {
        super(String.format("Cannot book %s with ID %s on %s at %s as it is already booked", 
                resourceType, resourceId, date, time));
    }
}
