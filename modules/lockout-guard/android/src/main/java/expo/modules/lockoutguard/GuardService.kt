package expo.modules.lockoutguard

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class GuardService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var lastKickPkg: String? = null
  private var lastKickAt = 0L
  private var lastPersistAt = 0L
  private var screenOn = true
  private var awaySince = 0L
  private var usage = UsageState(todayKey(), mutableMapOf())

  private val tick = object : Runnable {
    override fun run() {
      tickOnce()
      handler.postDelayed(this, POLL_MS)
    }
  }

  private val screenReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      when (intent?.action) {
        Intent.ACTION_SCREEN_OFF -> {
          screenOn = false
          awaySince = System.currentTimeMillis()
        }
        Intent.ACTION_SCREEN_ON -> screenOn = true
      }
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    createChannel()
    usage = loadUsage()
    rollUsageDay(usage)
    liveUsage = usage
    val filter = IntentFilter().apply {
      addAction(Intent.ACTION_SCREEN_OFF)
      addAction(Intent.ACTION_SCREEN_ON)
    }
    if (Build.VERSION.SDK_INT >= 33) {
      registerReceiver(screenReceiver, filter, RECEIVER_EXPORTED)
    } else {
      registerReceiver(screenReceiver, filter)
    }
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
    try {
      unregisterReceiver(screenReceiver)
    } catch (_: Exception) {
    }
    liveUsage = null
    saveUsage(usage)
    super.onDestroy()
  }

  private fun tickOnce() {
    val watch = readWatch()
    val windowBlocked = readWindowBlocked()
    rollUsageDay(usage)
    val fast = prefs().getBoolean(KEY_FAST, false)
    val now = System.currentTimeMillis()
    val fg = if (screenOn) foregroundPackage() else null
    val watchedId = fg?.let { watch.appIdFor(it) }

    if (watchedId == null || fg == packageName) {
      if (awaySince == 0L) awaySince = now
      if (now - awaySince >= SITTING_GRACE_MS) {
        for (appId in usage.apps.keys.toList()) {
          usage.apps[appId]?.sittingMs = 0L
        }
      }
      maybePersist(usage, now)
      return
    }

    awaySince = 0L
    val row = usage.apps.getOrPut(watchedId) { AppUsage() }
    val meta = watch.byId[watchedId]
    val addMs = POLL_MS * (if (fast) 60 else 1)
    row.usedMs += addMs
    row.sittingMs += addMs

    val dailyCapMs = minutesToMs(meta?.dailyLimitMinutes)
    val scrollCapMs = minutesToMs(meta?.scrollCapMinutes)
    val cooldownMs = minutesToMs(meta?.cooldownMinutes, fast)

    var reason: String? = null
    when {
      windowBlocked.containsKey(fg) -> reason = "window"
      row.cooldownUntil > now -> reason = "cooldown"
      dailyCapMs != null && row.usedMs >= dailyCapMs -> reason = "daily"
      scrollCapMs != null && row.sittingMs >= scrollCapMs -> {
        reason = "scroll"
        row.sittingMs = 0L
        if (cooldownMs != null) row.cooldownUntil = now + cooldownMs
      }
    }

    if (reason != null) {
      saveUsage(usage)
      kick(watchedId, fg, reason, row.cooldownUntil)
    } else {
      maybePersist(usage, now)
    }
  }

  private fun kick(appId: String, pkg: String, reason: String, cooldownUntil: Long) {
    val now = System.currentTimeMillis()
    if (pkg == lastKickPkg && now - lastKickAt < 2500) return
    lastKickPkg = pkg
    lastKickAt = now
    sendHome()
    handler.postDelayed({
      openLockout(appId)
      GuardBridge.onBlocked?.invoke(appId, pkg, reason, cooldownUntil)
    }, 180)
  }

  private fun maybePersist(usage: UsageState, now: Long) {
    if (now - lastPersistAt < 1000) return
    lastPersistAt = now
    saveUsage(usage)
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

  private fun readWindowBlocked(): Map<String, String> {
    val raw = prefs().getString(KEY_BLOCKED, "[]") ?: "[]"
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

  private fun readWatch(): WatchConfig {
    val raw = prefs().getString(KEY_WATCH, "[]") ?: "[]"
    val byId = mutableMapOf<String, WatchApp>()
    val pkgToId = mutableMapOf<String, String>()
    try {
      val arr = JSONArray(raw)
      for (i in 0 until arr.length()) {
        val obj = arr.getJSONObject(i)
        val appId = obj.getString("appId")
        val packages = mutableListOf<String>()
        val pkgs = obj.optJSONArray("packages") ?: JSONArray()
        for (p in 0 until pkgs.length()) {
          val name = pkgs.optString(p)
          if (name.isNotBlank()) {
            packages.add(name)
            pkgToId[name] = appId
          }
        }
        byId[appId] = WatchApp(
          appId = appId,
          packages = packages,
          dailyLimitMinutes = obj.optInt("dailyLimitMinutes", -1).takeIf { it >= 0 },
          scrollCapMinutes = obj.optInt("scrollCapMinutes", -1).takeIf { it >= 0 },
          cooldownMinutes = obj.optInt("cooldownMinutes", -1).takeIf { it >= 0 },
        )
      }
    } catch (_: Exception) {
    }
    return WatchConfig(byId, pkgToId)
  }

  private fun loadUsage(): UsageState {
    val raw = prefs().getString(KEY_USAGE, "") ?: ""
    if (raw.isBlank()) return UsageState(todayKey(), mutableMapOf())
    return try {
      val obj = JSONObject(raw)
      val apps = mutableMapOf<String, AppUsage>()
      val bag = obj.optJSONObject("apps") ?: JSONObject()
      val keys = bag.keys()
      while (keys.hasNext()) {
        val id = keys.next()
        val row = bag.getJSONObject(id)
        apps[id] = AppUsage(
          usedMs = row.optLong("usedMs"),
          sittingMs = row.optLong("sittingMs"),
          cooldownUntil = row.optLong("cooldownUntil"),
        )
      }
      UsageState(obj.optString("date", todayKey()), apps)
    } catch (_: Exception) {
      UsageState(todayKey(), mutableMapOf())
    }
  }

  private fun saveUsage(state: UsageState) {
    val apps = JSONObject()
    for ((id, row) in state.apps) {
      apps.put(
        id,
        JSONObject()
          .put("usedMs", row.usedMs)
          .put("sittingMs", row.sittingMs)
          .put("cooldownUntil", row.cooldownUntil),
      )
    }
    prefs().edit().putString(
      KEY_USAGE,
      JSONObject().put("date", state.date).put("apps", apps).toString(),
    ).apply()
  }

  private fun rollUsageDay(state: UsageState) {
    val today = todayKey()
    if (state.date == today) return
    state.date = today
    state.apps.clear()
    saveUsage(state)
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
      description = "Keeps Lockout watching connected apps and counting real use."
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
      .setContentText("Counting real time on connected apps.")
      .setSmallIcon(android.R.drawable.ic_lock_lock)
      .setContentIntent(pending)
      .setOngoing(true)
      .setSilent(true)
      .build()
  }

  private fun prefs() = getSharedPreferences(PREFS, MODE_PRIVATE)

  companion object {
    const val PREFS = "lockout_guard"
    const val KEY_ENABLED = "enabled"
    const val KEY_BLOCKED = "blocked"
    const val KEY_WATCH = "watch"
    const val KEY_USAGE = "usage"
    const val KEY_FAST = "fast"
    @Volatile
    private var liveUsage: UsageState? = null
    private const val CHANNEL_ID = "lockout_guard"
    private const val NOTIF_ID = 42
    private const val POLL_MS = 700L
    private const val SITTING_GRACE_MS = 20_000L

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

    fun usageSnapshot(context: Context): Map<String, Any> {
      val live = liveUsage
      if (live != null && live.date == todayKey()) {
        return snapshotOf(live)
      }
      val prefs = context.getSharedPreferences(PREFS, MODE_PRIVATE)
      val raw = prefs.getString(KEY_USAGE, "") ?: ""
      val apps = mutableMapOf<String, Any>()
      var date = todayKey()
      try {
        if (raw.isNotBlank()) {
          val obj = JSONObject(raw)
          date = obj.optString("date", date)
          if (date != todayKey()) {
            return mapOf("date" to todayKey(), "apps" to emptyMap<String, Any>())
          }
          val bag = obj.optJSONObject("apps") ?: JSONObject()
          val keys = bag.keys()
          while (keys.hasNext()) {
            val id = keys.next()
            val row = bag.getJSONObject(id)
            apps[id] = mapOf(
              "usedSeconds" to (row.optLong("usedMs") / 1000L).toInt(),
              "sittingSeconds" to (row.optLong("sittingMs") / 1000L).toInt(),
              "cooldownUntil" to row.optLong("cooldownUntil"),
            )
          }
        }
      } catch (_: Exception) {
      }
      return mapOf("date" to date, "apps" to apps)
    }

    fun todayKey(): String {
      return SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    }

    fun minutesToMs(minutes: Int?, fast: Boolean = false): Long? {
      if (minutes == null || minutes <= 0) return null
      val real = minutes * 60_000L
      return if (fast) real / 60L else real
    }

    private fun snapshotOf(state: UsageState): Map<String, Any> {
      val apps = mutableMapOf<String, Any>()
      for ((id, row) in state.apps) {
        apps[id] = mapOf(
          "usedSeconds" to (row.usedMs / 1000L).toInt(),
          "sittingSeconds" to (row.sittingMs / 1000L).toInt(),
          "cooldownUntil" to row.cooldownUntil,
        )
      }
      return mapOf("date" to state.date, "apps" to apps)
    }
  }
}

private data class WatchApp(
  val appId: String,
  val packages: List<String>,
  val dailyLimitMinutes: Int?,
  val scrollCapMinutes: Int?,
  val cooldownMinutes: Int?,
)

private data class WatchConfig(
  val byId: Map<String, WatchApp>,
  private val pkgToId: Map<String, String>,
) {
  fun appIdFor(pkg: String) = pkgToId[pkg]
}

private data class AppUsage(
  var usedMs: Long = 0,
  var sittingMs: Long = 0,
  var cooldownUntil: Long = 0,
)

private data class UsageState(
  var date: String,
  val apps: MutableMap<String, AppUsage>,
)
