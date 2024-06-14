package com.example.finale;

import android.os.Bundle;
import android.view.MenuItem;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.viewpager.widget.ViewPager;

import com.example.finale.adapter.ViewPageBottom;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.floatingactionbutton.FloatingActionButton;


public class MainActivity extends AppCompatActivity {
    ViewPager viewPager;
    BottomNavigationView nav;
    ViewPageBottom adapter;
    FloatingActionButton fab;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        viewPager = findViewById(R.id.viewPage);
        nav = findViewById(R.id.nav);
        adapter = new ViewPageBottom(getSupportFragmentManager());
        viewPager.setAdapter(adapter);
//        fab = findViewById(R.id.fab);

        viewPager.addOnPageChangeListener(new ViewPager.OnPageChangeListener() {
            @Override
            public void onPageScrolled(int position, float positionOffset, int positionOffsetPixels) {

            }

            @Override
            public void onPageSelected(int position) {
                switch (position) {
                    case 0: {
                        nav.getMenu().findItem(R.id.mHome).setChecked(true);
                        break;
                    }
                    case 1: {
                        nav.getMenu().findItem(R.id.mMyGroups).setChecked(true);
                        break;
                    }
                    case 2: {
                        nav.getMenu().findItem(R.id.mGroups).setChecked(true);
                        break;
                    }
                    case 3: {
                        nav.getMenu().findItem(R.id.mYou).setChecked(true);
                        break;
                    }
                }
            }

            @Override
            public void onPageScrollStateChanged(int state) {

            }
        });

        nav.setOnNavigationItemSelectedListener(new BottomNavigationView.OnNavigationItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull MenuItem item) {
                int itemId = item.getItemId();

                if (itemId == R.id.mHome) {
                    viewPager.setCurrentItem(0);
                } else if (itemId == R.id.mMyGroups) {
                    viewPager.setCurrentItem(1);
                } else if (itemId == R.id.mGroups) {
                    viewPager.setCurrentItem(2);
                } else if (itemId == R.id.mYou) {
                    viewPager.setCurrentItem(3);
                }

                return false;
            }
        });

//        fab.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View v) {
//                Intent intent = new Intent(MainActivity.this, CreateOrUpdateSong.class);
//                startActivityForResult(intent, 1000);
//            }
//        });
    }
}