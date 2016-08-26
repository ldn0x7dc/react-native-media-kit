package com.demo;

import android.content.Intent; // <--- import
import android.content.res.Configuration; // <--- import
import com.facebook.react.ReactActivity;
import com.github.yamill.orientation.OrientationPackage;
import com.github.yamill.orientation.OrientationPackage;

public class MainActivity extends ReactActivity {

  @Override
        public void onConfigurationChanged(Configuration newConfig) {
          super.onConfigurationChanged(newConfig);
          Intent intent = new Intent("onConfigurationChanged");
          intent.putExtra("newConfig", newConfig);
          this.sendBroadcast(intent);
      }

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "Demo";
    }
}
