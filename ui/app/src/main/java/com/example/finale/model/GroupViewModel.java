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

public class GroupViewModel extends ViewModel {
    private MutableLiveData<List<Group>> groups;
    private MutableLiveData<List<Group>> joinedGroups;
    private MutableLiveData<List<User>> users;

    public LiveData<List<Group>> getGroups(Context context, String apiUrl) {
        if (groups == null) {
            groups = new MutableLiveData<>();
            loadGroups(context, apiUrl);
        }
        return groups;
    }

    public LiveData<List<Group>> getJoinedGroups(Context context, String apiUrl) {
        if (joinedGroups == null) {
            joinedGroups = new MutableLiveData<>();
            loadJoinedGroups(context, apiUrl);
        }
        return joinedGroups;
    }

    public LiveData<List<User>> getAllUsers(Context context, String apiUrl, String groupId) {
        if (users == null) {
            users = new MutableLiveData<>();
            loadAllUsers(context, apiUrl, groupId);
        }
        return users;
    }

    public void loadGroups(Context context, String apiUrl) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                OkHttpClient client = new OkHttpClient();
                TokenHandler tokenHandler = new TokenHandler();
                String url = apiUrl + "/groups?type=created";

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
                                JSONArray groupsData = jsonObject.getJSONObject("data").getJSONArray("groups");
                                List<Group> tmp = new ArrayList<>();
                                for (int i = 0; i < groupsData.length(); i++) {
                                    JSONObject groupObject = groupsData.getJSONObject(i);
                                    tmp.add(new Group(
                                            groupObject.getString("_id"),
                                            groupObject.getString("name"),
                                            groupObject.optString("description", ""),
                                            groupObject.optString("thumbnail", ""),
                                            groupObject.getJSONArray("users").length(),
                                            groupObject.getJSONArray("users")
                                    ));
                                    groups.postValue(tmp);
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

    public void loadJoinedGroups(Context context, String apiUrl) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                OkHttpClient client = new OkHttpClient();
                TokenHandler tokenHandler = new TokenHandler();
                String url = apiUrl + "/groups?type=joined";

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
                                JSONArray groupsData = jsonObject.getJSONObject("data").getJSONArray("groups");
                                List<Group> tmp = new ArrayList<>();
                                for (int i = 0; i < groupsData.length(); i++) {
                                    JSONObject groupObject = groupsData.getJSONObject(i);
                                    tmp.add(new Group(
                                            groupObject.getString("_id"),
                                            groupObject.getString("name"),
                                            groupObject.optString("description", ""),
                                            groupObject.optString("thumbnail", ""),
                                            groupObject.getJSONArray("users").length(),
                                            groupObject.getJSONArray("users")
                                    ));
                                    joinedGroups.postValue(tmp);
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


    public void loadAllUsers(Context context, String apiUrl, String groupId) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                OkHttpClient client = new OkHttpClient();
                TokenHandler tokenHandler = new TokenHandler();
                String url = apiUrl + "/groups/" + groupId + "/all-users";

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
                                JSONArray usersData = jsonObject.getJSONObject("data").getJSONArray("users");
                                List<User> tmp = new ArrayList<>();
                                for (int i = 0; i < usersData.length(); i++) {
                                    JSONObject userObject = usersData.getJSONObject(i);
                                    tmp.add(new User(
                                            userObject.getString("_id"),
                                            userObject.getString("name"),
                                            userObject.getString("email"),
                                            userObject.getString("avatar")
                                    ));
                                    users.postValue(tmp);
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
