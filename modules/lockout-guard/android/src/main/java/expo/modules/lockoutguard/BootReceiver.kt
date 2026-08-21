package expo.modules.lockoutguard

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    val action = intent?.action ?: return
    if (action != Intent.ACTION_BOOT_COMPLETED && action != "android.intent.action.QUICKBOOT_POWERON") {
      return
    }
    val prefs = context.getSharedPreferences(GuardService.PREFS, Context.MODE_PRIVATE)
    if (!prefs.getBoolean(GuardService.KEY_ENABLED, false)) return
    val service = Intent(context, GuardService::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      context.startForegroundService(service)
    } else {
      context.startService(service)
    }
  }
}
