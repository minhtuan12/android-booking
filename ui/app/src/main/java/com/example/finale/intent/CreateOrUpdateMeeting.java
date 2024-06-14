package com.example.finale.intent;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.finale.R;
import com.example.finale.adapter.CreateBookingAdapter;
import com.example.finale.helpers.TokenHandler;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

import okhttp3.Call;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class CreateOrUpdateMeeting extends AppCompatActivity implements CreateBookingAdapter.OnItemCheckListener {
    EditText name, description;
    ImageButton submitBtn, cancelBtn;
    RecyclerView recyclerViewUser;
    TextView dayTxt, startTime, endTime;
    Calendar cStart, cEnd;
    int pickedYear, pickedMonth, pickedDay, pickedStartHour, pickedStartMinute, pickedEndHour, pickedEndMinutes;
    JSONArray selectedEmails = new JSONArray();

    private void initView() {
        name = findViewById(R.id.createBookingName);
        description = findViewById(R.id.createBookingDescription);
        dayTxt = findViewById(R.id.day);
        startTime = findViewById(R.id.startTime);
        endTime = findViewById(R.id.endTime);
        recyclerViewUser = findViewById(R.id.recycleViewUser);
        submitBtn = findViewById(R.id.bookingSubmitBtn);
        cancelBtn = findViewById(R.id.bookingCancelBtn);
        cStart = Calendar.getInstance();
        cEnd = Calendar.getInstance();
    }

    @SuppressLint("SetTextI18n")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.create_or_update_meeting);
        initView();
        LinearLayoutManager manager = new LinearLayoutManager(
                this, RecyclerView.VERTICAL, false
        );
        Intent intent = getIntent();
        recyclerViewUser.setLayoutManager(manager);
        TokenHandler tokenHandler = new TokenHandler();
        String loggedInEmail = tokenHandler.getLoggedInEmail(this);

        /* filter logged in email from members */
        JSONArray filterMembers = new JSONArray();
        try {
            JSONArray groupMembers = new JSONArray(intent.getStringExtra("members"));
            for (int i = 0; i < groupMembers.length(); i++) {
                JSONObject member = groupMembers.getJSONObject(i);
                if (!member.getString("email").equals(loggedInEmail)) {
                    filterMembers.put(member);
                }
            }
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }

        recyclerViewUser.setAdapter(
                new CreateBookingAdapter(this,
                        filterMembers,
                        selectedEmails,
                        this
                )
        );

        name.requestFocus();

        Calendar cal = Calendar.getInstance();
        int year = cal.get(Calendar.YEAR);
        int month = cal.get(Calendar.MONTH);
        int day = cal.get(Calendar.DAY_OF_MONTH);

        String currentMonth = (month + 1) < 10 ? "0" + (month + 1) : String.valueOf((month + 1));
        String formattedDay = day < 10 ? "0" + day : String.valueOf(day);
        String currentDate = formattedDay + "-" + currentMonth + "-" + year;
        dayTxt.setText(currentDate);
        dayTxt.setOnClickListener(v -> showDatePickerDialog());

        startTime.setOnClickListener(v -> showTimePickerDialog(startTime));
        endTime.setOnClickListener(v -> showTimePickerDialog(endTime));

        submitBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String nameTxt = name.getText().toString();
                String descriptionTxt = description.getText().toString();
                cStart.set(Calendar.YEAR, pickedYear);
                cStart.set(Calendar.MONTH, pickedMonth);
                cStart.set(Calendar.DAY_OF_MONTH, pickedDay);
                cStart.set(Calendar.HOUR_OF_DAY, pickedStartHour);
                cStart.set(Calendar.MINUTE, pickedStartMinute);
                cStart.set(Calendar.SECOND, 0);
                cStart.set(Calendar.MILLISECOND, 0);

                cEnd.set(Calendar.YEAR, pickedYear);
                cEnd.set(Calendar.MONTH, pickedMonth);
                cEnd.set(Calendar.DAY_OF_MONTH, pickedDay);
                cEnd.set(Calendar.HOUR_OF_DAY, pickedEndHour);
                cEnd.set(Calendar.MINUTE, pickedEndMinutes);
                cEnd.set(Calendar.SECOND, 0);
                cEnd.set(Calendar.MILLISECOND, 0);

                System.out.println(cStart.getTimeInMillis() + " " + cEnd.getTimeInMillis());

                if (nameTxt.isEmpty() || descriptionTxt.isEmpty() || selectedEmails.length() == 0) {
                    Toast.makeText(
                            getApplicationContext(),
                            "Vui lòng điền đầy đủ thông tin",
                            Toast.LENGTH_SHORT
                    ).show();
                } else {
                    if (cStart.getTimeInMillis() > cEnd.getTimeInMillis()) {
                        Toast.makeText(
                                getApplicationContext(),
                                "Vui lòng nhập thời gian kết thúc sau thời gian bắt đầu",
                                Toast.LENGTH_SHORT
                        ).show();
                    } else {

                        TokenHandler tokenHandler = new TokenHandler();
                        OkHttpClient client = new OkHttpClient();
                        String url = getString(R.string.api_url) + "/groups/" + intent.getStringExtra("groupId") + "/booking";

                        JSONObject jsonObject = new JSONObject();
                        try {
                            jsonObject.put("title", nameTxt);
                            jsonObject.put("description", descriptionTxt);
                            jsonObject.put("start_time", cStart.getTimeInMillis() / 1000);
                            jsonObject.put("end_time", cEnd.getTimeInMillis() / 1000);
                            jsonObject.put("users", selectedEmails);
                        } catch (JSONException e) {
                            throw new RuntimeException(e);
                        }

                        MediaType MEDIA_TYPE_JSON = MediaType.parse("application/json; charset=utf-8");
                        RequestBody body = RequestBody.create(jsonObject.toString(), MEDIA_TYPE_JSON);

                        Request request = new Request.Builder()
                                .url(url)
                                .addHeader("Authorization", "Bearer " + tokenHandler.getToken(getApplicationContext()))
                                .post(body)
                                .build();

                        client.newCall(request).enqueue(new okhttp3.Callback() {
                            @Override
                            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                                if (response.isSuccessful()) {
                                    Intent returnIntent = new Intent();
                                    setResult(Activity.RESULT_OK, returnIntent);
                                    finish();
                                } else {
                                    runOnUiThread(() -> {
                                        Toast.makeText(
                                                getApplicationContext(),
                                                "Đặt lịch thất bại",
                                                Toast.LENGTH_SHORT
                                        ).show();
                                    });
                                }
                            }

                            @Override
                            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                                System.out.println("Lỗi 2");
                                e.printStackTrace();
                            }
                        });
                    }
                }
            }
        });

        cancelBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                setResult(RESULT_CANCELED, null);
                finish();
            }
        });
    }

    private void showDatePickerDialog() {
        Calendar cal = Calendar.getInstance();
        int year = cal.get(Calendar.YEAR);
        int month = cal.get(Calendar.MONTH);
        int day = cal.get(Calendar.DAY_OF_MONTH);

        DatePickerDialog datePickerDialog = new DatePickerDialog(this,
                (view, year1, monthOfYear, dayOfMonth) -> {
                    String formattedDay = dayOfMonth < 10 ? "0" + dayOfMonth : String.valueOf(dayOfMonth);
                    String formattedMonth = (monthOfYear + 1) < 10 ? "0" + (monthOfYear + 1) : String.valueOf((monthOfYear + 1));
                    String date = formattedDay + "-" + formattedMonth + "-" + year1;

                    pickedDay = dayOfMonth;
                    pickedMonth = monthOfYear;
                    pickedYear = year1;
                    dayTxt.setText(date);

                }, year, month, day);
        datePickerDialog.getDatePicker().setMinDate(System.currentTimeMillis() - 1000);
        datePickerDialog.show();
    }

    private void showTimePickerDialog(TextView timeType) {
        Calendar cal = Calendar.getInstance();
        int hour = cal.get(Calendar.HOUR_OF_DAY);
        int minute = cal.get(Calendar.MINUTE);

        TimePickerDialog timePickerDialog = new TimePickerDialog(this,
                (view, hourOfDay, minuteOfHour) -> {
                    @SuppressLint("DefaultLocale")
                    String time = String.format("%02d:%02d", hourOfDay, minuteOfHour);

                    if (timeType == startTime) {
                        pickedStartHour = hourOfDay;
                        pickedStartMinute = minuteOfHour;
                    } else {
                        pickedEndHour = hourOfDay;
                        pickedEndMinutes = minuteOfHour;
                    }
                    timeType.setText(time);
                }, hour, minute, true);
        timePickerDialog.show();
    }

    @Override
    public void onItemCheck(String email, String id) throws JSONException {
        JSONObject item = new JSONObject();
        item.put("_id", id);
        item.put("email", email);
        selectedEmails.put(item);
    }

    @Override
    public JSONArray onItemUncheck(String email) throws JSONException {
        JSONArray newItems = new JSONArray();
        for (int i = 0; i < selectedEmails.length(); i++) {
            JSONObject item = selectedEmails.getJSONObject(i);
            if (!item.getString("email").equals(email)) {
                newItems.put(item);
            }
        }
        return newItems;
    }
}
