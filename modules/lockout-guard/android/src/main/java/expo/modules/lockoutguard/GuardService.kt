package expo.modules.lockoutguard

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import org.json.JSONArray

class GuardService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var lastPackage: String? = null
  private var lastBlockAt = 0L

  private val tick = object : Runnable {
    override fun run() {
      checkForeground()
      handler.postDelayed(this, POLL_MS)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    createChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(
        NOTIF_ID,
        notification,
        android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
      )
    } else {
      startForeground(NOTIF_ID, notification)
    }
    handler.removeCallbacks(tick)
    handler.post(tick)
    return START_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacks(tick)
    super.onDestroy()
  }

  private fun checkForeground() {
    val blocked = readBlocked()
    if (blocked.isEmpty()) return
    val fg = foregroundPackage() ?: return
    if (fg == packageName) return
    val appId = blocked[fg] ?: return
    val now = System.currentTimeMillis()
    if (fg == lastPackage && now - lastBlockAt < 2500) return
    lastPackage = fg
    lastBlockAt = now
    sendHome()
    handler.postDelayed({
      openLockout(appId)
      GuardBridge.onBlocked?.invoke(appId, fg)
    }, 180)
  }

  private fun foregroundPackage(): String? {
    val usm = getSystemService(USAGE_STATS_SERVICE) as? UsageStatsManager ?: return null
    val end = System.currentTimeMillis()
    val events = usm.queryEvents(end - 8000, end)
    val event = UsageEvents.Event()
    var last: String? = null
    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      val resume = event.eventType == UsageEvents.Event.ACTIVITY_RESUMED ||
        event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND
      if (resume && !event.packageName.isNullOrBlank()) {
        last = event.packageName
      }
    }
    return last
  }

  private fun readBlocked(): Map<String, String> {
    val raw = getSharedPreferences(PREFS, MODE_PRIVATE).getString(KEY_BLOCKED, "[]") ?: "[]"
    val out = mutableMapOf<String, String>()
    try {
      val arr = JSONArray(raw)
      for (i in 0 until arr.length()) {
        val obj = arr.getJSONObject(i)
        out[obj.getString("packageName")] = obj.getString("appId")
      }
    } catch (_: Exception) {
    }
    return out
  }

  private fun sendHome() {
    val home = Intent(Intent.ACTION_MAIN).apply {
      addCategory(Intent.CATEGORY_HOME)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK
    }
    try {
      startActivity(home)
    } catch (_: Exception) {
    }
  }

  private fun openLockout(appId: String) {
    val launch = packageManager.getLaunchIntentForPackage(packageName) ?: return
    launch.action = Intent.ACTION_VIEW
    launch.data = android.net.Uri.parse("lockout://locked/$appId")
    launch.putExtra("lockoutAppId", appId)
    launch.addFlags(
      Intent.FLAG_ACTIVITY_NEW_TASK or
        Intent.FLAG_ACTIVITY_SINGLE_TOP or
        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
        Intent.FLAG_ACTIVITY_CLEAR_TOP,
    )
    try {
      startActivity(launch)
    } catch (_: Exception) {
    }
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = getSystemService(NotificationManager::class.java)
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Lockout guard",
      NotificationManager.IMPORTANCE_LOW,
    ).apply {
      description = "Keeps Lockout watching connected apps during a lockout."
      setShowBadge(false)
    }
    nm.createNotificationChannel(channel)
  }

  private fun buildNotification(): Notification {
    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val pending = PendingIntent.getActivity(
      this,
      0,
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Lockout is watching")
      .setContentText("Connected apps will close during a lockout.")
      .setSmallIcon(android.R.drawable.ic_lock_lock)
      .setContentIntent(pending)
      .setOngoing(true)
      .setSilent(true)
      .build()
  }

  companion object {
    const val PREFS = "lockout_guard"
    const val KEY_ENABLED = "enabled"
    const val KEY_BLOCKED = "blocked"
    private const val CHANNEL_ID = "lockout_guard"
    private const val NOTIF_ID = 42
    private const val POLL_MS = 700L

    fun start(context: Context) {
      val intent = Intent(context, GuardService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, GuardService::class.java))
    }
  }
}
