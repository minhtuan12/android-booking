package com.example.finale.fragment;

import android.annotation.SuppressLint;
import android.graphics.Outline;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewOutlineProvider;
import android.widget.CalendarView;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.Observer;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.finale.R;
import com.example.finale.adapter.CalendarAdapter;
import com.example.finale.model.Booking;
import com.example.finale.model.CalendarViewModel;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.stream.Collectors;


public class FragmentHome extends Fragment {
    private RecyclerView recyclerView;
    private CalendarAdapter adapter;
    CalendarViewModel calendarViewModel;
    private List<Booking> bookings = new ArrayList<>();
    FrameLayout frameLayout;
    CalendarView calendar;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_home, container, false);

        return view;
    }

    @SuppressLint({"SetTextI18n", "NotifyDataSetChanged"})
    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        calendarViewModel = new ViewModelProvider(this).get(CalendarViewModel.class);
        calendarViewModel.getAllBookings(getContext(), getString(R.string.api_url))
                .observe(getViewLifecycleOwner(),
                        new Observer<List<Booking>>() {
                            @SuppressLint("NotifyDataSetChanged")
                            @Override
                            public void onChanged(List<Booking> bookingList) {
                                bookings = bookingList;
                                adapter = new CalendarAdapter(getContext(), bookingList);
                                recyclerView.setAdapter(adapter);
                                adapter.notifyDataSetChanged();
                            }
                        });

        calendarViewModel.loadBookings(getContext(), getString(R.string.api_url));
        recyclerView = view.findViewById(R.id.recycleView);
        LinearLayoutManager manager = new LinearLayoutManager(
                getContext(), RecyclerView.VERTICAL, false
        );
        recyclerView.setLayoutManager(manager);
        recyclerView.setAdapter(adapter);

        calendar = view.findViewById(R.id.calendar);

        calendar.setOnDateChangeListener(new CalendarView.OnDateChangeListener() {
            @SuppressLint("NotifyDataSetChanged")
            @Override
            public void onSelectedDayChange(@NonNull CalendarView view, int year, int month, int dayOfMonth) {
                Calendar calendar1 = Calendar.getInstance();
                calendar1.set(Calendar.YEAR, year);
                calendar1.set(Calendar.MONTH, month);
                calendar1.set(Calendar.DAY_OF_MONTH, dayOfMonth);
                calendar1.set(Calendar.HOUR_OF_DAY, 0);
                calendar1.set(Calendar.MINUTE, 0);
                calendar1.set(Calendar.SECOND, 0);
                calendar1.set(Calendar.MILLISECOND, 0);

                adapter = new CalendarAdapter(getContext(),
                        getCompatibleBookings(calendar1.getTimeInMillis() / 1000, bookings));
                recyclerView.setAdapter(adapter);
                adapter.notifyDataSetChanged();
            }
        });

        frameLayout = view.findViewById(R.id.qqqq);
        frameLayout.setOutlineProvider(new ViewOutlineProvider() {
            @Override
            public void getOutline(View view, Outline outline) {
                int cornerRadius = 22;
                outline.setRoundRect(0, 0, view.getWidth(), view.getHeight(), cornerRadius);
            }
        });
        frameLayout.setClipToOutline(true);
    }

    @Override
    public void onResume() {
        super.onResume();
        calendarViewModel.getAllBookings(getContext(), getString(R.string.api_url));
    }

    public List<Booking> getCompatibleBookings(long timestamp, List<Booking> bookings) {
        long end = timestamp + 86400 - 1;

        if (!bookings.isEmpty()) {
            return bookings.stream()
                    .filter(
                            booking -> {
                                System.out.println(booking.getStartTime() + " " + timestamp);
                                return booking.getCancelTime() == -1 &&
                                        (long) booking.getStartTime() > timestamp &&
                                        (long) booking.getEndTime() < end;
                            }
                    )
                    .collect(Collectors.toList());
        }
        return bookings;
    }
}
