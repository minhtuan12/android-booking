package com.example.finale.model;

import org.json.JSONArray;

public class Group {
    private String id, name, description, thumbnail, creator_id;
    private int members;
    private JSONArray detailMembers;

    public Group(String id, String name, String description, String thumbnail, String creator_id) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.thumbnail = thumbnail;
        this.creator_id = creator_id;
    }

    public Group() {
    }

    public Group(String id, String name, String description, String thumbnail, String creator_id, int members) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.thumbnail = thumbnail;
        this.creator_id = creator_id;
        this.members = members;
    }

    public Group(String id, String name, String description, String thumbnail, int members, JSONArray detailMembers) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.thumbnail = thumbnail;
        this.members = members;
        this.detailMembers = detailMembers;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getThumbnail() {
        return thumbnail;
    }

    public void setThumbnail(String thumbnail) {
        this.thumbnail = thumbnail;
    }

    public String getCreator_id() {
        return creator_id;
    }

    public void setCreator_id(String creator_id) {
        this.creator_id = creator_id;
    }

    public void setMembers(int members) {
        this.members = members;
    }

    public int getMembers() {
        return members;
    }

    public JSONArray getDetailMembers() {
        return detailMembers;
    }

    public void setDetailMembers(JSONArray detailMembers) {
        this.detailMembers = detailMembers;
    }
}
