package com.example.finale.helpers;

import android.content.Context;
import android.content.SharedPreferences;

public class TokenHandler {
    public void storeLoginToken(Context context, String authToken, String email, String name, String avatar) {
        SharedPreferences prefs = context.getSharedPreferences("session", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString("token", authToken);
        editor.putString("email", email);
        editor.putString("name", name);
        editor.putString("avatar", avatar);
        editor.apply();
    }

    public String getToken(Context context) {
        SharedPreferences prefs = context.getSharedPreferences("session", Context.MODE_PRIVATE);
        return prefs.getString("token", null);
    }

    public String getLoggedInEmail(Context context) {
        SharedPreferences prefs = context.getSharedPreferences("session", Context.MODE_PRIVATE);
        return prefs.getString("email", null);
    }

    public String getLoggedInName(Context context) {
        SharedPreferences prefs = context.getSharedPreferences("session", Context.MODE_PRIVATE);
        return prefs.getString("name", null);
    }

    public String getLoggedInAvatar(Context context) {
        SharedPreferences prefs = context.getSharedPreferences("session", Context.MODE_PRIVATE);
        return prefs.getString("avatar", null);
    }


}
