package io.nesin.onesong

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity

class SplashActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.launch_screen)

    // Delay handoff so the splash layout (with "One Song" text) is actually rendered
    Handler(Looper.getMainLooper()).postDelayed({
      startActivity(Intent(this, MainActivity::class.java))
      finish()
    }, 800)
  }
}
