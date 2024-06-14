package com.example.finale.adapter;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentPagerAdapter;

import com.example.finale.fragment.FragmentMyGroups;
import com.example.finale.fragment.FragmentHome;
import com.example.finale.fragment.FragmentGroups;

public class ViewPageAdapter extends FragmentPagerAdapter {
    public ViewPageAdapter(@NonNull FragmentManager fm) {
        super(fm);
    }

    @NonNull
    @Override
    public Fragment getItem(int position) {
        switch (position) {
            case 0: {
                return new FragmentHome();
            }
            case 1: {
                return new FragmentMyGroups();
            }
            case 2: {
                return new FragmentGroups();
            }
        }
        return new FragmentHome();
    }

    @Override
    public int getCount() {
        return 3;
    }

    @NonNull
    @Override
    public CharSequence getPageTitle(int pos) {
        switch (pos) {
            case 0: {
                return "Danh sách";
            }
            case 1: {
                return "Thông tin";
            }
            case 2: {
                return "Tìm kiếm & thống kê";
            }
        }
        return "Danh sách";
    }
}
