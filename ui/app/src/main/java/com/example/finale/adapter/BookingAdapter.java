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

public class BookingAdapter extends RecyclerView.Adapter<BookingAdapter.BookingViewHolder> {
    List<Booking> bookings;
    Context context;

    public BookingAdapter(Context context, List<Booking> bookings) {
        this.context = context;
        this.bookings = bookings;
    }

    @NonNull
    @Override
    public BookingViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.booking_item, parent, false);
        return new BookingViewHolder(view);
    }

    @SuppressLint({"SetTextI18n", "ResourceAsColor"})
    @Override
    public void onBindViewHolder(@NonNull BookingViewHolder holder, @SuppressLint("RecyclerView") int position) {
        if (!bookings.isEmpty()) {
            Booking booking = bookings.get(position);
            if (booking == null)
                return;

            holder.title.setText(booking.getTitle());
            holder.description.setText(booking.getDescription());

            Instant instantStarTime = Instant.ofEpochSecond(booking.getStartTime());
            Instant instantEndTime = Instant.ofEpochSecond(booking.getEndTime());
            LocalDateTime dateTimeStart = LocalDateTime.ofInstant(instantStarTime, ZoneId.systemDefault());
            LocalDateTime dateTimeEnd = LocalDateTime.ofInstant(instantEndTime, ZoneId.systemDefault());
            DateTimeFormatter formatterDay = DateTimeFormatter.ofPattern("dd-MM-yyyy");
            DateTimeFormatter formatterTime = DateTimeFormatter.ofPattern("HH:mm");

            holder.period.setText(dateTimeStart.format(formatterTime) + " - " + dateTimeEnd.format(formatterTime));
            holder.day.setText(dateTimeStart.format(formatterDay));

            int status = checkBookingStatus(booking.getStartTime(), booking.getEndTime(), booking.getCancelTime());
            if (status == 0) {
                holder.status.setText("Chưa bắt đầu");
            } else if (status == 1) {
                holder.status.setText("Đang diễn ra");
            } else if (status == 3) {
                holder.status.setText("Đã kết thúc");
                holder.status.setTextColor(R.color.green);
            } else {
                holder.status.setText("Đã hủy");
                holder.status.setTextColor(R.color.red);
            }

            holder.total.setText(Integer.toString(booking.getUsers().length()));
            int attendedUsers = 0;
            for (int i = 0; i < booking.getUsers().length(); i++) {
                try {
                    JSONObject user = booking.getUsers().getJSONObject(i);
                    if (user.getInt("status") == 1) {
                        attendedUsers++;
                    }
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                }
            }
            holder.attend.setText(Integer.toString(attendedUsers));

            holder.itemView.setOnClickListener(v -> {
                AppCompatActivity activity = (AppCompatActivity) context;
                DialogDetailBooking dialogDetailBooking = DialogDetailBooking.newInstance(booking.getUsers());
                dialogDetailBooking.show(activity.getSupportFragmentManager(), "users");
            });
        }
    }

    @Override
    public int getItemCount() {
        return !bookings.isEmpty() ? bookings.size() : 0;
    }

    public class BookingViewHolder extends RecyclerView.ViewHolder implements View.OnClickListener {
        private TextView title, description, period, day, status, attend, total;

        public BookingViewHolder(@NonNull View view) {
            super(view);
            title = view.findViewById(R.id.bookingTitle);
            description = view.findViewById(R.id.bookingDescription);
            period = view.findViewById(R.id.bookingPeriod);
            day = view.findViewById(R.id.bookingDay);
            status = view.findViewById(R.id.bookingStatus);
            attend = view.findViewById(R.id.bookingAttend);
            total = view.findViewById(R.id.bookingTotalUser);
            view.setOnClickListener(this);
        }

        @Override
        public void onClick(View view) {

        }
    }

    public int checkBookingStatus(int startTime, int endTime, int cancelTime) {
        int status;
        int now = (int) Instant.now().getEpochSecond();

        if (cancelTime != -1) {
            status = 2;
        } else if ((startTime < now && now < endTime) && (cancelTime == -1)) {
            status = 1;
        } else if (startTime > now && cancelTime == -1) {
            status = 0;
        } else {
            status = 3;
        }

        return status;
    }
}
