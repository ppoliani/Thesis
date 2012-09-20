package org.soton.pp6g11;

import android.app.Activity;
import android.os.Bundle;
import org.apache.cordova.*;

public class HelloCordobaActivity extends DroidGap {
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        super.loadUrl("http://192.168.1.72:8000/mobile/");
    }
}