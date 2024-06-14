package com.example.finale.model;

public class User {
    private String id, name, avatar, email, phone, birth;
    private int gender;

    public User(String id, String name, String avatar, String email, String phone, String birth, int gender) {
        this.id = id;
        this.name = name;
        this.avatar = avatar;
        this.email = email;
        this.phone = phone;
        this.birth = birth;
        this.gender = gender;
    }

    public User() {
    }

    public User(String name, String avatar, String email) {
        this.name = name;
        this.avatar = avatar;
        this.email = email;
    }

    public User(String id, String name, String email, String avatar) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.avatar = avatar;
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

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getBirth() {
        return birth;
    }

    public void setBirth(String birth) {
        this.birth = birth;
    }

    public int getGender() {
        return gender;
    }

    public void setGender(int gender) {
        this.gender = gender;
    }
}
