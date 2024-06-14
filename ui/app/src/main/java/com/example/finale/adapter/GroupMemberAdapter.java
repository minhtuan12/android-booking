package com.example.finale.adapter;

import android.util.SparseBooleanArray;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.finale.R;
import com.example.finale.model.Group;
import com.example.finale.model.User;
import com.google.android.material.imageview.ShapeableImageView;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class GroupMemberAdapter extends RecyclerView.Adapter<GroupMemberAdapter.GroupMemberViewHolder>{
    List<User> userList;
    Map<String, Boolean> userEmails;

    public GroupMemberAdapter(List<User> users) {
        this.userList = users;
    }

    @NonNull
    @Override
    public GroupMemberAdapter.GroupMemberViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.member_item, parent, false);
        return new GroupMemberAdapter.GroupMemberViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull GroupMemberAdapter.GroupMemberViewHolder holder, int position) {
        if (!userList.isEmpty()) {
            User user = userList.get(position);
            if (user == null)
                return;

            userEmails = new HashMap<>();

            holder.name.setText(user.getName());
            holder.email.setText(user.getEmail());
            holder.checkBox.setChecked(Boolean.TRUE.equals(userEmails.get(user.getEmail())));
            holder.checkBox.setOnCheckedChangeListener((buttonView, isChecked) -> {
                userEmails.put(user.getEmail(), isChecked);
            });
        }
    }

    @Override
    public int getItemCount() {
        return !userList.isEmpty() ? userList.size() : 0;
    }

    public class GroupMemberViewHolder extends RecyclerView.ViewHolder implements View.OnClickListener {
        private TextView name, email;
        CheckBox checkBox;
        Button submitBtn;

        public GroupMemberViewHolder(@NonNull View view) {
            super(view);
            name = view.findViewById(R.id.name);
            email = view.findViewById(R.id.email);
            checkBox = view.findViewById(R.id.checkbox);
            submitBtn = view.findViewById(R.id.submitBtnAdd);
            view.setOnClickListener(this);
        }

        @Override
        public void onClick(View view) {

        }
    }

    public Map<String, Boolean> getUserEmails() {
        return userEmails;
    }
}
