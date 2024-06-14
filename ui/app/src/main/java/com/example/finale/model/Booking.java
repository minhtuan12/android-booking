package com.example.finale.model;

import org.json.JSONArray;

public class Booking {
    String id, groupId, title, description;
    int startTime, endTime, cancelTime;
    JSONArray users;

    public JSONArray getUsers() {
        return users;
    }

    public void setUsers(JSONArray users) {
        this.users = users;
    }

    public Booking() {
    }

    public Booking(String id, String groupId, String title, String description, int startTime, int endTime, int cancelTime, JSONArray users) {
        this.id = id;
        this.groupId = groupId;
        this.title = title;
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.cancelTime = cancelTime;
        this.users = users;
    }

    public Booking(String id, String title, String description, int startTime, int endTime, int cancelTime, JSONArray users) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.cancelTime = cancelTime;
        this.users = users;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getGroupId() {
        return groupId;
    }

    public void setGroupId(String groupId) {
        this.groupId = groupId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getStartTime() {
        return startTime;
    }

    public void setStartTime(int startTime) {
        this.startTime = startTime;
    }

    public int getEndTime() {
        return endTime;
    }

    public void setEndTime(int endTime) {
        this.endTime = endTime;
    }

    public int getCancelTime() {
        return cancelTime;
    }

    public void setCancelTime(int cancelTime) {
        this.cancelTime = cancelTime;
    }
}
