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

public class MyGroupAdapter extends RecyclerView.Adapter<MyGroupAdapter.GroupViewHolder> {
    private Context context;
    private List<Group> groupList;
    private ItemClickListener listener;
    private OnItemDeletedListener deleteListener;
    FragmentManager fragmentManager;
    OnFragmentInteractionListener fragmentInteractionListener;

    public MyGroupAdapter(Context context, List<Group> groupList, ItemClickListener listener,
                          OnItemDeletedListener deleteListener, androidx.fragment.app.FragmentManager fragmentManager,
                          OnFragmentInteractionListener fragmentInteractionListener) {
        this.context = context;
        this.groupList = groupList;
        this.listener = listener;
        this.deleteListener = deleteListener;
        this.fragmentManager = fragmentManager;
        this.fragmentInteractionListener = fragmentInteractionListener;
    }

    @NonNull
    @Override
    public GroupViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.group_item, parent, false);
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

            holder.moreIcon.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    PopupMenu popup = new PopupMenu(v.getContext(), holder.moreIcon);
                    popup.getMenuInflater().inflate(R.menu.popup_menu, popup.getMenu());

                    popup.setOnMenuItemClickListener(new PopupMenu.OnMenuItemClickListener() {
                        @SuppressLint("NonConstantResourceId")
                        @Override
                        public boolean onMenuItemClick(MenuItem item) {
                            if (item.getItemId() == R.id.action_update) {
                                if (listener != null) {
                                    listener.onItemClicked(position, group);
                                    return true;
                                }
                            } else if (item.getItemId() == R.id.action_delete) {
                                if (deleteListener != null) {
                                    deleteListener.onItemDeleted(position, group);
                                    return true;
                                }
                            }
                            return false;
                        }
                    });

                    popup.show();
                }
            });

            holder.btnAddMember.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Intent intent = new Intent(context, AddMember.class);
                    intent.putExtra("id", group.getId());
                    context.startActivity(intent);
                }
            });

            holder.itemView.setOnClickListener(v -> {
                Fragment fragment = FragmentBooking.newInstance(group.getId(), group.getDetailMembers());
                if (fragmentInteractionListener != null) {
                    fragmentInteractionListener.onFragmentChange(fragment);
                }
            });
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

    public interface OnItemDeletedListener {
        void onItemDeleted(int position, Group group);
    }

    public interface OnFragmentInteractionListener {
        void onFragmentChange(Fragment newFragment);
    }
}
