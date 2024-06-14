package com.example.finale.adapter;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentPagerAdapter;

import com.example.finale.fragment.FragmentMyGroups;
import com.example.finale.fragment.FragmentHome;
import com.example.finale.fragment.FragmentGroups;
import com.example.finale.fragment.FragmentYou;

public class ViewPageBottom extends FragmentPagerAdapter {
    public ViewPageBottom(@NonNull FragmentManager fm) {
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
            case 3: {
                return new FragmentYou();
            }
        }

        return new FragmentHome();
    }

    @Override
    public int getCount() {
        return 4;
    }

}
