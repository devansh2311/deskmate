package com.deskmate.repository;

import com.deskmate.model.MeetingRoom;
import com.deskmate.model.MeetingRoom.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingRoomRepository extends JpaRepository<MeetingRoom, Long> {
    List<MeetingRoom> findByStatus(RoomStatus status);
    Optional<MeetingRoom> findByRoomNumber(String roomNumber);
    List<MeetingRoom> findByRoomNameContainingIgnoreCase(String roomName);
}
