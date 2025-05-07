package com.deskmate.repository;

import com.deskmate.model.Desk;
import com.deskmate.model.Desk.DeskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeskRepository extends JpaRepository<Desk, Long> {
    List<Desk> findByStatus(DeskStatus status);
    
    Optional<Desk> findByDeskNumber(String deskNumber);
    
    List<Desk> findByDepartment(String department);
    
    List<Desk> findByStatusAndDepartment(DeskStatus status, String department);
    
    List<Desk> findByOccupantName(String occupantName);
    
    List<Desk> findByOccupantDepartment(String occupantDepartment);
}
