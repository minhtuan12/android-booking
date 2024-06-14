package com.example.finale.fragment;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.RecyclerView;

import com.example.finale.LoginActivity;
import com.example.finale.R;
import com.example.finale.helpers.TokenHandler;
import com.example.finale.transform.CircleTransform;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.squareup.picasso.Picasso;

import java.util.HashMap;
import java.util.Objects;

public class FragmentYou extends Fragment {
    ImageView avatar;
    TextView name, email;
    Button signOutBtn;
    GoogleSignInClient mGoogleSignInClient;
    GoogleSignInOptions gso;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_you, container, false);
        return view;
    }

    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        avatar = view.findViewById(R.id.avatar);
        TokenHandler tokenHandler = new TokenHandler();
        String avatarUrl = tokenHandler.getLoggedInAvatar(requireContext());
        if (avatarUrl != null && !avatarUrl.isEmpty()) {
            Picasso.get()
                    .load(tokenHandler.getLoggedInAvatar(requireContext()))
                    .transform(new CircleTransform())
                    .into(avatar);
        }

        name = view.findViewById(R.id.profileName);
        email = view.findViewById(R.id.profileEmail);
        name.setText(tokenHandler.getLoggedInName(requireContext()));
        email.setText(tokenHandler.getLoggedInEmail(requireContext()));

        gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .requestIdToken(getString(R.string.web_client_id))
                .build();

        mGoogleSignInClient = GoogleSignIn.getClient(requireContext(), gso);


        signOutBtn = view.findViewById(R.id.signOutBtn);
        signOutBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                tokenHandler.storeLoginToken(requireContext(), "", "", "", "");
                mGoogleSignInClient.signOut().addOnCompleteListener((Activity) requireContext(), task -> {
                    Toast.makeText(requireContext(), "Đăng xuất thành công", Toast.LENGTH_SHORT).show();

                    Intent intent = new Intent(requireContext(), LoginActivity.class);
                    startActivity(intent);
                });
            }
        });
    }
}
