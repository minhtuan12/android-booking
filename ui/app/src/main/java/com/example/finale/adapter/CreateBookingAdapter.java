package com.example.finale.adapter;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.graphics.Typeface;
import android.text.Spannable;
import android.text.SpannableString;
import android.text.style.StyleSpan;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.RecyclerView;

import com.example.finale.R;
import com.example.finale.dialog.DialogDetailBooking;
import com.example.finale.helpers.TokenHandler;
import com.example.finale.model.Booking;
import com.example.finale.model.User;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

import okhttp3.Call;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class CreateBookingAdapter extends RecyclerView.Adapter<CreateBookingAdapter.CreateBookingViewHolder> {
    JSONArray members;
    Context context;
    JSONArray selectedEmails;
    OnItemCheckListener onItemCheckListener;

    public CreateBookingAdapter(Context context, JSONArray members, JSONArray selectedEmails, OnItemCheckListener onItemCheckListener) {
        this.context = context;
        this.members = members;
        this.selectedEmails = selectedEmails;
        this.onItemCheckListener = onItemCheckListener;
    }

    @NonNull
    @Override
    public CreateBookingViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.invite_member_item, parent, false);
        return new CreateBookingViewHolder(view);
    }

    @SuppressLint({"SetTextI18n", "ResourceAsColor"})
    @Override
    public void onBindViewHolder(@NonNull CreateBookingViewHolder holder, @SuppressLint("RecyclerView") int position) {
        if (members.length() > 0) {
            JSONObject member = null;
            try {
                member = members.getJSONObject(position);
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
            if (member == null)
                return;

            try {
                String emailTxt = member.getString("email");
                String id = member.getString("_id");
                holder.name.setText(member.getString("name"));
                holder.email.setText(emailTxt);
                holder.checkBox.setOnCheckedChangeListener(null);
                holder.checkBox.setChecked(member.optBoolean("isChecked"));
                JSONObject finalMember = member;
                holder.checkBox.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
                    @Override
                    public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                        if (isChecked) {
                            try {
                                onItemCheckListener.onItemCheck(emailTxt, id);
                            } catch (JSONException e) {
                                throw new RuntimeException(e);
                            }
                        } else {
                            try {
                                selectedEmails = onItemCheckListener.onItemUncheck(emailTxt);
                            } catch (JSONException e) {
                                throw new RuntimeException(e);
                            }
                        }
                        try {
                            finalMember.put("isChecked", isChecked);
                        } catch (JSONException e) {
                            throw new RuntimeException(e);
                        }
                    }
                });
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
        }
    }

    @Override
    public int getItemCount() {
        return members.length() > 0 ? members.length() : 0;
    }

    public class CreateBookingViewHolder extends RecyclerView.ViewHolder implements View.OnClickListener {
        private TextView name, email;
        CheckBox checkBox;

        public CreateBookingViewHolder(@NonNull View view) {
            super(view);
            name = view.findViewById(R.id.inviteName);
            email = view.findViewById(R.id.inviteEmail);
            checkBox = view.findViewById(R.id.inviteCheckbox);

            view.setOnClickListener(this);
        }

        @Override
        public void onClick(View view) {

        }
    }

    public interface OnItemCheckListener {
        void onItemCheck(String email, String id) throws JSONException;

        JSONArray onItemUncheck(String email) throws JSONException;
    }
}
