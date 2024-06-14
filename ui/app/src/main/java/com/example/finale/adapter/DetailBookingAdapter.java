package com.example.finale.adapter;

import android.annotation.SuppressLint;
import android.content.Context;
import android.text.NoCopySpan;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.finale.R;
import com.example.finale.model.Booking;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

public class DetailBookingAdapter extends RecyclerView.Adapter<DetailBookingAdapter.DetailBookingViewHolder>{
    JSONArray users;
    Context context;

    public DetailBookingAdapter(Context context, JSONArray users) {
        this.context = context;
        this.users = users;
    }

    @NonNull
    @Override
    public DetailBookingViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.booking_detail_item, parent, false);
        return new DetailBookingViewHolder(view);
    }

    @SuppressLint({"SetTextI18n", "ResourceAsColor"})
    @Override
    public void onBindViewHolder(@NonNull DetailBookingViewHolder holder, @SuppressLint("RecyclerView") int position) {
        if (users.length() != 0) {
            try {
                JSONObject user = users.getJSONObject(position);
                if (user == null)
                    return;

                holder.name.setText(user.getString("name"));
                holder.email.setText(user.getString("email"));
                int attendStatus = user.getInt("status");
                if (attendStatus != 1) {
                    holder.status.setVisibility(View.INVISIBLE);
                }
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
        }
    }

    @Override
    public int getItemCount() {
        return users.length() != 0 ? users.length() : 0;
    }

    public class DetailBookingViewHolder extends RecyclerView.ViewHolder implements View.OnClickListener {
        TextView name, email;
        ImageView status;

        public DetailBookingViewHolder(@NonNull View view) {
            super(view);
            name = view.findViewById(R.id.detailName);
            email = view.findViewById(R.id.detailEmail);
            status = view.findViewById(R.id.detailStatus);
            view.setOnClickListener(this);
        }

        @Override
        public void onClick(View view) {

        }
    }
}
