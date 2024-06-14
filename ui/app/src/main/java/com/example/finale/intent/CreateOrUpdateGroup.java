package com.example.finale.intent;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.example.finale.R;
import com.example.finale.helpers.TokenHandler;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import okhttp3.Call;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class CreateOrUpdateGroup extends AppCompatActivity {
    EditText name, description;
    TextView title;
    Button submitBtn, cancelBtn;

    private void initView() {
        title = findViewById(R.id.title);
        name = findViewById(R.id.name);
        description = findViewById(R.id.description);
        submitBtn = findViewById(R.id.submitBtn);
        cancelBtn = findViewById(R.id.cancelBtn);
    }

    @SuppressLint("SetTextI18n")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.create_or_update_group);
        initView();

        name.requestFocus();

        submitBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String nameTxt = name.getText().toString();
                String descriptionTxt = description.getText().toString();

                if (nameTxt.isEmpty() || descriptionTxt.isEmpty()) {
                    Toast.makeText(
                            getApplicationContext(),
                            "Vui lòng điền đầy đủ thông tin",
                            Toast.LENGTH_SHORT
                    ).show();
                } else {
                    Intent intent = getIntent();
                    if (intent.hasExtra("id")) {
                        TokenHandler tokenHandler = new TokenHandler();
                        OkHttpClient client = new OkHttpClient();
                        String url = getString(R.string.api_url) + "/groups/" + intent.getStringExtra("id");

                        JSONObject jsonObject = new JSONObject();
                        try {
                            jsonObject.put("name", nameTxt);
                            jsonObject.put("description", descriptionTxt);
                            jsonObject.put("thumbnail", "");
                        } catch (JSONException e) {
                            throw new RuntimeException(e);
                        }

                        MediaType MEDIA_TYPE_JSON = MediaType.parse("application/json; charset=utf-8");
                        RequestBody body = RequestBody.create(jsonObject.toString(), MEDIA_TYPE_JSON);

                        Request request = new Request.Builder()
                                .url(url)
                                .addHeader("Authorization", "Bearer " + tokenHandler.getToken(getApplicationContext()))
                                .put(body)
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
                                                "Cập nhật thất bại",
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
                    } else {
                        TokenHandler tokenHandler = new TokenHandler();
                        OkHttpClient client = new OkHttpClient();
                        String url = getString(R.string.api_url) + "/groups";

                        JSONObject jsonObject = new JSONObject();
                        try {
                            jsonObject.put("name", nameTxt);
                            jsonObject.put("description", descriptionTxt);
                            jsonObject.put("thumbnail", "");
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
                                                "Tạo mới thất bại",
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

        Intent intent = getIntent();
        if (intent.hasExtra("name") && intent.hasExtra("description")) {
            title.setText("Cập nhật nhóm");
            submitBtn.setText("Cập nhật");
            name.setText(intent.getStringExtra("name"));
            name.setSelection(name.getText().length());
            description.setText(intent.getStringExtra("description"));
            new Handler().postDelayed(new Runnable() {
                @Override
                public void run() {
                    InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                    if (imm != null) {
                        imm.showSoftInput(name, InputMethodManager.SHOW_IMPLICIT);
                    }
                }
            }, 100);
        }
    }
}
