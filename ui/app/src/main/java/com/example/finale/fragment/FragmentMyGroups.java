package com.example.finale.fragment;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Typeface;
import android.os.Bundle;
import android.text.Spannable;
import android.text.SpannableString;
import android.text.style.StyleSpan;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentTransaction;
import androidx.lifecycle.Observer;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.finale.R;
import com.example.finale.adapter.MyGroupAdapter;
import com.example.finale.helpers.TokenHandler;
import com.example.finale.intent.CreateOrUpdateGroup;
import com.example.finale.model.Group;
import com.example.finale.model.GroupViewModel;

import java.io.IOException;
import java.util.List;

import okhttp3.Call;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;


public class FragmentMyGroups extends Fragment implements MyGroupAdapter.ItemClickListener, MyGroupAdapter.OnItemDeletedListener, MyGroupAdapter.OnFragmentInteractionListener {
    TextView createBtn;
    RecyclerView recyclerView;
    MyGroupAdapter myGroupAdapter;
    GroupViewModel groupViewModel;
    int REQUEST_CODE_CREATE = 1000;
    int REQUEST_CODE_UPDATE = 2000;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_my_group, container, false);

        return view;
    }

    @SuppressLint("SetTextI18n")
    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        groupViewModel = new ViewModelProvider(this).get(GroupViewModel.class);
        groupViewModel.getGroups(getContext(), getString(R.string.api_url)).observe(getViewLifecycleOwner(),
                new Observer<List<Group>>() {
                    @SuppressLint("NotifyDataSetChanged")
                    @Override
                    public void onChanged(List<Group> groups) {
                        myGroupAdapter = new MyGroupAdapter(getContext(), groups, FragmentMyGroups.this,
                                FragmentMyGroups.this, getChildFragmentManager(), FragmentMyGroups.this);
                        recyclerView.setAdapter(myGroupAdapter);
                        myGroupAdapter.notifyDataSetChanged();
                    }
                });
        LinearLayoutManager manager = new LinearLayoutManager(
                getContext(), RecyclerView.VERTICAL, false
        );
        recyclerView = view.findViewById(R.id.recycleView);
        recyclerView.setLayoutManager(manager);
        recyclerView.setAdapter(myGroupAdapter);

        groupViewModel.loadGroups(getContext(), getString(R.string.api_url));

        createBtn = view.findViewById(R.id.createBtn);
        createBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(v.getContext(), CreateOrUpdateGroup.class);
                startActivityForResult(intent, REQUEST_CODE_CREATE);
            }
        });
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQUEST_CODE_CREATE) {
            if (resultCode == Activity.RESULT_OK) {
                Toast.makeText(
                        getContext(),
                        "Tạo mới thành công",
                        Toast.LENGTH_SHORT
                ).show();
            }
        }

        if (requestCode == REQUEST_CODE_UPDATE) {
            if (resultCode == Activity.RESULT_OK) {
                Toast.makeText(
                        getContext(),
                        "Cập nhật thành công",
                        Toast.LENGTH_SHORT
                ).show();
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        groupViewModel.loadGroups(getContext(), getString(R.string.api_url));
    }

    @Override
    public void onItemClicked(int position, Group group) {
        Intent intent = new Intent(getContext(), CreateOrUpdateGroup.class);
        intent.putExtra("id", group.getId());
        intent.putExtra("name", group.getName());
        intent.putExtra("description", group.getDescription());
        startActivityForResult(intent, REQUEST_CODE_UPDATE);
    }

    @Override
    public void onItemDeleted(int position, Group group) {
        AlertDialog.Builder builder = new AlertDialog.Builder(getContext());
        builder.setTitle("Xóa nhóm");
        String message = "Ban có chắc chắn muốn xóa nhóm " + group.getName() + " không?";

        SpannableString spannableString = new SpannableString(message);
        int startIndex = message.indexOf(group.getName());
        int endIndex = startIndex + group.getName().length();
        spannableString.setSpan(new StyleSpan(Typeface.BOLD_ITALIC), startIndex, endIndex, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);

        builder.setMessage(spannableString);
        builder.setIcon(R.drawable.remove);
        builder.setPositiveButton("Xóa", new DialogInterface.OnClickListener() {
            @SuppressLint("NotifyDataSetChanged")
            @Override
            public void onClick(DialogInterface dialogInterface, int i) {
                TokenHandler tokenHandler = new TokenHandler();
                OkHttpClient client = new OkHttpClient();
                String url = getString(R.string.api_url) + "/groups/" + group.getId();

                Request request = new Request.Builder()
                        .url(url)
                        .addHeader("Authorization", "Bearer " + tokenHandler.getToken(requireContext()))
                        .delete()
                        .build();

                client.newCall(request).enqueue(new okhttp3.Callback() {
                    @Override
                    public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                        requireActivity().runOnUiThread(() -> {
                            if (response.isSuccessful()) {
                                groupViewModel.loadGroups(getContext(), getString(R.string.api_url));
                                Toast.makeText(getContext(), "Xóa thành công", Toast.LENGTH_SHORT).show();
                            } else {
                                Toast.makeText(getContext(), "Xóa thất bại", Toast.LENGTH_SHORT).show();
                            }
                        });
                    }

                    @Override
                    public void onFailure(@NonNull Call call, @NonNull IOException e) {
                        System.out.println("Lỗi 2");
                        e.printStackTrace();
                    }
                });
            }
        });
        builder.setNegativeButton("Hủy", null);
        AlertDialog dialog = builder.create();
        dialog.show();
    }

    @Override
    public void onFragmentChange(Fragment newFragment) {
        FragmentTransaction transaction = getChildFragmentManager().beginTransaction();
        transaction.replace(R.id.fragment_group_container_list, newFragment);
        transaction.addToBackStack(null);
        transaction.commit();
    }
}
