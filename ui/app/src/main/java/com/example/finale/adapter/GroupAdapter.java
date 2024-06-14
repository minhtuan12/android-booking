package com.example.finale.adapter;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.PopupMenu;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.finale.R;
import com.example.finale.fragment.FragmentBooking;
import com.example.finale.intent.AddMember;
import com.example.finale.model.Group;

import java.util.List;

public class GroupAdapter extends RecyclerView.Adapter<GroupAdapter.GroupViewHolder> {
    private Context context;
    private List<Group> groupList;
    private ItemClickListener listener;
    FragmentManager fragmentManager;
    OnFragmentInteractionListener fragmentInteractionListener;

    public GroupAdapter(Context context, List<Group> groupList, ItemClickListener listener,
                        FragmentManager fragmentManager,
                        OnFragmentInteractionListener fragmentInteractionListener) {
        this.context = context;
        this.groupList = groupList;
        this.listener = listener;
        this.fragmentManager = fragmentManager;
        this.fragmentInteractionListener = fragmentInteractionListener;
    }

    @NonNull
    @Override
    public GroupViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.joined_group_item, parent, false);
        return new GroupViewHolder(view);
    }

    @SuppressLint("SetTextI18n")
    @Override
    public void onBindViewHolder(@NonNull GroupViewHolder holder, @SuppressLint("RecyclerView") int position) {
        if (!groupList.isEmpty()) {
            Group group = groupList.get(position);
            if (group == null)
                return;

            holder.name.setText(group.getName());
            holder.members.setText(Integer.toString(group.getMembers()));

            holder.itemView.setOnClickListener(v -> {
                Fragment fragment = FragmentBooking.newInstance(group.getId(), group.getDetailMembers());
                if (fragmentInteractionListener != null) {
                    fragmentInteractionListener.onFragmentChange(fragment);
                }
            });

            holder.moreIcon.setVisibility(View.INVISIBLE);
            holder.btnAddMember.setVisibility(View.INVISIBLE);
        }
    }

    @Override
    public int getItemCount() {
        return !groupList.isEmpty() ? groupList.size() : 0;
    }

    public class GroupViewHolder extends RecyclerView.ViewHolder implements View.OnClickListener {
        private TextView name, members;
        ImageButton moreIcon, btnAddMember;

        public GroupViewHolder(@NonNull View view) {
            super(view);
            name = view.findViewById(R.id.name);
            members = view.findViewById(R.id.members);
            moreIcon = view.findViewById(R.id.btnMore);
            btnAddMember = view.findViewById(R.id.btnAddMember);
            view.setOnClickListener(this);
        }

        @Override
        public void onClick(View view) {

        }
    }

    public interface ItemClickListener {
        void onItemClicked(int position, Group group);
    }

    public interface OnFragmentInteractionListener {
        void onFragmentChange(Fragment newFragment);
    }
}
