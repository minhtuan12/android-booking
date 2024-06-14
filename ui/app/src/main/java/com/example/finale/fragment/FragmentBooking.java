package com.example.finale.fragment;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.Observer;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.finale.R;
import com.example.finale.adapter.BookingAdapter;
import com.example.finale.intent.CreateOrUpdateMeeting;
import com.example.finale.model.Booking;
import com.example.finale.model.BookingViewModel;

import org.json.JSONArray;

import java.util.List;

public class FragmentBooking extends Fragment {
    RecyclerView recyclerView;
    String groupId;
    String groupMembers;
    BookingViewModel bookingViewModel;
    BookingAdapter bookingAdapter;
    ImageButton backBtn;
    TextView bookingBtn;
    int REQUEST_BOOKING_MEETING = 4000;

    public static FragmentBooking newInstance(String data, JSONArray groupMembers) {
        FragmentBooking fragment = new FragmentBooking();
        Bundle args = new Bundle();
        args.putString("data", data);
        args.putString("groupMembers", String.valueOf(groupMembers));
        fragment.setArguments(args);
        return fragment;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_booking, container, false);
        return view;
    }

    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        if (getArguments() != null) {
            groupId = getArguments().getString("data");
            groupMembers = getArguments().getString("groupMembers");
        }
        bookingViewModel = new ViewModelProvider(this).get(BookingViewModel.class);
        bookingViewModel.getBookings(getContext(), getString(R.string.api_url), groupId).observe(getViewLifecycleOwner(),
                new Observer<List<Booking>>() {
                    @SuppressLint("NotifyDataSetChanged")
                    @Override
                    public void onChanged(List<Booking> bookings) {
                        bookingAdapter = new BookingAdapter(getContext(), bookings);
                        recyclerView.setAdapter(bookingAdapter);
                        bookingAdapter.notifyDataSetChanged();
                    }
                });
        LinearLayoutManager manager = new LinearLayoutManager(
                getContext(), RecyclerView.VERTICAL, false
        );
        recyclerView = view.findViewById(R.id.bookingRecycleView);
        recyclerView.setLayoutManager(manager);
        recyclerView.setAdapter(bookingAdapter);

        bookingViewModel.loadBookings(getContext(), getString(R.string.api_url), groupId);

        backBtn = view.findViewById(R.id.backBtn);
        backBtn.setOnClickListener(v -> {
            getParentFragmentManager().popBackStack();
        });
        requireActivity().getOnBackPressedDispatcher().addCallback(getViewLifecycleOwner(), new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                getParentFragmentManager().popBackStack();
            }
        });

        bookingBtn = view.findViewById(R.id.bookingBtn);
        bookingBtn.setOnClickListener(v -> {
            Intent intent = new Intent(getContext(), CreateOrUpdateMeeting.class);
            intent.putExtra("members", groupMembers);
            intent.putExtra("groupId", groupId);
            startActivityForResult(intent, REQUEST_BOOKING_MEETING);
        });
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQUEST_BOOKING_MEETING) {
            if (resultCode == Activity.RESULT_OK) {
                Toast.makeText(
                        getContext(),
                        "Đặt lịch thành công",
                        Toast.LENGTH_SHORT
                ).show();
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (getArguments() != null) {
            groupId = getArguments().getString("data");
            bookingViewModel.loadBookings(getContext(), getString(R.string.api_url), groupId);
        }
    }
}
