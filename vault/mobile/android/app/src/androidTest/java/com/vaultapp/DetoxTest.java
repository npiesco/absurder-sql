package com.vaultapp;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.rule.ActivityTestRule;

import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {
    @Rule
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<>(MainActivity.class, false, false);

    @Test
    public void runDetoxTests() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        SharedPreferences devSettings = context.getSharedPreferences("ReactNativeDevSettings", Context.MODE_PRIVATE);
        devSettings.edit().putString("debug_http_host", "localhost:8081").apply();
        SharedPreferences appSettings = context.getSharedPreferences("com.vaultapp_preferences", Context.MODE_PRIVATE);
        appSettings.edit().putString("debug_http_host", "localhost:8081").apply();

        DetoxConfig detoxConfig = new DetoxConfig();
        detoxConfig.idlePolicyConfig.masterTimeoutSec = 90;
        detoxConfig.idlePolicyConfig.idleResourceTimeoutSec = 60;
        detoxConfig.rnContextLoadTimeoutSec = 180;

        Detox.runTests(mActivityRule, detoxConfig);
    }
}
