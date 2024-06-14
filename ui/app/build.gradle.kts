plugins {
    alias(libs.plugins.androidApplication)
}

android {
    namespace = "com.example.finale"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.finale"
        minSdk = 27
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
}

dependencies {

    implementation(libs.appcompat)
    implementation(libs.material)
    implementation(libs.activity)
    implementation(libs.constraintlayout)
    testImplementation(libs.junit)
    androidTestImplementation(libs.ext.junit)
    androidTestImplementation(libs.espresso.core)
    implementation("com.google.android.gms:play-services-auth:21.1.0")
    implementation(libs.credentials)
    implementation(libs.credentials.play.services.auth)
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.0")
    implementation("com.squareup.okhttp3:okhttp:4.9.0")
    implementation("androidx.fragment:fragment:1.3.6")
    implementation("com.squareup.picasso:picasso:2.71828")
}