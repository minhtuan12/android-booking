package com.example.finale.model;

import android.annotation.SuppressLint;
import android.content.Context;

import androidx.annotation.NonNull;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.example.finale.helpers.TokenHandler;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class CalendarViewModel extends ViewModel {
    private MutableLiveData<List<Booking>> allBookings;

    public LiveData<List<Booking>> getAllBookings(Context context, String apiUrl) {
        if (allBookings == null) {
            allBookings = new MutableLiveData<>();
            loadBookings(context, apiUrl);
        }
        return allBookings;
    }

    public void loadBookings(Context context, String apiUrl) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                OkHttpClient client = new OkHttpClient();
                TokenHandler tokenHandler = new TokenHandler();
                String url = apiUrl + "/booking";

                Request request = new Request.Builder()
                        .url(url)
                        .addHeader("Authorization", "Bearer " + tokenHandler.getToken(context))
                        .get()
                        .build();

                client.newCall(request).enqueue(new Callback() {
                    @SuppressLint("NotifyDataSetChanged")
                    @Override
                    public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                        if (response.isSuccessful()) {
                            String responseData = response.body().string();
                            try {
                                JSONObject jsonObject = new JSONObject(responseData);
                                JSONArray bookingsData = jsonObject.getJSONObject("data").getJSONArray("bookings");
                                List<Booking> tmp = new ArrayList<>();
                                System.out.println(bookingsData);
                                for (int i = 0; i < bookingsData.length(); i++) {
                                    JSONObject bookingObject = bookingsData.getJSONObject(i);
                                    tmp.add(new Booking(
                                            bookingObject.getString("_id"),
                                            bookingObject.getString("title"),
                                            bookingObject.optString("description", ""),
                                            bookingObject.getInt("start_time"),
                                            bookingObject.getInt("end_time"),
                                            bookingObject.optInt("cancel_time", -1),
                                            bookingObject.getJSONArray("users")
                                    ));
                                    allBookings.postValue(tmp);
                                }
                            } catch (JSONException e) {
                                e.printStackTrace();
                            }
                        } else {
                            System.out.println("Lỗi");
                        }
                    }

                    @Override
                    public void onFailure(@NonNull Call call, @NonNull IOException e) {
                        System.out.println("Lỗi 2");
                        e.printStackTrace();
                    }
                });
            }
        }).start();
    }
}
