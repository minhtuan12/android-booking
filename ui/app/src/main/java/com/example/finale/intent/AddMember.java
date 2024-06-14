package com.example.finale.intent;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.Observer;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.finale.R;
import com.example.finale.adapter.GroupMemberAdapter;
import com.example.finale.helpers.TokenHandler;
import com.example.finale.model.GroupViewModel;
import com.example.finale.model.User;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import okhttp3.Call;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class AddMember extends AppCompatActivity {
    TextView name, email;
    Button submitBtn, cancelBtn;
    GroupViewModel groupViewModel;
    GroupMemberAdapter groupMemberAdapter;
    RecyclerView recyclerView;

    private void initView() {
        name = findViewById(R.id.name);
        email = findViewById(R.id.email);
        submitBtn = findViewById(R.id.submitBtnAdd);
        cancelBtn = findViewById(R.id.cancelBtnAdd);
        recyclerView = findViewById(R.id.recycleView);
    }

    @SuppressLint("SetTextI18n")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.fragment_add_member);
        initView();

        Intent intent = getIntent();

        groupViewModel = new ViewModelProvider(this).get(GroupViewModel.class);
        groupViewModel.getAllUsers(this, getString(R.string.api_url), intent.getStringExtra("id"))
                .observe(this,
                        new Observer<List<User>>() {
                            @SuppressLint("NotifyDataSetChanged")
                            @Override
                            public void onChanged(List<User> users) {
                                groupMemberAdapter = new GroupMemberAdapter(users);
                                recyclerView.setAdapter(groupMemberAdapter);
                                groupMemberAdapter.notifyDataSetChanged();
                            }
                        });
        LinearLayoutManager manager = new LinearLayoutManager(
                this, RecyclerView.VERTICAL, false
        );
        recyclerView.setLayoutManager(manager);
        recyclerView.setAdapter(groupMemberAdapter);

        groupViewModel.loadAllUsers(this, getString(R.string.api_url), intent.getStringExtra("id"));

        submitBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Map<String, Boolean> userEmailsMap = groupMemberAdapter.getUserEmails();
                JSONArray userEmails = new JSONArray();
                for (Map.Entry<String, Boolean> entry : userEmailsMap.entrySet()) {
                    if (entry.getValue()) {
                        userEmails.put(entry.getKey());
                    }
                }

                if (userEmails.length() == 0) {
                    Toast.makeText(
                            getApplicationContext(),
                            "Vui lòng chọn tài khoản",
                            Toast.LENGTH_SHORT
                    ).show();
                } else {
                    Intent intent = getIntent();
                    TokenHandler tokenHandler = new TokenHandler();
                    OkHttpClient client = new OkHttpClient();
                    String url = getString(R.string.api_url) + "/groups/" + intent.getStringExtra("id");

                    JSONObject jsonObject = new JSONObject();
                    try {
                        jsonObject.put("user_emails", userEmails);
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
                            runOnUiThread(() -> {
                                if (response.isSuccessful()) {
                                    Toast.makeText(
                                            getApplicationContext(),
                                            "Thêm thành viên thành công",
                                            Toast.LENGTH_SHORT
                                    ).show();
                                    finish();
                                } else {
                                    Toast.makeText(
                                            getApplicationContext(),
                                            "Thêm thành viên thất bại",
                                            Toast.LENGTH_SHORT
                                    ).show();
                                }
                            });
                        }

                        @Override
                        public void onFailure(@NonNull Call call, @NonNull IOException e) {
                            System.out.println("Lỗi 2");
                            e.printStackTrace();
                        }
                    });
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
}
