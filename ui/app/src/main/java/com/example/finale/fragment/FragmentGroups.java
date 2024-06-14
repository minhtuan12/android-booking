package com.example.finale.fragment;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.Observer;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.finale.R;
import com.example.finale.adapter.GroupAdapter;
import com.example.finale.adapter.GroupAdapter;
import com.example.finale.intent.CreateOrUpdateGroup;
import com.example.finale.model.Group;
import com.example.finale.model.GroupViewModel;

import java.util.List;


public class FragmentGroups extends Fragment implements GroupAdapter.ItemClickListener, GroupAdapter.OnFragmentInteractionListener {
    RecyclerView recyclerView;
    GroupAdapter groupAdapter;
    GroupViewModel groupViewModel;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_groups, container, false);

        return view;
    }

    @SuppressLint("SetTextI18n")
    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        groupViewModel = new ViewModelProvider(this).get(GroupViewModel.class);
        groupViewModel.getJoinedGroups(getContext(), getString(R.string.api_url)).observe(getViewLifecycleOwner(),
                new Observer<List<Group>>() {
                    @SuppressLint("NotifyDataSetChanged")
                    @Override
                    public void onChanged(List<Group> groups) {
                        groupAdapter = new GroupAdapter(getContext(), groups, FragmentGroups.this,
                                getChildFragmentManager(), FragmentGroups.this);
                        recyclerView.setAdapter(groupAdapter);
                        groupAdapter.notifyDataSetChanged();
                    }
                });
        LinearLayoutManager manager = new LinearLayoutManager(
                getContext(), RecyclerView.VERTICAL, false
        );
        recyclerView = view.findViewById(R.id.recycleView);
        recyclerView.setLayoutManager(manager);
        recyclerView.setAdapter(groupAdapter);

        groupViewModel.loadJoinedGroups(getContext(), getString(R.string.api_url));
    }

    @Override
    public void onItemClicked(int position, Group group) {

    }

    @Override
    public void onFragmentChange(Fragment newFragment) {

    }
}
