package com.deskmate.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "desks")
public class Desk {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotBlank
    @Size(max = 50)
    @Column(name = "desk_number")
    private String deskNumber;

    @Size(max = 50)
    @Column(name = "department")
    private String department;

    @Column(name = "x_coordinate")
    private Integer xPosition;
    
    @Column(name = "y_coordinate")
    private Integer yPosition;
    
    @Column(name = "floor")
    private Integer floor;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private DeskStatus status = DeskStatus.VACANT;

    // Optional: If desk is booked, who is sitting here
    @Size(max = 100)
    @Column(name = "occupant_name")
    private String occupantName;

    @Size(max = 50)
    @Column(name = "occupant_department")
    private String occupantDepartment;

    public Desk() {
    }

    public Desk(String deskNumber, String department, Integer xPosition, Integer yPosition, Integer floor) {
        this.deskNumber = deskNumber;
        this.department = department;
        this.xPosition = xPosition;
        this.yPosition = yPosition;
        this.floor = floor;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDeskNumber() {
        return deskNumber;
    }

    public void setDeskNumber(String deskNumber) {
        this.deskNumber = deskNumber;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Integer getXPosition() {
        return xPosition;
    }

    public void setXPosition(Integer xPosition) {
        this.xPosition = xPosition;
    }

    public Integer getYPosition() {
        return yPosition;
    }

    public void setYPosition(Integer yPosition) {
        this.yPosition = yPosition;
    }
    
    public Integer getFloor() {
        return floor;
    }

    public void setFloor(Integer floor) {
        this.floor = floor;
    }

    public DeskStatus getStatus() {
        return status;
    }

    public void setStatus(DeskStatus status) {
        this.status = status;
    }

    public String getOccupantName() {
        return occupantName;
    }

    public void setOccupantName(String occupantName) {
        this.occupantName = occupantName;
    }

    public String getOccupantDepartment() {
        return occupantDepartment;
    }

    public void setOccupantDepartment(String occupantDepartment) {
        this.occupantDepartment = occupantDepartment;
    }

    public enum DeskStatus {
        VACANT,
        BOOKED
    }
}
