package com.example.finale.dialog;

import android.media.Image;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.finale.R;
import com.example.finale.adapter.DetailBookingAdapter;

import org.json.JSONArray;
import org.json.JSONException;

public class DialogDetailBooking extends DialogFragment {
    private RecyclerView recyclerView;
    private JSONArray users;

    public static DialogDetailBooking newInstance(JSONArray users) {
        DialogDetailBooking fragment = new DialogDetailBooking();
        Bundle args = new Bundle();
        args.putString("users", users.toString());
        fragment.setArguments(args);
        return fragment;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.booking_detail_dialog, container, false);
        recyclerView = view.findViewById(R.id.detailBookingRecycleView);

        try {
            users = new JSONArray(getArguments().getString("users"));
        } catch (JSONException e) {
            e.printStackTrace();
        }
        DetailBookingAdapter adapter = new DetailBookingAdapter(getContext(), users);
        recyclerView.setAdapter(adapter);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));

        ImageButton closeButton = view.findViewById(R.id.closeBtn);
        closeButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                dismiss();
            }
        });

        return view;
    }
}
